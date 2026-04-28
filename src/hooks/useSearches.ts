// src/hooks/useSearches.ts
// ============================================================================
// Hook per leggere lo storico ricerche prospect (tabella `searches`, migration 010).
// Le INSERT/UPDATE in `searches` sono fatte server-side da run-skill (gateway),
// non dal frontend. Qui esponiamo solo letture + delete.
// ============================================================================

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Prospect } from "@/components/prospects/ProspectCard";

// ============================================================================
// Tipi
// ============================================================================

export type SearchSource = "icp" | "url" | "name" | "company" | "lookalike";
export type SearchStatus = "running" | "completed" | "error";

export interface SearchRow {
  id: string;
  user_id: string;
  source: SearchSource;
  icp_id: string | null;
  query_snapshot: Record<string, unknown>;
  prospect_count: number;
  duration_ms: number | null;
  status: SearchStatus;
  error_message: string | null;
  created_at: string;
}

export interface SearchWithProspects extends SearchRow {
  prospects: Prospect[];
}

// ============================================================================
// Hook: ultime N ricerche (per right rail)
// ============================================================================

export function useRecentSearches(limit = 10) {
  const { user } = useAuth();
  const [searches, setSearches] = useState<SearchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user) {
      setSearches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("searches")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setSearches((data ?? []) as unknown as SearchRow[]);
    setLoading(false);
  }, [user, limit]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { searches, loading, error, refetch };
}

// ============================================================================
// Hook: storico paginato (per pagina /searches)
// ============================================================================

const PAGE_SIZE = 25;

export function useSearchHistory(page = 0) {
  const { user } = useAuth();
  const [searches, setSearches] = useState<SearchRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user) {
      setSearches([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count, error: err } = await supabase
      .from("searches")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setSearches((data ?? []) as unknown as SearchRow[]);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [user, page]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;
      const { error: err } = await supabase
        .from("searches")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (err) {
        toast.error("Eliminazione ricerca fallita", { description: err.message });
        return false;
      }
      await refetch();
      return true;
    },
    [user, refetch],
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return {
    searches,
    totalCount,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
    loading,
    error,
    refetch,
    remove,
  };
}

// ============================================================================
// Hook: singola search + i suoi prospect (per riapertura risultato)
// ============================================================================

export function useSearchById(id: string | null) {
  const { user } = useAuth();
  const [data, setData] = useState<SearchWithProspects | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user || !id) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);

    const [searchRes, prospectsRes] = await Promise.all([
      supabase
        .from("searches")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("prospects")
        .select("id, linkedin_url, short_data, source_search_at")
        .eq("user_id", user.id)
        .eq("search_id", id)
        .order("created_at", { ascending: true }),
    ]);

    if (searchRes.error) {
      setError(searchRes.error.message);
      setLoading(false);
      return;
    }
    if (!searchRes.data) {
      setError("Ricerca non trovata.");
      setLoading(false);
      return;
    }

    const search = searchRes.data as unknown as SearchRow;
    const prospects = ((prospectsRes.data ?? []) as unknown[]).map((p) => p as Prospect);
    setData({ ...search, prospects });
    setLoading(false);
  }, [user, id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// ============================================================================
// Helpers display
// ============================================================================

export function searchSourceLabel(source: SearchSource): string {
  switch (source) {
    case "icp":
      return "Per ICP";
    case "url":
      return "Per URL";
    case "name":
      return "Per nome";
    case "company":
      return "Per azienda";
    case "lookalike":
      return "Lookalike";
    default:
      return source;
  }
}

export function searchSourceColor(source: SearchSource): string {
  switch (source) {
    case "icp":
      return "bg-primary/15 text-primary border-primary/30";
    case "url":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "name":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "company":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    case "lookalike":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    default:
      return "bg-muted text-muted-foreground border-border/30";
  }
}

export function searchSummary(search: SearchRow): string {
  const snap = search.query_snapshot || {};
  switch (search.source) {
    case "icp": {
      const icpName = (snap as any).icp_name as string | undefined;
      if (icpName) return icpName;
      const settore = (snap as any)?.icp?.settore;
      if (Array.isArray(settore)) return settore.slice(0, 2).join(", ");
      if (typeof settore === "string") return settore;
      return "ICP personalizzato";
    }
    case "url": {
      const url = (snap as any).url as string | undefined;
      if (!url) return "URL ricerca";
      try {
        const u = new URL(url);
        return u.pathname.replace(/^\/in\//, "");
      } catch {
        return url;
      }
    }
    case "name": {
      const fn = (snap as any).firstName as string | undefined;
      const ln = (snap as any).lastName as string | undefined;
      return [fn, ln].filter(Boolean).join(" ") || "Ricerca per nome";
    }
    case "company": {
      const c = (snap as any).company_name as string | undefined;
      return c || "Ricerca per azienda";
    }
    default:
      return "Ricerca";
  }
}
