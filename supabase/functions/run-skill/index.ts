// ============================================================================
// Edge Function: run-skill (Gateway v3.7.2 — search_mode dinamico)
// ============================================================================
// Gateway server-side per tutte le skill Ember.
//
// v3.7.2 changelog (Pezzo 2B):
//   - Per skill='prospect-search-harvest', leggiamo `payload.search_mode`
//     ('icp' default | 'name'). source e query_snapshot della row `searches`
//     vengono valorizzati di conseguenza (es. {firstName, lastName, keywords}
//     per name-mode invece di {icp, icp_name, ...}).
//   - Forwardiamo sempre il payload originale a n8n: il workflow ha già un nodo IF
//     che switcha tra branch ICP (AI Chain) e branch name (Code: build filters).
//
// v3.7 (Pezzo 2A): tracking searches.
// v3.6.1: post-response commit-prospects.
// v3.6.0: pre-check quota lato Lovable.
// ============================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_SKILLS = new Set<string>([
  "auto-profile-setup",
  "regenerate-section",
  "prospect-finder",
  "icp-builder",
  "outreach-drafter",
  "prospect-search-harvest",
  // (Pezzo 2C in arrivo: "company-search")
]);

const SEARCH_CONSUMING_SKILLS = new Set<string>([
  "prospect-search-harvest",
  "prospect-finder",
]);

