// src/hooks/useContentAssets.ts
// ============================================================================
// Hook per CRUD asset di content (tabella `content_assets`, migration 013+014).
//
// Discriminator: `type` ∈ 'post' | 'improvement' | 'hook' | 'visual_brief'
//                       | 'carousel_brief' | 'banner_brief'.
// `parent_id` collega gli asset in chain (post → improvement, post → hook,
// post → visual_brief, post → carousel_brief, ecc.).
// Title auto-generato dall'app prima dell'INSERT.
//
// Pattern UX:
//   - useContentAssets() → tutti, con filtro opzionale type
//   - useRecentContentAssets(type, limit) → right rail per skill
//   - useContentAssetById(id) → singolo asset (per ?assetId=X read-only)
// ============================================================================

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ContentAssetType =
  | "post"
  | "improvement"
  | "hook"
  | "visual_brief"
  | "carousel_brief"
  | "banner_brief"
  | "profile_audit";

export interface ContentAssetRow {
  id: string;
  user_id: string;
  type: ContentAssetType;
  title: string;
  parent_id: string | null;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  starred: boolean;
  status: "draft" | "completed" | "error";
  created_at: string;
  updated_at: string;
}

export interface ContentAssetCreateInput {
  type: ContentAssetType;
  title?: string;
  parent_id?: string | null;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  status?: "draft" | "completed" | "error";
}

// ============================================================================
// Helper: title auto-generation
// ============================================================================

const TITLE_MAX_CHARS = 60;

function truncateForTitle(s: string, max = TITLE_MAX_CHARS): string {
  const trimmed = s.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).trimEnd() + "…";
}

export function autoTitleForAsset(
  type: ContentAssetType,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
): string {
  const out = output as any;
  const inp = input as any;
  switch (type) {
    case "post": {
      // Priorità: hook generato > tema input
      const hook = (out.hook || out.post_text?.split("\n")?.[0] || "").toString();
      if (hook) return truncateForTitle(hook);
      if (inp.tema) return truncateForTitle(String(inp.tema));
      return "Post senza titolo";
    }
    case "improvement": {
      const orig = (inp.post_originale || "").toString();
      if (orig) return `Miglioramento di "${truncateForTitle(orig, 40)}"`;
      return "Miglioramento senza titolo";
    }
    case "hook": {
      if (inp.tema) return `Hook per "${truncateForTitle(String(inp.tema), 50)}"`;
      return "Hook senza titolo";
    }
    case "visual_brief":
      return inp.post_text
        ? `Visual brief: "${truncateForTitle(String(inp.post_text), 40)}"`
        : "Visual brief senza titolo";
    case "carousel_brief": {
      const seed = inp.tema || inp.post_text || "";
      return seed
        ? `Carousel: "${truncateForTitle(String(seed), 40)}"`
        : "Carousel senza titolo";
    }
    case "banner_brief": {
      // Per il banner usiamo il concept generato (output) se presente,
      // altrimenti il nome dall'autore (input.profilo_business.nome).
      const concept = (output as any).concept;
      if (concept) return truncateForTitle(`Banner: ${concept}`, 60);
      const bizNome = inp.profilo_business?.nome;
      if (bizNome) return `Banner profilo di ${truncateForTitle(String(bizNome), 30)}`;
      return "Banner profilo senza titolo";
    }
    case "profile_audit": {
      const score = (out as any).score_complessivo;
      return score != null
        ? `Audit profilo — score ${score}/100`
        : "Audit profilo LinkedIn";
    }
    default:
      return "Asset senza titolo";
  }
}

// ============================================================================
// Hook principale: lista + filtro
// ============================================================================

