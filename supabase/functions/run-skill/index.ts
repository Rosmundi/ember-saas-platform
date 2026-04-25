// ============================================================================
// Edge Function: run-skill (Gateway v3.6.0)
// ============================================================================
// Gateway server-side per tutte le skill Ember. Sostituisce la chiamata diretta
// browser→n8n. Chiuso il leak di VITE_EMBER_KEY dal bundle pubblico.
//
// v3.6.0 (refactor quota Ember):
//   - Pre-check quota "searches" lato Lovable PRIMA di chiamare n8n, per le
//     skill che consumano searches_* (prospect-search-harvest, prospect-finder).
//   - Se l'utente è a 0 search rimanenti, il webhook n8n NON parte: ritorniamo
//     429 QUOTA_EXCEEDED direttamente al client con reset_at.
//   - Nessun cambio per le altre skill (auto-profile-setup, icp-builder, ecc.).
//   - Nota: il workflow n8n mantiene il proprio check-search-quota come
//     defense-in-depth (no-op sul happy path di run-skill, ma protegge se
//     qualcuno riesce a chiamare il webhook con X-Ember-Key valida).
//
// Chiamante: Frontend via supabase.functions.invoke('run-skill', { ... })
//
// Auth:
//   - Authorization: Bearer <JWT utente Supabase>  (richiesta - browser)
//   - La JWT viene verificata; il user_id autoritativo è preso dal claim `sub`.
//     Il client NON può spoofare user_id (qualsiasi `user_id` nel payload viene
//     sovrascritto).
//
// Input (JSON body):
//   {
//     "skillId": "auto-profile-setup" | "regenerate-section" | "prospect-search-harvest" | ...,
//     "payload": { ...campi skill-specifici... }
//   }
//
// Output: proxy della risposta n8n as-is (inclusi status 4xx/5xx) + header
//   Content-Type: application/json.
//
// Errori gateway:
//   401 { ok: false, code: "UNAUTHORIZED" }          // JWT mancante/invalida
//   400 { ok: false, code: "BAD_REQUEST", message }  // body malformato
//   403 { ok: false, code: "FORBIDDEN_SKILL" }       // skillId non in whitelist
//   429 { ok: false, code: "QUOTA_EXCEEDED", data:{used, limit, remaining, reset_at} }
//   404 { ok: false, code: "PROFILE_NOT_FOUND" }     // profilo mancante (edge case)
//   502 { ok: false, code: "UPSTREAM_ERROR" }        // n8n unreachable
//   504 { ok: false, code: "UPSTREAM_TIMEOUT" }      // n8n > SKILL_TIMEOUT_MS
//   500 { ok: false, code: "INTERNAL", message }     // config mancante / bug
//
// Env vars richieste (Lovable Secrets):
//   EMBER_INTERNAL_KEY         = shared secret n8n (stessa dell'If-guard n8n)
//   N8N_BASE_URL               = https://n8n.archetipo.info/webhook  (opzionale, default)
//   SUPABASE_URL               = auto-iniettata
//   SUPABASE_ANON_KEY          = auto-iniettata (per verificare JWT)
//   SUPABASE_SERVICE_ROLE_KEY  = auto-iniettata (per RPC reset + SELECT quota bypass RLS)
// ============================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Whitelist delle skill ammesse. Aggiungere qui quando ne arrivano di nuove.
// Any skillId non in lista → 403.
const ALLOWED_SKILLS = new Set<string>([
  "auto-profile-setup",
  "regenerate-section",
  // prospect-finder = workflow live attuale (scrape 1 URL + fit_score vs ICP)
  "prospect-finder",
  // icp-builder = costruzione ICP/buyer personas (usato dal form Dashboard)
  "icp-builder",
  // outreach-drafter = scrivi messaggio di primo contatto per un prospect
  "outreach-drafter",
  // prospect-search-harvest = workflow evolutivo (search massiva ICP→lista)
  "prospect-search-harvest",
  // aggiungere in futuro: profile-optimizer, post-writer, visual-post-builder,
  // content-performance, reply-suggester, network-intelligence
]);

// Skill che consumano 1 "search" (quota giornaliera searches_daily_limit).
// Pre-check forzato PRIMA di forwardare a n8n.
const SEARCH_CONSUMING_SKILLS = new Set<string>(["prospect-search-harvest", "prospect-finder"]);

// Timeout upstream n8n. Tenere < wall-time Edge Function (Lovable Pro = 400s).
// Tenere >= timeout client (ember-api.ts callSkill = 300s) così è sempre
// il client a timeoutare per primo con messaggio UX consistente.
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

  // 2. Verifica JWT. Prendiamo l'Authorization header as-is, passiamo a supabase.auth.getUser.
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
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

  // 4. Pre-check quota "searches" per skill che la consumano.
  //    Facciamo reset-se-scaduta + SELECT fresca. Se esaurita → 429 immediato.
  //    Serve service_role per bypassare RLS (stesso pattern di check-search-quota).
  if (SEARCH_CONSUMING_SKILLS.has(skillId)) {
    if (!serviceKey) {
      console.error("[run-skill] SUPABASE_SERVICE_ROLE_KEY mancante — impossibile pre-checkare quota");
      return jsonResponse({ ok: false, code: "INTERNAL", message: "Service role key mancante" }, 500);
    }
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 4a. Reset se la finestra giornaliera è passata.
    const { error: resetErr } = await adminClient.rpc("reset_searches_quota_if_due", {
      p_user_id: userId,
    });
    if (resetErr) {
      console.error("[run-skill] reset_searches_quota_if_due error:", resetErr);
      return jsonResponse({ ok: false, code: "INTERNAL", message: resetErr.message }, 500);
    }

    // 4b. Leggi lo stato fresco.
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
    const remaining = Math.max(limit - used, 0);
    const resetAt = quotaRow.searches_reset_at;

    if (used >= limit) {
      // Niente webhook — utente informato subito.
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
    // altrimenti proseguiamo al forward.
  }

  // 5. Inietta user_id autoritativo dal JWT. Sovrascrive qualsiasi valore client.
  const forwardBody = { ...payload, user_id: userId };

  // 6. Forward a n8n con X-Ember-Key + AbortController timeout.
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

    // Proxy body + status. Content-Type forzato a JSON (n8n Respond to Webhook
    // JSON ritorna sempre application/json; se fosse altro, è un bug upstream).
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err) {
    clearTimeout(timer);
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    if (isAbort) {
      console.error(`[run-skill] Timeout n8n su ${skillId} (user ${userId})`);
      return jsonResponse(
        {
          ok: false,
          code: "UPSTREAM_TIMEOUT",
          message: `n8n non ha risposto entro ${Math.round(SKILL_TIMEOUT_MS / 1000)}s`,
        },
        504,
      );
    }
    console.error(`[run-skill] Errore upstream n8n:`, err);
    return jsonResponse({ ok: false, code: "UPSTREAM_ERROR", message: String(err) }, 502);
  }
});
