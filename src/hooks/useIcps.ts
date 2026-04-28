// src/hooks/useIcps.ts
// ============================================================================
// Hook per CRUD ICP multipli (tabella `icps`, migration 009).
//
// v3.7 (Pezzo 2A) — RIMOSSO shadow write su raw_profile_data.icp_current:
//   Da quando il prospect-finder usa un picker ICP esplicito (Pezzo 2A),
//   raw_profile_data.icp_current non viene più letto da nessuno. Lo lasciamo
//   intatto nel DB per safety/rollback ma non lo aggiorniamo più.
//
// v3.7 (Pezzo 1) — versione originale con shadow write (ora deprecata).
//
// RLS: la tabella `icps` ha policy che permette SELECT/INSERT/UPDATE/DELETE
// solo al proprietario.
// ============================================================================

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ============================================================================
// Tipi
// ============================================================================

export interface IcpRow {
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

export interface IcpCreateInput {
  name: string;
  description?: string;
  icp_json: Record<string, unknown>;
  buyer_personas?: unknown[] | null;
  linkedin_search_query?: unknown;
  trigger_events?: unknown;
  exclusioni?: unknown;
  filters_override?: Record<string, unknown> | null;
  is_default?: boolean;
  source?: "auto" | "manual" | "duplicate";
}

export interface IcpUpdateInput extends Partial<IcpCreateInput> {}

// ============================================================================
// Hook principale
// ============================================================================

export function useIcps() {
  const { user } = useAuth();
  const [icps, setIcps] = useState<IcpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIcps = useCallback(async () => {
    if (!user) {
      setIcps([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("icps")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
      toast.error("Errore caricamento ICP", { description: err.message });
      setLoading(false);
      return;
    }
    setIcps((data ?? []) as unknown as IcpRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchIcps();
  }, [fetchIcps]);

  const defaultIcp = icps.find((i) => i.is_default) ?? null;

  // ----- Mutazioni ----------

  const create = useCallback(
    async (input: IcpCreateInput): Promise<IcpRow | null> => {
      if (!user) return null;
      const isFirst = icps.length === 0;
      const row = {
        user_id: user.id,
        name: input.name.trim() || "ICP senza nome",
        description: input.description ?? null,
        icp_json: input.icp_json ?? {},
        buyer_personas: input.buyer_personas ?? null,
        linkedin_search_query: input.linkedin_search_query ?? null,
        trigger_events: input.trigger_events ?? null,
        exclusioni: input.exclusioni ?? null,
        filters_override: input.filters_override ?? null,
        is_default: input.is_default ?? isFirst,
        source: input.source ?? "auto",
      };
      const { data, error: err } = await supabase
        .from("icps")
        .insert(row as any)
        .select()
        .single();
      if (err) {
        toast.error("Salvataggio ICP fallito", { description: err.message });
        return null;
      }
      const created = data as unknown as IcpRow;
      await fetchIcps();
      return created;
    },
    [user, icps.length, fetchIcps],
  );

  const update = useCallback(
    async (id: string, patch: IcpUpdateInput): Promise<IcpRow | null> => {
      if (!user) return null;
      const updateRow: Record<string, unknown> = { ...patch };
      if (typeof updateRow.name === "string") {
        updateRow.name = (updateRow.name as string).trim() || "ICP senza nome";
      }
      const { data, error: err } = await supabase
        .from("icps")
        .update(updateRow as any)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
      if (err) {
        toast.error("Aggiornamento ICP fallito", { description: err.message });
        return null;
      }
      const updated = data as unknown as IcpRow;
      await fetchIcps();
      return updated;
    },
    [user, fetchIcps],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;
      const { error: err } = await supabase
        .from("icps")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (err) {
        toast.error("Eliminazione ICP fallita", { description: err.message });
        return false;
      }
      await fetchIcps();
      return true;
    },
    [user, fetchIcps],
  );

  const setDefault = useCallback(
    async (id: string): Promise<boolean> => {
      const updated = await update(id, { is_default: true });
      return updated !== null;
    },
    [update],
  );

  const duplicate = useCallback(
    async (id: string, newName?: string): Promise<IcpRow | null> => {
      const orig = icps.find((i) => i.id === id);
      if (!orig) return null;
      return create({
        name: newName?.trim() || `${orig.name} (copia)`,
        description: orig.description ?? "",
        icp_json: orig.icp_json,
        buyer_personas: orig.buyer_personas,
        linkedin_search_query: orig.linkedin_search_query,
        trigger_events: orig.trigger_events,
        exclusioni: orig.exclusioni,
        filters_override: orig.filters_override,
        is_default: false,
        source: "duplicate",
      });
    },
    [icps, create],
  );

  const touchUsed = useCallback(
    async (id: string): Promise<void> => {
      if (!user) return;
      const { error: err } = await supabase
        .from("icps")
        .update({ last_used_at: new Date().toISOString() } as any)
        .eq("id", id)
        .eq("user_id", user.id);
      if (err) {
        // eslint-disable-next-line no-console
        console.warn("[useIcps] touchUsed failed:", err.message);
      }
    },
    [user],
  );

  return {
    icps,
    defaultIcp,
    loading,
    error,
    fetchIcps,
    create,
    update,
    remove,
    setDefault,
    duplicate,
    touchUsed,
  };
}
