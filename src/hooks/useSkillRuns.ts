import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { SkillRun } from '@/lib/ember-types';

export function useSkillRuns(limit = 20) {
  const { user } = useAuth();
  const [runs, setRuns] = useState<SkillRun[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = useCallback(async () => {
    if (!user) { setRuns([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('skill_runs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (data) setRuns(data as unknown as SkillRun[]);
    setLoading(false);
  }, [user, limit]);

  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  const logRun = useCallback(async (run: {
    skill: string;
    input: Record<string, unknown>;
    output: Record<string, unknown> | null;
    status: 'completed' | 'error';
    is_scrape: boolean;
    duration_ms?: number;
    error_message?: string;
  }) => {
    if (!user) return;
    await supabase.from('skill_runs').insert({
      user_id: user.id,
      ...run,
    } as any);
    await fetchRuns();
  }, [user, fetchRuns]);

  return { runs, loading, fetchRuns, logRun };
}