export function useContentAssets(filterType?: ContentAssetType) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<ContentAssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!user) {
      setAssets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    let q = supabase
      .from("content_assets")
      .select("*")
      .eq("user_id", user.id)
      .order("starred", { ascending: false })
      .order("created_at", { ascending: false });
    if (filterType) {
      q = q.eq("type", filterType);
    }
    const { data, error: err } = await q;
    if (err) {
      setError(err.message);
      toast.error("Errore caricamento contenuti", { description: err.message });
      setLoading(false);
      return;
    }
    setAssets((data ?? []) as unknown as ContentAssetRow[]);
    setLoading(false);
  }, [user, filterType]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // ----- mutations -----

  const create = useCallback(
    async (input: ContentAssetCreateInput): Promise<ContentAssetRow | null> => {
      if (!user) return null;
      const title =
        input.title?.trim() ||
        autoTitleForAsset(input.type, input.input ?? {}, input.output ?? {});
      const row = {
        user_id: user.id,
        type: input.type,
        title,
        parent_id: input.parent_id ?? null,
        input: input.input ?? {},
        output: input.output ?? {},
        status: input.status ?? "completed",
      };
      const { data, error: err } = await supabase
        .from("content_assets")
        .insert(row as any)
        .select()
        .single();
      if (err) {
        // eslint-disable-next-line no-console
        console.error("[useContentAssets] insert error:", err);
        toast.error("Salvataggio asset fallito", { description: err.message });
        return null;
      }
      const created = data as unknown as ContentAssetRow;
      await fetchAssets();
      return created;
    },
    [user, fetchAssets],
  );

  const update = useCallback(
    async (id: string, patch: Partial<Pick<ContentAssetRow, "title" | "starred" | "status">>) => {
      if (!user) return null;
      const { data, error: err } = await supabase
        .from("content_assets")
        .update(patch as any)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
      if (err) {
        toast.error("Aggiornamento asset fallito", { description: err.message });
        return null;
      }
      await fetchAssets();
      return data as unknown as ContentAssetRow;
    },
    [user, fetchAssets],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;
      const { error: err } = await supabase
        .from("content_assets")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (err) {
        toast.error("Eliminazione asset fallita", { description: err.message });
        return false;
      }
      await fetchAssets();
      return true;
    },
    [user, fetchAssets],
  );

  const toggleStar = useCallback(
    async (id: string, current: boolean) => update(id, { starred: !current }),
    [update],
  );

  const rename = useCallback(
    async (id: string, newTitle: string) => update(id, { title: newTitle.trim() || "Senza titolo" }),
    [update],
  );

  return { assets, loading, error, fetchAssets, create, update, remove, toggleStar, rename };
}

// ============================================================================
// Hook: ultimi N asset di un certo type (per right rail)
// ============================================================================

export function useRecentContentAssets(type: ContentAssetType, limit = 8) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<ContentAssetRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setAssets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("content_assets")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", type)
      .order("created_at", { ascending: false })
      .limit(limit);
    setAssets((data ?? []) as unknown as ContentAssetRow[]);
    setLoading(false);
  }, [user, type, limit]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { assets, loading, refetch };
}

// ============================================================================
// Hook: singolo asset by id
// ============================================================================

export function useContentAssetById(id: string | null) {
  const { user } = useAuth();
  const [asset, setAsset] = useState<ContentAssetRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user || !id) {
      setAsset(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("content_assets")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setAsset(data ? (data as unknown as ContentAssetRow) : null);
    setLoading(false);
  }, [user, id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { asset, loading, error, refetch };
}

// ============================================================================
// Helpers display
// ============================================================================

export function contentTypeLabel(type: ContentAssetType): string {
  switch (type) {
    case "post":
      return "Post";
    case "improvement":
      return "Miglioramento";
    case "hook":
      return "Hook";
    case "visual_brief":
      return "Visual brief";
    case "carousel_brief":
      return "Carousel brief";
    case "banner_brief":
      return "Banner brief";
    case "profile_audit":
      return "Audit profilo";
    default:
      return type;
  }
}

export function contentTypeColor(type: ContentAssetType): string {
  switch (type) {
    case "post":
      return "bg-primary/15 text-primary border-primary/30";
    case "improvement":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "hook":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "visual_brief":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    case "carousel_brief":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "banner_brief":
      return "bg-pink-500/15 text-pink-400 border-pink-500/30";
    case "profile_audit":
      return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
    default:
      return "bg-muted text-muted-foreground border-border/30";
  }
}

/**
 * Mappatura type → skillId della skill page che lo gestisce.
 * Usata per costruire link `?assetId=<id>` o `?fromAssetId=<id>`.
 *
 * v3.8.3 (Tranche 2.1): visual_brief e carousel_brief puntano alla STESSA skill page
 * (`visual-brief`) che internamente ha tab Singolo|Carosello. La detection del tab
 * iniziale avviene in SkillPage.tsx (init values + fromAssetId useEffect).
 */
export function contentTypeToSkillId(type: ContentAssetType): string {
  switch (type) {
    case "post":
      return "post-writer";
    case "improvement":
      return "post-improver";
    case "hook":
      return "hook-generator";
    case "visual_brief":
      return "visual-brief";
    case "carousel_brief":
      return "visual-brief"; // stessa skill page, tab Carosello (detect via asset.type in SkillForm)
    case "banner_brief":
      return "profile-banner-brief";
    default:
      return "post-writer";
  }
}
