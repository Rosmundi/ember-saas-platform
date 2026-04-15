import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile, BusinessProfile, PlanType } from '@/lib/ember-types';

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
    plan: (row.plan || 'trial') as PlanType,
    skill_runs_used: row.skill_runs_used ?? 0,
    skill_runs_limit: row.skill_runs_limit ?? 20,
    scrapes_used_today: row.scrapes_used_today ?? 0,
    scrapes_daily_limit: row.scrapes_daily_limit ?? 0,
    trial_ends_at: row.trial_ends_at || '',
    created_at: row.created_at,
  };
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

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

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<ProfileRow>) => {
    if (!user) return;
    const { error: err } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);
    if (err) { setError(err.message); return; }
    await fetchProfile();
  }, [user, fetchProfile]);

  const saveOnboardingProfile = useCallback(async (
    linkedinUrl: string,
    businessProfile: BusinessProfile,
    rawData: Record<string, unknown>,
  ) => {
    if (!user) return;
    const { error: err } = await supabase
      .from('profiles')
      .update({
        linkedin_url: linkedinUrl,
        business_profile: businessProfile as unknown as Record<string, unknown>,
        raw_profile_data: rawData,
        onboarding_completed: true,
      })
      .eq('user_id', user.id);
    if (err) { setError(err.message); return; }
    await fetchProfile();
  }, [user, fetchProfile]);

  const consumeSkillRun = useCallback(async (isScrape: boolean) => {
    if (!user || !profile) return;
    const updates: Record<string, unknown> = {
      skill_runs_used: profile.skill_runs_used + 1,
    };
    if (isScrape) {
      updates.scrapes_used_today = profile.scrapes_used_today + 1;
    }
    await updateProfile(updates as Partial<ProfileRow>);
  }, [user, profile, updateProfile]);

  const onboardingCompleted = profile?.business_profile != null;

  return {
    profile,
    loading,
    error,
    onboardingCompleted,
    fetchProfile,
    updateProfile,
    saveOnboardingProfile,
    consumeSkillRun,
  };
}