const SKILL_TIMEOUT_MS = 310_000;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// v3.7.2: costruisce source + query_snapshot per la row searches a partire dal payload.
// Centralizzato qui per non sparpagliare la logica e renderla estensibile (company in 2C).
function buildSearchAuditFromPayload(payload: Record<string, unknown>): {
  source: "icp" | "name" | "company" | "url";
  icpId: string | null;
  snapshot: Record<string, unknown>;
} {
  const mode = (payload.search_mode as string) || "icp";

  if (mode === "name") {
    return {
      source: "name",
      icpId: null,
      snapshot: {
        search_mode: "name",
        firstName: payload.firstName ?? "",
        lastName: payload.lastName ?? "",
        keywords: payload.keywords ?? "",
        locations: payload.locations ?? null,
      },
    };
  }

  if (mode === "company") {
    return {
      source: "company",
      icpId: (payload.icp_id as string) ?? null,
      snapshot: {
        search_mode: "company",
        company_name: payload.company_name ?? "",
        company_id: payload.company_id ?? null,
        icp: payload.icp ?? null,
        icp_name: payload.icp_name ?? null,
      },
    };
  }

  // default: 'icp'
  return {
    source: "icp",
    icpId: (payload.icp_id as string) ?? null,
    snapshot: {
      search_mode: "icp",
      icp: payload.icp ?? null,
      icp_name: payload.icp_name ?? null,
      icp_id: payload.icp_id ?? null,
      filters_override: payload.filters_override ?? null,
      list_name: payload.list_name ?? null,
    },
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
  }

  // 1. Config check.
  const internalKey = Deno.env.get("EMBER_INTERNAL_KEY");
  if (!internalKey) {
    console.error("[run-skill] EMBER_INTERNAL_KEY non configurata");
    return jsonResponse({ ok: false, code: "INTERNAL", message: "Missing EMBER_INTERNAL_KEY" }, 500);
  }
  const n8nBase = Deno.env.get("N8N_BASE_URL") || "https://n8n.archetipo.info/webhook";

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey) {
    console.error("[run-skill] SUPABASE_URL/SUPABASE_ANON_KEY mancanti");
    return jsonResponse({ ok: false, code: "INTERNAL", message: "Supabase env vars mancanti" }, 500);
  }

  // 2. Verifica JWT.
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) {
    return jsonResponse({ ok: false, code: "UNAUTHORIZED", message: "Missing bearer token" }, 401);
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user?.id) {
    return jsonResponse({ ok: false, code: "UNAUTHORIZED", message: "Invalid or expired token" }, 401);
  }
  const userId = userData.user.id;

  // 3. Parse body.
  let body: { skillId?: string; payload?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, code: "BAD_REQUEST", message: "Body JSON malformato" }, 400);
  }
  const skillId = body?.skillId;
  const payload = body?.payload ?? {};

  if (!skillId || typeof skillId !== "string") {
    return jsonResponse({ ok: false, code: "BAD_REQUEST", message: "skillId mancante o non valido" }, 400);
  }
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return jsonResponse({ ok: false, code: "BAD_REQUEST", message: "payload deve essere un oggetto" }, 400);
  }
  if (!ALLOWED_SKILLS.has(skillId)) {
    console.warn(`[run-skill] Skill non in whitelist: ${skillId} (user ${userId})`);
    return jsonResponse({ ok: false, code: "FORBIDDEN_SKILL", message: `Skill ${skillId} non consentita` }, 403);
  }

  const adminClient = serviceKey
    ? createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

  // 4. Pre-check quota "searches".
  if (SEARCH_CONSUMING_SKILLS.has(skillId)) {
    if (!adminClient) {
      console.error("[run-skill] SUPABASE_SERVICE_ROLE_KEY mancante — impossibile pre-checkare quota");
      return jsonResponse({ ok: false, code: "INTERNAL", message: "Service role key mancante" }, 500);
    }

    const { error: resetErr } = await adminClient.rpc("reset_searches_quota_if_due", {
      p_user_id: userId,
    });
    if (resetErr) {
      console.error("[run-skill] reset_searches_quota_if_due error:", resetErr);
      return jsonResponse({ ok: false, code: "INTERNAL", message: resetErr.message }, 500);
    }

    const { data: quotaRow, error: selErr } = await adminClient
      .from("profiles")
      .select("searches_used_today, searches_daily_limit, searches_reset_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (selErr) {
      console.error("[run-skill] select quota error:", selErr);
      return jsonResponse({ ok: false, code: "INTERNAL", message: selErr.message }, 500);
    }
    if (!quotaRow) {
      return jsonResponse({ ok: false, code: "PROFILE_NOT_FOUND", message: "Profilo non trovato" }, 404);
    }

    const used = Number(quotaRow.searches_used_today ?? 0);
    const limit = Number(quotaRow.searches_daily_limit ?? 0);
    const resetAt = quotaRow.searches_reset_at;

    if (used >= limit) {
      console.info(`[run-skill] QUOTA_EXCEEDED pre-check ${skillId} user=${userId} used=${used}/${limit}`);
      return jsonResponse(
        {
          ok: false,
          code: "QUOTA_EXCEEDED",
          message: "Hai esaurito le search di oggi. Torna domani o passa a un piano superiore.",
          data: { used, limit, remaining: 0, reset_at: resetAt },
        },
        429,
      );
    }
  }

  // 5. v3.7+ Per prospect-search-harvest: INSERT row in `searches` PRIMA di chiamare n8n.
  let searchId: string | null = null;
  const tStart = Date.now();
  if (skillId === "prospect-search-harvest" && adminClient) {
    const { source, icpId, snapshot } = buildSearchAuditFromPayload(payload);
    const { data: searchRow, error: searchErr } = await adminClient
      .from("searches")
      .insert({
        user_id: userId,
        source,
        icp_id: icpId,
        query_snapshot: snapshot,
        status: "running",
        prospect_count: 0,
      } as any)
      .select("id")
      .single();
    if (searchErr) {
      console.warn("[run-skill] searches insert failed (non-fatal):", searchErr.message);
    } else {
      searchId = (searchRow as any)?.id ?? null;
    }
  }

  // 6. Inietta user_id autoritativo dal JWT.
  const forwardBody = { ...payload, user_id: userId };

  // 7. Forward a n8n.
  const targetUrl = `${n8nBase}/ember/${skillId}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SKILL_TIMEOUT_MS);

  try {
    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Ember-Key": internalKey,
      },
      body: JSON.stringify(forwardBody),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const text = await upstream.text();

    // 8. Post-response per prospect-search-harvest: commit + UPDATE searches.
    if (skillId === "prospect-search-harvest" && upstream.status === 200) {
      try {
        const parsed = JSON.parse(text);
        const prospects = parsed?.data?.prospects;
        const durationMs = Date.now() - tStart;

        if (Array.isArray(prospects) && prospects.length > 0 && serviceKey) {
          const commitUrl = `${supabaseUrl}/functions/v1/commit-prospects`;
          const commitResp = await fetch(commitUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceKey}`,
              "apikey": serviceKey,
              "x-ember-key": internalKey,
            },
            body: JSON.stringify({
              user_id: userId,
              prospects,
              search_id: searchId,
            }),
          });
          if (!commitResp.ok) {
            const commitErr = await commitResp.text();
            console.error(`[run-skill] commit-prospects failed (${commitResp.status}):`, commitErr.slice(0, 300));
            if (searchId && adminClient) {
              await adminClient
                .from("searches")
                .update({
                  status: "error",
                  error_message: `commit-prospects failed: ${commitResp.status}`,
                  duration_ms: durationMs,
                } as any)
                .eq("id", searchId);
            }
          } else {
            try {
              const commitJson = await commitResp.json();
              const saved = commitJson?.data?.prospects_saved || commitJson?.data?.prospects || prospects;
              const savedCount = commitJson?.data?.count ?? saved.length;

              parsed.data.prospects = saved;
              parsed.data.count_saved = savedCount;
              parsed.data.search_id = searchId;
              parsed.quota_consumed = {
                searches: 1,
                remaining_today: commitJson?.data?.quota?.remaining ?? null,
              };

              if (searchId && adminClient) {
                await adminClient
                  .from("searches")
                  .update({
                    status: "completed",
                    prospect_count: savedCount,
                    duration_ms: durationMs,
                  } as any)
                  .eq("id", searchId);
              }

              return new Response(JSON.stringify(parsed), {
                status: 200,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
              });
            } catch (parseErr) {
              console.warn("[run-skill] commit response parse failed:", parseErr);
            }
          }
        } else {
          // Nessun prospect trovato: marca searches come completed con count=0.
          if (searchId && adminClient) {
            await adminClient
              .from("searches")
              .update({
                status: "completed",
                prospect_count: 0,
                duration_ms: durationMs,
              } as any)
              .eq("id", searchId);
          }
        }
      } catch (parseErr) {
        console.warn("[run-skill] post-response parse failed (non-fatal):", parseErr);
        if (searchId && adminClient) {
          await adminClient
            .from("searches")
            .update({
              status: "error",
              error_message: "Response upstream non parsabile",
              duration_ms: Date.now() - tStart,
            } as any)
            .eq("id", searchId);
        }
      }
    }

    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err) {
    clearTimeout(timer);
    const isAbort = err instanceof DOMException && err.name === "AbortError";

    if (searchId && adminClient) {
      await adminClient
        .from("searches")
        .update({
          status: "error",
          error_message: isAbort ? "n8n timeout" : `Upstream error: ${String(err)}`,
          duration_ms: Date.now() - tStart,
        } as any)
        .eq("id", searchId);
    }

    if (isAbort) {
      console.error(`[run-skill] Timeout n8n su ${skillId} (user ${userId})`);
      return jsonResponse({ ok: false, code: "UPSTREAM_TIMEOUT", message: `n8n non ha risposto entro ${Math.round(SKILL_TIMEOUT_MS / 1000)}s` }, 504);
    }
    console.error(`[run-skill] Errore upstream n8n:`, err);
    return jsonResponse({ ok: false, code: "UPSTREAM_ERROR", message: String(err) }, 502);
  }
});
