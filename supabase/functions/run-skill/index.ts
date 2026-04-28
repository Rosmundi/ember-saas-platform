// ============================================================================
// Edge Function: run-skill (Gateway v3.7 — search_id support)
// ============================================================================
// Gateway server-side per tutte le skill Ember. Sostituisce la chiamata diretta
// browser→n8n.
//
// v3.7 changelog (Pezzo 2A):
//   - Per skill='prospect-search-harvest':
//     a) PRE-RESPONSE: inserisce una row in `searches` (status='running',
//        prospect_count=0) PRIMA di chiamare n8n. L'id viene poi passato a
//        commit-prospects e ritornato al client.
//     b) POST-RESPONSE: UPDATE della stessa row con prospect_count, duration_ms,
//        status='completed' (o 'error' se commit fallisce).
//     c) commit-prospects ora accetta search_id e lo scrive su ogni prospect upsert.
//
// v3.6.1 (post-response commit per prospect-search-harvest):
//   - Workflow n8n harvest semplificato: ritorna solo prospects normalizzati.
//     run-skill: (a) pre-check quota, (b) post-response commit-prospects atomico
//     (upsert + consume_search_quota).
//
// v3.6.0 (refactor quota Ember):
//   - Pre-check quota "searches" lato Lovable PRIMA di chiamare n8n.
//   - Nessun cambio per le altre skill (auto-profile-setup, icp-builder, ecc.).
//
// Chiamante: Frontend via supabase.functions.invoke('run-skill', { ... })
//
// Auth:
//   - Authorization: Bearer <JWT utente Supabase>
//   - user_id autoritativo dal claim `sub` (NON spoofabile dal client).
//
// Input (JSON body):
//   {
//     "skillId": "...",
//     "payload": { ... }
//   }
//
// Output: proxy della risposta n8n + arricchimenti (search_id, quota_consumed).
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
  // (in arrivo Pezzo 2C: "company-search")
]);

const SEARCH_CONSUMING_SKILLS = new Set<string>([
  "prospect-search-harvest",
  "prospect-finder",
]);

const SKILL_TIMEOUT_MS = 310_000; // 310s

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

  // adminClient: usato per quota check + searches insert/update (richiede service_role).
  const adminClient = serviceKey
    ? createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

  // 4. Pre-check quota "searches" per skill che la consumano.
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

  // 5. v3.7: per prospect-search-harvest, INSERT row in `searches` PRIMA di chiamare n8n.
  //    Ottieni search_id e propagalo a (a) commit-prospects, (b) UPDATE finale, (c) response.
  let searchId: string | null = null;
  const tStart = Date.now();
  if (skillId === "prospect-search-harvest" && adminClient) {
    // Build query_snapshot: snapshot completo del payload (ICP + filtri override + name ICP)
    const snapshot: Record<string, unknown> = {
      icp: (payload as any).icp ?? null,
      icp_name: (payload as any).icp_name ?? null,
      icp_id: (payload as any).icp_id ?? null,
      filters_override: (payload as any).filters_override ?? null,
      list_name: (payload as any).list_name ?? null,
    };
    const { data: searchRow, error: searchErr } = await adminClient
      .from("searches")
      .insert({
        user_id: userId,
        source: "icp",
        icp_id: (payload as any).icp_id ?? null,
        query_snapshot: snapshot,
        status: "running",
        prospect_count: 0,
      } as any)
      .select("id")
      .single();
    if (searchErr) {
      console.warn("[run-skill] searches insert failed (non-fatal):", searchErr.message);
      // Non blocchiamo: la search procede senza tracking, ma logghiamo.
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

    // 8. v3.7: post-response commit + UPDATE searches per prospect-search-harvest.
    if (skillId === "prospect-search-harvest" && upstream.status === 200) {
      try {
        const parsed = JSON.parse(text);
        const prospects = parsed?.data?.prospects;
        const durationMs = Date.now() - tStart;

        if (Array.isArray(prospects) && prospects.length > 0 && serviceKey) {
          // 8a. commit-prospects con search_id
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
            // 8b. UPDATE searches con error (se abbiamo searchId)
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
            // Continuiamo: il client riceve i prospects comunque. Quota NON consumata.
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

              // 8c. UPDATE searches con status=completed + count + duration
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
              // fallthrough alla response originale n8n (sotto)
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
        // Marca search come error per non lasciarla 'running' indefinitamente.
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

    // Marca search come error se l'avevamo creata.
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
