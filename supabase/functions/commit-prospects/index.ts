// ============================================================================
// Edge Function: commit-prospects
// ============================================================================
// Endpoint Lovable Cloud chiamato da n8n DOPO che Apify ha restituito i profili.
// Fa 2 cose atomiche (in quest'ordine):
//   1. UPSERT dei prospects in `prospects` (dedup per user_id+linkedin_url)
//   2. Chiama RPC consume_search_quota(user_id) per incrementare la quota
//
// Trade-off: se consume_search_quota fallisce per QUOTA_EXCEEDED (race tra 2 tab),
// i prospects sono GIÀ stati salvati. L'utente se li trova in lista ma riceve un
// warning quota. Accettabile per MVP — alternativa è transaction plpgsql custom.
//
// Auth: header X-Ember-Key (stessa di check-search-quota).
//
// Input (JSON body):
//   {
//     "user_id": "<uuid>",
//     "prospects": [
//       {
//         "linkedin_url": "https://...",
//         "short_data": { ... },
//         "source_search_at": "2026-04-22T10:00:00.000Z"  // opzionale, default now()
//       },
//       ...
//     ]
//   }
//
// Output success (200):
//   {
//     "ok": true,
//     "data": {
//       "prospects_saved": [{id, linkedin_url, ...}, ...],
//       "count": 25,
//       "quota": { "used": 4, "limit": 20, "remaining": 16, "reset_at": "..." }
//     }
//   }
//
// Output errori:
//   401 UNAUTHORIZED
//   400 BAD_REQUEST
//   409 QUOTA_EXCEEDED (prospects comunque salvati — vedi trade-off)
//   500 INTERNAL
// ============================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ember-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

interface ProspectInput {
  linkedin_url: string;
  short_data: Record<string, unknown>;
  source_search_at?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
  }

  // 1. Auth guard.
  //    Nome canonico: EMBER_INTERNAL_KEY (server-to-server, non è "shared" col frontend).
  const internalKey = Deno.env.get("EMBER_INTERNAL_KEY");
  if (!internalKey) {
    console.error("[commit-prospects] EMBER_INTERNAL_KEY non configurata su Lovable Secrets");
    return jsonResponse({ ok: false, code: "INTERNAL", message: "Missing EMBER_INTERNAL_KEY" }, 500);
  }
  if (req.headers.get("x-ember-key") !== internalKey) {
    return jsonResponse({ ok: false, code: "UNAUTHORIZED" }, 401);
  }

  // 2. Parse body.
  let body: { user_id?: string; prospects?: ProspectInput[] };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, code: "BAD_REQUEST", message: "Body JSON malformato" }, 400);
  }
  const userId = body?.user_id;
  const prospectsIn = body?.prospects;

  if (!userId || typeof userId !== "string") {
    return jsonResponse({ ok: false, code: "BAD_REQUEST", message: "user_id mancante" }, 400);
  }
  if (!Array.isArray(prospectsIn)) {
    return jsonResponse({ ok: false, code: "BAD_REQUEST", message: "prospects deve essere array" }, 400);
  }

  // Sanitize + filter: scarta righe senza linkedin_url.
  const now = new Date().toISOString();
  const rows = prospectsIn
    .filter((p) => p && typeof p.linkedin_url === "string" && p.linkedin_url.length > 0)
    .map((p) => ({
      user_id: userId,
      linkedin_url: p.linkedin_url.trim(),
      short_data: p.short_data ?? {},
      source_search_at: typeof p.source_search_at === "string" ? p.source_search_at : now,
    }));

  // Edge case: array vuoto (Apify non ha trovato nulla) — non consumare quota.
  if (rows.length === 0) {
    return jsonResponse({
      ok: true,
      data: {
        prospects_saved: [],
        count: 0,
        quota_consumed: false,
        note: "Nessun prospect da salvare, quota non consumata",
      },
    });
  }

  // 3. Supabase client.
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("[commit-prospects] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY mancanti");
    return jsonResponse({ ok: false, code: "INTERNAL", message: "Supabase env vars mancanti" }, 500);
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // 4. UPSERT prospects (dedup user_id+linkedin_url già enforced dal UNIQUE index).
    const { data: saved, error: upsertErr } = await supabase
      .from("prospects")
      .upsert(rows, { onConflict: "user_id,linkedin_url", ignoreDuplicates: false })
      .select("id, linkedin_url, short_data, source_search_at");

    if (upsertErr) {
      console.error("[commit-prospects] upsert error:", upsertErr);
      return jsonResponse({ ok: false, code: "INTERNAL", message: upsertErr.message }, 500);
    }

    // 5. Consume quota atomicamente via RPC. Se solleva quota_exceeded → 409.
    const { data: quotaData, error: quotaErr } = await supabase.rpc("consume_search_quota", {
      p_user_id: userId,
    });

    if (quotaErr) {
      // Distingui quota_exceeded (P0001) da altri errori.
      const msg = String(quotaErr.message || "");
      if (msg.includes("quota_exceeded")) {
        console.warn("[commit-prospects] quota exceeded after upsert — race condition", userId);
        return jsonResponse(
          {
            ok: false,
            code: "QUOTA_EXCEEDED",
            message: "Prospects salvati ma quota già esaurita (race condition tra tab?).",
            data: {
              prospects_saved: saved ?? [],
              count: (saved ?? []).length,
              quota_consumed: false,
            },
          },
          409,
        );
      }
      console.error("[commit-prospects] consume_search_quota error:", quotaErr);
      return jsonResponse({ ok: false, code: "INTERNAL", message: msg }, 500);
    }

    // 6. Response felice.
    const quota = (quotaData as Record<string, unknown>) || {};
    return jsonResponse({
      ok: true,
      data: {
        prospects_saved: saved ?? [],
        count: (saved ?? []).length,
        quota_consumed: true,
        quota: {
          used: Number(quota.searches_used_today ?? 0),
          limit: Number(quota.searches_daily_limit ?? 0),
          remaining: Number(quota.searches_remaining ?? 0),
          reset_at: quota.searches_reset_at ?? null,
        },
      },
    });
  } catch (e) {
    console.error("[commit-prospects] unexpected:", e);
    return jsonResponse({ ok: false, code: "INTERNAL", message: String(e) }, 500);
  }
});
