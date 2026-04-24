// src/lib/ember-api.ts
// ============================================================================
// v3.5.0 — Gateway mode
// ============================================================================
// Il client NON chiama più direttamente i webhook n8n. Passa dalla Edge Function
// `run-skill` (vedi lovable_update/edge_functions/run-skill/index.ts), che:
//   - verifica la JWT Supabase dell'utente
//   - estrae user_id autoritativo dal claim `sub` (non più spoofabile dal client)
//   - applica whitelist sulle skill consentite
//   - aggiunge il server-to-server X-Ember-Key (EMBER_INTERNAL_KEY) lato server
//   - forwarda al webhook n8n e proxa la risposta
//
// Conseguenza: VITE_EMBER_KEY è RIMOSSA dal bundle pubblico. Chi ispeziona il JS
// non trova più la shared secret. L'unica via per colpire n8n resta via gateway,
// e il gateway richiede JWT valida.
//
// Breaking change rispetto a v3.4.x: serve che l'utente sia loggato (sessione
// Supabase attiva). Per le chiamate non-post-login (nessuna al momento in Ember)
// bisognerà prevedere un endpoint separato, out of scope qui.
// ============================================================================

import type { SkillId } from "@/lib/ember-types";
import { supabase } from "@/integrations/supabase/client";

export interface EmberResponse<T = Record<string, unknown>> {
  success: boolean;
  skill: string;
  data: T;
  quota_consumed?: { skill_run: number; scrape: number };
}

export interface EmberError {
  code:
    | "quota_exceeded"
    | "invalid_input"
    | "n8n_error"
    | "network_error"
    | "parse_error"
    | "unauthorized"
    | "forbidden_skill"
    | "upstream_timeout";
  message: string;
  detail?: string;
}

export type EmberResult<T = Record<string, unknown>> =
  | { ok: true; data: T; skill: string; duration_ms: number }
  | { ok: false; error: EmberError };

/**
 * Chiama una skill Ember via gateway Edge Function.
 * Timeout client: 300s (5min). Il gateway ha timeout upstream 310s così è
 * sempre il client a scadere per primo con messaggio UX consistente.
 *
 * Nota: Apify harvestapi su profili densi (40+ cert, 6+ esperienze, featured,
 * skills) può sforare i 2 min. Il 300s copre il 99% dei casi. Per skill
 * strutturalmente più lente (es. scrape multi-pagina) valutare pattern async
 * (fire-and-forget + polling/Realtime).
 */
export async function callSkill<T = Record<string, unknown>>(
  skillId: SkillId,
  payload: Record<string, unknown>,
): Promise<EmberResult<T>> {
  return invokeGateway<T>(skillId, payload, 300_000);
}

/**
 * Chiama la skill di rigenerazione singola sezione profilo.
 * Timeout 30s (solo LLM, niente scrape).
 * v3.4.1 fix (H2): forza user_feedback a stringa vuota se undefined, per evitare
 * che n8n riceva il campo assente e il prompt LLM mostri "undefined" letterale.
 */
export async function callRegenerateSection(payload: {
  user_id: string;
  section: string;
  stato_attuale: string;
  current_rewrite: string;
  profile_context: Record<string, unknown>;
  user_feedback?: string;
}): Promise<EmberResult<{ section: string; new_rewrite: string; variazione_applicata?: string }>> {
  const safePayload = {
    ...payload,
    user_feedback: payload.user_feedback ?? "",
  };
  // NB: il gateway sovrascriverà user_id con quello dal JWT. Lo lasciamo nel
  // payload per compatibilità di tipi, ma la source of truth è il JWT.
  return invokeGateway("regenerate-section", safePayload, 30_000);
}

/**
 * Helper interno: invoca il gateway `run-skill` con timeout configurabile.
 * Usa supabase.functions.invoke così la JWT della sessione corrente viene
 * aggiunta automaticamente all'header Authorization.
 */
