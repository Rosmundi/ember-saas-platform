// src/lib/ember-types.ts
// v3.8.3 (Tranche 2.1 — cleanup):
//   - profile-banner-brief spostato nel layer "profilo" (è un asset di profilo, non di content)
//   - visual-brief unifica anche carousel-brief (tab interni: Singolo | Carosello); carousel-brief
//     resta come SkillId per il dispatch lato n8n ma NON ha più una card propria in SKILLS.
//   - Rimosse skill obsolete: visual-post-builder (sostituita da visual-brief) e content-performance
//     (non in uso, andava in errore).
// v3.8.2 (Tranche 2 — Pezzo 4B): visual-brief, carousel-brief, profile-banner-brief.
// v3.8.0 (Tranche 1 — Pezzo 4A): aggiunge BrandKit + skill IDs nuove (post-improver, hook-generator).

export type SkillId =
  | "auto-profile-setup"
  | "post-writer"
  | "post-improver"
  | "hook-generator"
  | "visual-brief"
  | "carousel-brief" // tenuto come dispatch target dalla skill visual-brief (tab Carosello); non ha card propria.
  | "profile-banner-brief"
  | "icp-builder"
  | "prospect-finder"
  | "outreach-drafter"
  | "reply-suggester"
  | "network-intelligence";

export type PlanType = "trial" | "base" | "pro" | "studio";

// ============================================================================
// BrandKit — v3.8.0 (migration 012)
// ============================================================================
// Brand kit minimale: 1 colore primario + tone of voice. Salvato in
// profiles.brand_kit JSONB, opzionale (default = {}).
// Usato dalle skill di scrittura/content per coerenza stilistica.
export interface BrandKit {
  color?: string; // hex, es. "#FF6A1C"
  tone?: "corporate" | "playful" | "minimal" | "bold";
}

export interface Profile {
  id: string;
  linkedin_url: string | null;
  business_profile: BusinessProfile | null;
  raw_profile_data: Record<string, unknown> | null;
  plan: PlanType;
  skill_runs_used: number;
  skill_runs_limit: number;
  scrapes_used_today: number;
  scrapes_daily_limit: number;
  trial_ends_at: string;
  created_at: string;
  searches_used_today: number;
  searches_daily_limit: number;
  searches_reset_at: string | null;
  watchlist_max_items: number;
  // v3.8.0 (Tranche 1): brand kit (opzionale).
  brand_kit?: BrandKit | null;
}

export interface BusinessProfile {
  nome: string;
  headline: string;
  settore: string;
  chi_e?: string;
  value_proposition: string;
  tone_of_voice: string;
  punti_forza: string[];
  aree_miglioramento: string[];
  tags: string[];
}

