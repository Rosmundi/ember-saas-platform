// src/hooks/useProfile.ts
// Hook per leggere e aggiornare il profilo utente da Supabase.
// Sostituisce mockProfile ovunque nel frontend.

import { useEffect, useState, useCallback } from "react";
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
  // v3.4.2 fix: prima del SELECT chiama l'RPC atomica reset_scrape_quota_if_due,
  // che resetta scrapes_used_today SE scrapes_reset_at è scaduto. L'atomicità è
  // garantita dal WHERE scrapes_reset_at < now() lato SQL: no race condition
  // anche con più tab aperte.
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    // Tenta il riaccredito. Se fallisce non blocchiamo il fetch (failsafe).
    const { error: rpcErr } = await supabase.rpc("reset_scrape_quota_if_due", {
      p_user_id: user.id,
    });
    if (rpcErr) {
      // Non blocchiamo il login, ma logghiamo per debug.
      // eslint-disable-next-line no-console
      console.warn("[useProfile] reset_scrape_quota_if_due failed:", rpcErr.message);
    }

    const { data, error: err } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    if (data) {
      setProfile(rowToProfile(data as unknown as ProfileRow));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Aggiorna campi profilo
  const updateProfile = useCallback(
    async (updates: Partial<ProfileRow>) => {
      if (!user) return;
      const { error: err } = await supabase
        .from("profiles")
        .update(updates as any)
        .eq("user_id", user.id);
      if (err) {
        setError(err.message);
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
        setError(err.message);
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
        setError(err.message);
        return;
      }
      await fetchProfile();
    },
    [user, fetchProfile],
  );

  // Incrementa contatori dopo skill run.
  // v3.4.2 fix: chiama reset_scrape_quota_if_due PRIMA di rileggere il profilo
  // fresh dal DB, così se l'utente ha la pagina aperta da più di 24h, il
  // contatore viene azzerato prima di essere incrementato.
  // Rileggere i contatori dal DB (invece di usare lo state React) evita race
  // condition con altre tab e rende l'incremento corretto anche se il reset
  // è appena avvenuto.
  const consumeSkillRun = useCallback(
    async (isScrape: boolean) => {
      if (!user || !profile) return;

      // 1. Riaccredita se dovuto.
      await supabase.rpc("reset_scrape_quota_if_due", { p_user_id: user.id });

      // 2. Rileggi i contatori freschi dal DB.
      const { data: fresh } = await supabase
        .from("profiles")
        .select("skill_runs_used, scrapes_used_today")
        .eq("user_id", user.id)
        .maybeSingle();

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