async function invokeGateway<T = Record<string, unknown>>(
  skillId: string,
  payload: Record<string, unknown>,
  timeoutMs: number,
): Promise<EmberResult<T>> {
  const start = Date.now();

  // AbortController per timeout lato client. supabase-js v2 supporta signal
  // dal parametro options (se non supportato nella tua versione, sostituire
  // con fetch diretto a supabase.functions.url + header auth manuale).
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Verifica sessione attiva prima di chiamare. Se non c'è JWT il gateway
    // risponderebbe 401 comunque, ma intercettiamo prima per messaggio UX.
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      clearTimeout(timeout);
      return {
        ok: false,
        error: {
          code: "unauthorized",
          message: "Sessione scaduta. Effettua di nuovo il login.",
        },
      };
    }

    const { data, error } = await supabase.functions.invoke<
      EmberResponse<T> & { ok?: boolean; code?: string; message?: string }
    >("run-skill", {
      body: { skillId, payload },
      // @ts-expect-error signal è supportato runtime ma non sempre nei tipi
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const duration_ms = Date.now() - start;

    if (error) {
      // supabase.functions.invoke wraps non-2xx in error. Proviamo a leggere il
      // body dell'errore, che il gateway serializza come { ok:false, code, message }.
      const detail = (error.context as any)?.body || error.message;
      const maybeCode = typeof detail === "object" ? detail?.code : undefined;

      if (maybeCode === "UNAUTHORIZED") {
        return { ok: false, error: { code: "unauthorized", message: "Sessione scaduta o token non valido." } };
      }
      if (maybeCode === "FORBIDDEN_SKILL") {
        return { ok: false, error: { code: "forbidden_skill", message: `Skill "${skillId}" non consentita.` } };
      }
      if (maybeCode === "UPSTREAM_TIMEOUT") {
        return { ok: false, error: { code: "upstream_timeout", message: `n8n non ha risposto in tempo.` } };
      }
      return {
        ok: false,
        error: {
          code: "n8n_error",
          message: "Errore nel servizio skill.",
          detail: typeof detail === "string" ? detail.slice(0, 500) : JSON.stringify(detail).slice(0, 500),
        },
      };
    }

    if (!data || typeof data !== "object") {
      return {
        ok: false,
        error: { code: "parse_error", message: "Risposta gateway vuota o non valida." },
      };
    }

    const json = data as EmberResponse<T>;
    if (!json.success || !json.data) {
      return {
        ok: false,
        error: {
          code: "parse_error",
          message: "La risposta n8n non contiene dati validi.",
          detail: JSON.stringify(json).slice(0, 500),
        },
      };
    }
    return { ok: true, data: json.data, skill: json.skill, duration_ms };
  } catch (err: unknown) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : String(err);
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    return {
      ok: false,
      error: {
        code: "network_error",
        message: isAbort
          ? `Timeout: il gateway non ha risposto entro ${Math.round(timeoutMs / 1000)} secondi.`
          : `Errore di rete: ${message}`,
      },
    };
  }
}

/** Helper UX: messaggio leggibile dall'errore */
export function emberErrorMessage(err: EmberError): string {
  switch (err.code) {
    case "quota_exceeded":
      return "Hai raggiunto il limite. Riprova domani o passa a un piano superiore.";
    case "invalid_input":
      return err.detail || "Input non valido.";
    case "n8n_error":
      return `Servizio temporaneamente non raggiungibile. ${err.detail || "Riprova tra un minuto."}`;
    case "parse_error":
      return "L'analisi AI non ha prodotto un risultato valido. Riprova.";
    case "network_error":
      return err.message;
    case "unauthorized":
      return err.message;
    case "forbidden_skill":
      return err.message;
    case "upstream_timeout":
      return "Il servizio ha impiegato troppo tempo. Riprova con un profilo meno denso o contatta il supporto.";
    default:
      return "Errore sconosciuto.";
  }
}
