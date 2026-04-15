// src/lib/ember-api.ts
// Client reale: chiama direttamente i webhook n8n su archetipo.info

import type { SkillId } from '@/lib/ember-types';

const N8N_BASE = import.meta.env.VITE_N8N_BASE_URL || 'https://n8n.archetipo.info/webhook';

export interface EmberResponse<T = Record<string, unknown>> {
  success: boolean;
  skill: string;
  data: T;
  quota_consumed?: { skill_run: number; scrape: number };
}

export interface EmberError {
  code: 'quota_exceeded' | 'invalid_input' | 'n8n_error' | 'network_error' | 'parse_error';
  message: string;
  detail?: string;
}

export type EmberResult<T = Record<string, unknown>> =
  | { ok: true; data: T; skill: string; duration_ms: number }
  | { ok: false; error: EmberError };

export async function callSkill<T = Record<string, unknown>>(
  skillId: SkillId,
  payload: Record<string, unknown>,
): Promise<EmberResult<T>> {
  const url = `${N8N_BASE}/ember/${skillId}`;
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const duration_ms = Date.now() - start;

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return {
        ok: false,
        error: {
          code: 'n8n_error',
          message: `n8n ha risposto con status ${response.status}`,
          detail: text.slice(0, 500),
        },
      };
    }

    const json = await response.json() as EmberResponse<T>;

    if (!json.success || !json.data) {
      return {
        ok: false,
        error: {
          code: 'parse_error',
          message: 'La risposta n8n non contiene dati validi.',
          detail: JSON.stringify(json).slice(0, 500),
        },
      };
    }

    return { ok: true, data: json.data, skill: json.skill, duration_ms };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isAbort = err instanceof DOMException && err.name === 'AbortError';
    return {
      ok: false,
      error: {
        code: 'network_error',
        message: isAbort
          ? 'Timeout: n8n non ha risposto entro 120 secondi.'
          : `Errore di rete: ${message}`,
      },
    };
  }
}

export function emberErrorMessage(err: EmberError): string {
  switch (err.code) {
    case 'quota_exceeded':
      return 'Hai raggiunto il limite. Riprova domani o passa a un piano superiore.';
    case 'invalid_input':
      return err.detail || 'Input non valido.';
    case 'n8n_error':
      return `Servizio temporaneamente non raggiungibile. ${err.detail || 'Riprova tra un minuto.'}`;
    case 'parse_error':
      return "L'analisi AI non ha prodotto un risultato valido. Riprova.";
    case 'network_error':
      return err.message;
    default:
      return 'Errore sconosciuto.';
  }
}