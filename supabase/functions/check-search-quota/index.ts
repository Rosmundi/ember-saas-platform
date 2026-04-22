// ============================================================================
// Edge Function: check-search-quota
// ============================================================================
// Endpoint chiamato da n8n PRIMA di lanciare Apify, per verificare se l'utente
// ha quota disponibile.
//
// Auth: header X-Ember-Key (deve matchare EMBER_SHARED_KEY su Lovable Secrets).
//
// Input (JSON body): { "user_id": "<uuid>" }
//
// Output success (200):
//   { "ok": true, "data": { "used": 3, "limit": 20, "remaining": 17, "reset_at": "..." } }
//
// Output quota piena (200, ok=false):
//   { "ok": false, "code": "QUOTA_EXCEEDED", "data": {...stesso shape...} }
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
  }

  // 1. Auth guard.
  const sharedKey = Deno.env.get("EMBER_SHARED_KEY");
  if (!sharedKey) {
    console.error("[check-search-quota] EMBER_SHARED_KEY non configurata");
    return jsonResponse({ ok: false, code: "INTERNAL", message: "Missing EMBER_SHARED_KEY" }, 500);
  }
  if (req.headers.get("x-ember-key") !== sharedKey) {
    return jsonResponse({ ok: false, code: "UNAUTHORIZED" }, 401);
  }

  // 2. Parse body.
  let body: { user_id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, code: "BAD_REQUEST", message: "Body JSON malformato" }, 400);
  }
  const userId = body?.user_id;
  if (!userId || typeof userId !== "string") {
    return jsonResponse({ ok: false, code: "BAD_REQUEST", message: "user_id mancante o non valido" }, 400);
  }

  // 3. Supabase client (service_role auto-iniettato da Lovable Cloud).
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ ok: false, code: "INTERNAL", message: "Supabase env vars mancanti" }, 500);
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // 4. Riaccredita quota se finestra giornaliera scaduta.
    const { error: resetErr } = await supabase.rpc("reset_searches_quota_if_due", { p_user_id: userId });
    if (resetErr) {
      console.error("[check-search-quota] reset RPC error:", resetErr);
      return jsonResponse({ ok: false, code: "INTERNAL", message: resetErr.message }, 500);
    }

    // 5. Leggi stato fresco.
    const { data, error: selErr } = await supabase
      .from("profiles")
      .select("searches_used_today, searches_daily_limit, searches_reset_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (selErr) {
      return jsonResponse({ ok: false, code: "INTERNAL", message: selErr.message }, 500);
    }
    if (!data) {
      return jsonResponse({ ok: false, code: "PROFILE_NOT_FOUND" }, 404);
    }

    const used = Number(data.searches_used_today ?? 0);
    const limit = Number(data.searches_daily_limit ?? 0);
    const remaining = Math.max(limit - used, 0);
    const quotaInfo = { used, limit, remaining, reset_at: data.searches_reset_at };

    if (used < limit) {
      return jsonResponse({ ok: true, data: quotaInfo });
    } else {
      return jsonResponse({ ok: false, code: "QUOTA_EXCEEDED", data: quotaInfo });
    }
  } catch (e) {
    console.error("[check-search-quota] unexpected:", e);
    return jsonResponse({ ok: false, code: "INTERNAL", message: String(e) }, 500);
  }
});
