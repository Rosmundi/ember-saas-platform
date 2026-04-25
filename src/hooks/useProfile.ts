// src/hooks/useProfile.ts
// Hook per leggere e aggiornare il profilo utente da Supabase.
// Sostituisce mockProfile ovunque nel frontend.

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile, BusinessProfile, PlanType } from "@/lib/ember-types";

// Tipo raw dal DB (snake_case, come arriva da Supabase)
interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string | null;
  company_name: string | null;
  role: string | null;
  linkedin_url: string | null;
  industry: string | null;
  target_audience: string | null;
  business_profile: BusinessProfile | null;
  raw_profile_data: Record<string, unknown> | null;
  plan: string;
  onboarding_completed: boolean;
  skill_runs_used: number;
  skill_runs_limit: number;
  scrapes_used_today: number;
  scrapes_daily_limit: number;
  scrapes_reset_at: string | null;
  // v3.6.0: quota giornaliera "searches" (prospect-search-harvest / prospect-finder).
  // Colonne aggiunte dalla migration 006_searches_quota_and_watchlist.sql.
  searches_used_today: number;
  searches_daily_limit: number;
  searches_reset_at: string | null;
  watchlist_max_items: number;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.user_id,
    linkedin_url: row.linkedin_url,
    business_profile: row.business_profile as BusinessProfile | null,
    raw_profile_data: row.raw_profile_data,
    plan: (row.plan || "trial") as PlanType,
    skill_runs_used: row.skill_runs_used ?? 0,
    skill_runs_limit: row.skill_runs_limit ?? 20,
    scrapes_used_today: row.scrapes_used_today ?? 0,
    scrapes_daily_limit: row.scrapes_daily_limit ?? 0,
    // v3.6.0: quota searches (per prospect finder). Prerequisite: ember-types.ts Profile
    // va esteso con gli stessi campi (vedi PROMPT_LOVABLE.md).
    searches_used_today: row.searches_used_today ?? 0,
    searches_daily_limit: row.searches_daily_limit ?? 0,
    searches_reset_at: row.searches_reset_at || null,
    watchlist_max_items: row.watchlist_max_items ?? 0,
    trial_ends_at: row.trial_ends_at || "",
    created_at: row.created_at,
  };
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carica profilo.
  // v3.4.2 fix M1: se la SELECT torna null (profilo inesistente per nuovo utente,
  // trigger handle_new_user fallito o RLS), chiama RPC bootstrap_profile_if_missing
  // e ritenta UNA VOLTA. Evita loop loading infinito.
  // v3.4.2 fix: prima del SELECT chiama le RPC atomiche di reset quote (scrape giornaliera + skill_runs mensile).
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    // Tenta il riaccredito di TUTTE le quote in parallelo (failsafe se una fallisce).
    // v3.6.0: aggiunto reset_searches_quota_if_due (quota giornaliera prospect finder).
    const [scrapeReset, skillRunsReset, searchesReset] = await Promise.all([
      supabase.rpc("reset_scrape_quota_if_due", { p_user_id: user.id }),
      supabase.rpc("reset_skill_runs_if_due", { p_user_id: user.id }),
      supabase.rpc("reset_searches_quota_if_due", { p_user_id: user.id }),
    ]);
    if (scrapeReset.error) {
      // eslint-disable-next-line no-console
      console.warn("[useProfile] reset_scrape_quota_if_due failed:", scrapeReset.error.message);
    }
    if (skillRunsReset.error) {
      // eslint-disable-next-line no-console
      console.warn("[useProfile] reset_skill_runs_if_due failed:", skillRunsReset.error.message);
    }
    if (searchesReset.error) {
      // eslint-disable-next-line no-console
      console.warn("[useProfile] reset_searches_quota_if_due failed:", searchesReset.error.message);
    }

    const { data, error: err } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();

    if (err) {
      setError(err.message);
      toast.error("Errore caricamento profilo", { description: err.message });
      setLoading(false);
      return;
    }

    if (data) {
      setProfile(rowToProfile(data as unknown as ProfileRow));
      setLoading(false);
      return;
    }

    // v3.4.2 M1: profilo non trovato → tenta bootstrap on-demand, poi re-fetch.
    // eslint-disable-next-line no-console
    console.warn("[useProfile] Profilo non trovato per user", user.id, "→ tentativo bootstrap.");
    const { error: bootstrapErr } = await (supabase.rpc as any)("bootstrap_profile_if_missing", { p_user_id: user.id });
    if (bootstrapErr) {
      const msg = `Impossibile creare il profilo: ${bootstrapErr.message}`;
      setError(msg);
      toast.error("Bootstrap profilo fallito", { description: msg });
      setLoading(false);
      return;
    }

    const { data: data2, error: err2 } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (err2 || !data2) {
      const msg = err2?.message || "Profilo non disponibile dopo bootstrap. Contatta supporto.";
      setError(msg);
      toast.error("Profilo non disponibile", { description: msg });
    } else {
      setProfile(rowToProfile(data2 as unknown as ProfileRow));
      toast.success("Profilo creato", { description: "Pronto per l'onboarding." });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // v3.4.2 fix M3: helper per gestire errori update con toast esplicito.
  const handleUpdateError = (action: string, msg: string) => {
    setError(msg);
    toast.error(`${action} fallito`, { description: msg });
  };

  // Aggiorna campi profilo
  const updateProfile = useCallback(
    async (updates: Partial<ProfileRow>) => {
      if (!user) return;
      const { error: err } = await supabase
        .from("profiles")
        .update(updates as any)
        .eq("user_id", user.id);
      if (err) {
        handleUpdateError("Aggiornamento profilo", err.message);
        return;
      }
      await fetchProfile();
    },
    [user, fetchProfile],
  );

  // Salva business_profile + raw_profile_data + linkedin_url dopo onboarding
  const saveOnboardingProfile = useCallback(
    async (linkedinUrl: string, businessProfile: BusinessProfile, rawData: Record<string, unknown>) => {
      if (!user) return;
      const { error: err } = await supabase
        .from("profiles")
        .update({
          linkedin_url: linkedinUrl,
          business_profile: businessProfile as any,
          raw_profile_data: rawData as any,
          onboarding_completed: true,
        } as any)
        .eq("user_id", user.id);
      if (err) {
        handleUpdateError("Salvataggio onboarding", err.message);
        return;
      }
      await fetchProfile();
    },
    [user, fetchProfile],
  );

  // Aggiorna SOLO raw_profile_data (usato per salvare nuova analisi o riscritture rigenerate)
  const updateRawProfileData = useCallback(
    async (newRawData: Record<string, unknown>) => {
      if (!user) return;
      const { error: err } = await supabase
        .from("profiles")
        .update({ raw_profile_data: newRawData as any } as any)
        .eq("user_id", user.id);
      if (err) {
        handleUpdateError("Salvataggio analisi", err.message);
        return;
      }
      await fetchProfile();
    },
    [user, fetchProfile],
  );

  // Incrementa contatori dopo skill run.
  // Chiama prima i reset RPC, poi rilegge i contatori freschi e incrementa.
  // Evita race condition con altre tab e gestisce reset appena avvenuto.
  const consumeSkillRun = useCallback(
    async (isScrape: boolean) => {
      if (!user || !profile) return;

      // 1. Riaccredita se dovuto (entrambe le quote, in parallelo).
      await Promise.all([
        supabase.rpc("reset_scrape_quota_if_due", { p_user_id: user.id }),
        supabase.rpc("reset_skill_runs_if_due", { p_user_id: user.id }),
      ]);

      // 2. Rileggi i contatori freschi dal DB.
      const { data: fresh, error: freshErr } = await supabase
        .from("profiles")
        .select("skill_runs_used, scrapes_used_today")
        .eq("user_id", user.id)
        .maybeSingle();

      if (freshErr) {
        // v3.4.2 M3: errore lettura fresca → warning soft, procediamo con stato locale.
        // eslint-disable-next-line no-console
        console.warn("[useProfile] consumeSkillRun fresh read failed:", freshErr.message);
        toast.warning("Lettura quota imprecisa", { description: "Contatori potrebbero essere disallineati." });
      }

      const currentSkillRuns = (fresh as any)?.skill_runs_used ?? profile.skill_runs_used;
      const currentScrapes = (fresh as any)?.scrapes_used_today ?? profile.scrapes_used_today;

      const updates: Record<string, unknown> = {
        skill_runs_used: currentSkillRuns + 1,
      };
      if (isScrape) {
        updates.scrapes_used_today = currentScrapes + 1;
      }
      await updateProfile(updates as Partial<ProfileRow>);
    },
    [user, profile, updateProfile],
  );

  // Controlla se onboarding completato
  const onboardingCompleted = profile?.business_profile != null;

  return {
    profile,
    loading,
    error,
    onboardingCompleted,
    fetchProfile,
    updateProfile,
    saveOnboardingProfile,
    updateRawProfileData,
    consumeSkillRun,
  };
}