// ============================================================================
// ICP — tabella icps (migration 009)
// ============================================================================
export interface Icp {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icp_json: Record<string, unknown>;
  buyer_personas: unknown[] | null;
  linkedin_search_query: unknown;
  trigger_events: unknown;
  exclusioni: unknown;
  filters_override: Record<string, unknown> | null;
  is_default: boolean;
  source: "auto" | "manual" | "duplicate";
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

export interface SkillRun {
  id: string;
  user_id: string;
  skill: SkillId;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  status: "pending" | "completed" | "error";
  is_scrape: boolean;
  created_at: string;
}

export interface WatchlistItem {
  id: string;
  linkedin_url: string;
  nome: string;
  headline: string;
  azienda: string;
  last_scraped_at: string | null;
  last_signal?: { type: string; detail: string; date: string };
}

export interface SkillConfig {
  id: SkillId;
  name: string;
  icon: string;
  description: string;
  layer: "profilo" | "content" | "prospect";
  usesScraping: boolean;
  plans: PlanType[];
}

export const SKILLS: SkillConfig[] = [
  // v3.8.5: tutte le skill del layer "profilo" sono assorbite dalla pagina /profilo
  // (auto-profile-setup, profile-optimizer, profile-banner-brief, regenerate-section).
  // Restano whitelisted lato edge function, ma NON hanno più card UI in sidebar/dashboard.
  {
    id: "post-writer",
    name: "Scrivi un post",
    icon: "PenTool",
    description:
      "Post LinkedIn ottimizzato per algoritmo (hook, struttura, CTA) con 2 varianti per A/B test.",
    layer: "content",
    usesScraping: false,
    plans: ["trial", "base", "pro", "studio"],
  },
  {
    id: "post-improver",
    name: "Migliora un post",
    icon: "Wand2",
    description:
      "Incolla un post mediocre, ricevi versione migliorata con score before/after e diff dei cambiamenti.",
    layer: "content",
    usesScraping: false,
    plans: ["trial", "base", "pro", "studio"],
  },
  {
    id: "hook-generator",
    name: "Genera hook",
    icon: "Zap",
    description:
      "5 hook diversi (curiosity, contrarian, data, story, question) per testare la prima riga del post.",
    layer: "content",
    usesScraping: false,
    plans: ["trial", "base", "pro", "studio"],
  },
  {
    id: "visual-brief",
    name: "Brief visual",
    icon: "ImagePlus",
    description:
      "Visual del post o carosello multi-slide: concept, palette, copy slot e prompt copia-incolla per generatori AI. Tab interni: Singolo | Carosello.",
    layer: "content",
    usesScraping: false,
    plans: ["trial", "base", "pro", "studio"],
  },
  {
    id: "icp-builder",
    name: "Costruisci l'ICP",
    icon: "Target",
    description: "Descrivi il cliente ideale, ottieni ICP card e query Sales Navigator.",
    layer: "prospect",
    usesScraping: false,
    plans: ["trial", "base", "pro", "studio"],
  },
  {
    id: "prospect-finder",
    name: "Trova prospect",
    icon: "Search",
    description: "Cerca profili reali su LinkedIn e ottieni una lista ranked con fit score.",
    layer: "prospect",
    usesScraping: true,
    plans: ["trial", "base", "pro", "studio"],
  },
  {
    id: "outreach-drafter",
    name: "Scrivi outreach",
    icon: "Send",
    description: "3 varianti di connection request e primo messaggio + follow-up.",
    layer: "prospect",
    usesScraping: false,
    plans: ["trial", "base", "pro", "studio"],
  },
  {
    id: "reply-suggester",
    name: "Rispondi ai messaggi",
    icon: "MessageSquare",
    description: "Incolla un messaggio ricevuto, ricevi 3 risposte calibrate sul funnel.",
    layer: "prospect",
    usesScraping: false,
    plans: ["trial", "base", "pro", "studio"],
  },
  {
    id: "network-intelligence",
    name: "Monitora la rete",
    icon: "Radar",
    description:
      "Watchlist profili: segnala cambi ruolo, promozioni, post virali e suggerisce azioni.",
    layer: "prospect",
    usesScraping: true,
    plans: ["pro", "studio"],
  },
];

export const SCRAPING_SKILLS: SkillId[] = [
  "auto-profile-setup",
  "prospect-finder",
  "network-intelligence",
];

export function canUseSkill(
  profile: Profile,
  skill: SkillConfig,
): { allowed: boolean; reason?: string } {
  if (!skill.plans.includes(profile.plan)) {
    return {
      allowed: false,
      reason: `Questa skill è disponibile dal piano ${skill.plans[0] === "pro" ? "Pro" : "Studio"}.`,
    };
  }
  if (profile.skill_runs_used >= profile.skill_runs_limit) {
    return { allowed: false, reason: "Hai raggiunto il limite di skill-run per questo mese." };
  }
  if (skill.usesScraping && profile.scrapes_used_today >= profile.scrapes_daily_limit) {
    return { allowed: false, reason: "Hai esaurito i crediti scraping di oggi. Si resettano domani." };
  }
  return { allowed: true };
}

export const PLAN_LIMITS: Record<PlanType, { skillRuns: number; scraping: number; watchlist: number }> = {
  trial: { skillRuns: 20, scraping: 0, watchlist: 0 },
  base: { skillRuns: 60, scraping: 1, watchlist: 0 },
  pro: { skillRuns: 250, scraping: 5, watchlist: 15 },
  studio: { skillRuns: 1000, scraping: 20, watchlist: 50 },
};
