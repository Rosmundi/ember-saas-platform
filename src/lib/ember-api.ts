// src/lib/ember-api.ts
// Client reale: chiama direttamente i webhook n8n su archetipo.info
// Approccio A (MVP): no Edge Function, no X-Ember-Key guard

import type { SkillId } from "@/lib/ember-types";

const N8N_BASE = import.meta.env.VITE_N8N_BASE_URL || "https://n8n.archetipo.info/webhook";

export interface EmberResponse<T = Record<string, unknown>> {
  success: boolean;
  skill: string;
  data: T;
  quota_consumed?: { skill_run: number; scrape: number };
}

export interface EmberError {
  code: "quota_exceeded" | "invalid_input" | "n8n_error" | "network_error" | "parse_error";
  message: string;
  detail?: string;
}

export type EmberResult<T = Record<string, unknown>> =
  | { ok: true; data: T; skill: string; duration_ms: number }
  | { ok: false; error: EmberError };

/**
 * Chiama un webhook n8n per la skill specificata.
 * Timeout di 120s per gestire Apify scrape + Claude generation.
 */
export async function callSkill<T = Record<string, unknown>>(
  skillId: SkillId,
  payload: Record<string, unknown>,
): Promise<EmberResult<T>> {
  return callWebhook<T>(`ember/${skillId}`, payload, 120_000);
}

/**
 * Chiama il webhook per rigenerare una singola sezione del profilo.
 * Timeout più basso (30s) perché è solo LLM, niente scrape.
 */
export async function callRegenerateSection(payload: {
  user_id: string;
  section: string;
  stato_attuale: string;
  current_rewrite: string;
  profile_context: Record<string, unknown>;
  user_feedback?: string;
}): Promise<EmberResult<{ section: string; new_rewrite: string; variazione_applicata?: string }>> {
  return callWebhook("ember/regenerate-section", payload, 30_000);
}

/** Helper interno: chiama un qualsiasi webhook n8n con timeout configurabile. */
async function callWebhook<T = Record<string, unknown>>(
  path: string,
  payload: Record<string, unknown>,
  timeoutMs: number,
): Promise<EmberResult<T>> {
  const url = `${N8N_BASE}/${path}`;
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const duration_ms = Date.now() - start;

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return {
        ok: false,
        error: {
          code: "n8n_error",
          message: `n8n ha risposto con status ${response.status}`,
          detail: text.slice(0, 500),
        },
      };
    }

    const json = (await response.json()) as EmberResponse<T>;

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
    const message = err instanceof Error ? err.message : String(err);
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    return {
      ok: false,
      error: {
        code: "network_error",
        message: isAbort
          ? `Timeout: n8n non ha risposto entro ${Math.round(timeoutMs / 1000)} secondi.`
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
    default:
      return "Errore sconosciuto.";
  }
}
