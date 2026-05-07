// src/pages/Content.tsx
// ============================================================================
// Pagina "I miei contenuti" — gestione storico content_assets (post, hook,
// improvement, visual_brief, carousel_brief) con tabs + filtro + ricerca.
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sparkles,
  Star,
  Trash2,
  Loader2,
  ChevronRight,
  Search as SearchIcon,
  Pencil,
  PenTool,
  Wand2,
  Zap,
  Image as ImageIcon,
  Layers,
} from "lucide-react";
import {
  useContentAssets,
  contentTypeLabel,
  contentTypeColor,
  contentTypeToSkillId,
  type ContentAssetRow,
  type ContentAssetType,
} from "@/hooks/useContentAssets";
import { toast } from "sonner";

const TYPE_TABS: Array<{ value: "all" | ContentAssetType; label: string; icon: any }> = [
  { value: "all", label: "Tutti", icon: Sparkles },
  { value: "post", label: "Post", icon: PenTool },
  { value: "hook", label: "Hook", icon: Zap },
  { value: "improvement", label: "Migliorati", icon: Wand2 },
  { value: "visual_brief", label: "Visual", icon: ImageIcon },
  { value: "carousel_brief", label: "Carousel", icon: Layers },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function getPreview(asset: ContentAssetRow): string {
  const out = asset.output as any;
  switch (asset.type) {
    case "post":
      return (out.post_text || out.hook || "").toString().slice(0, 200);
    case "improvement":
      return (out.post_improved || "").toString().slice(0, 200);
    case "hook": {
      const hooks = (out.hooks || []) as Array<{ text?: string }>;
      return hooks
        .slice(0, 2)
        .map((h) => h.text)
        .filter(Boolean)
        .join(" · ");
    }
    case "visual_brief":
      return (out.concept || out.summary || "").toString().slice(0, 200);
    case "carousel_brief":
      return (out.title || out.summary || "").toString().slice(0, 200);
    default:
      return "";
  }
}

export default function Content() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("type") as any) || "all";
  const [tab, setTab] = useState<"all" | ContentAssetType>(initialTab);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ContentAssetRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const filterType = tab === "all" ? undefined : tab;
  const { assets, loading, remove, toggleStar, rename } = useContentAssets(filterType);

  // Sync tab → URL
  useEffect(() => {
    if (tab === "all") {
      const sp = new URLSearchParams(searchParams);
      sp.delete("type");
      setSearchParams(sp, { replace: true });
    } else {
      const sp = new URLSearchParams(searchParams);
      sp.set("type", tab);
      setSearchParams(sp, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const filtered = useMemo(() => {
    if (!query.trim()) return assets;
    const q = query.trim().toLowerCase();
    return assets.filter(
      (a) => a.title.toLowerCase().includes(q) || getPreview(a).toLowerCase().includes(q),
    );
  }, [assets, query]);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    const ok = await remove(pendingDelete.id);
    setBusyId(null);
    setPendingDelete(null);
    if (ok) toast.success("Contenuto eliminato.");
  };

  const handleStar = async (a: ContentAssetRow) => {
    setBusyId(a.id);
    await toggleStar(a.id, a.starred);
    setBusyId(null);
  };

  const handleRenameStart = (a: ContentAssetRow) => {
    setRenameId(a.id);
    setRenameDraft(a.title);
  };

  const handleRenameSave = async () => {
    if (!renameId) return;
    setBusyId(renameId);
    await rename(renameId, renameDraft);
    setBusyId(null);
    setRenameId(null);
    setRenameDraft("");
    toast.success("Titolo aggiornato.");
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4 animate-in">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">I miei contenuti</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Storico delle generazioni: post, hook, miglioramenti e brief visivi. Click su una card per riaprirla nella sua skill.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full bg-surface/50 border border-border/30">
            {TYPE_TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger key={t.value} value={t.value} className="text-xs">
                  <Icon className="h-3.5 w-3.5 mr-1.5" />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per titolo o contenuto…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-surface border-border/50 focus:border-primary pl-9 h-10"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-muted-foreground animate-in">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">Caricamento contenuti…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <Card className="bg-surface/30 border-dashed border-border/40 animate-in">
            <CardContent className="p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">
                  {query.trim() ? "Nessun risultato" : "Nessun contenuto ancora"}
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {query.trim()
                    ? "Prova a cambiare la query o rimuovi il filtro."
                    : "Genera il tuo primo post, hook o brief — appariranno qui."}
                </p>
              </div>
              {!query.trim() && (
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button asChild className="bg-primary hover:bg-primary-hover text-primary-foreground">
                    <Link to="/skill/post-writer">Scrivi un post</Link>
                  </Button>
                  <Button asChild variant="outline" className="border-border/50">
                    <Link to="/skill/hook-generator">Genera hook</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Lista cards */}
        {!loading && filtered.length > 0 && (
          <div className="grid gap-3 animate-in">
            {filtered.map((a) => {
              const preview = getPreview(a);
              const skillId = contentTypeToSkillId(a.type);
              return (
                <Card
                  key={a.id}
                  className="bg-surface/50 border-border/30 hover:border-border transition-all"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge
                            variant="outline"
                            className={`${contentTypeColor(a.type)} text-[10px] border`}
                          >
                            {contentTypeLabel(a.type)}
                          </Badge>
                          {a.starred && (
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          )}
                          {a.parent_id && (
                            <Badge variant="outline" className="border-border/50 text-[9px]">
                              ↪ chain
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(a.created_at)}
                          </span>
                        </div>
                        {renameId === a.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={renameDraft}
                              onChange={(e) => setRenameDraft(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleRenameSave()}
                              className="bg-surface border-border/50 h-8 text-sm"
                              autoFocus
                            />
                            <Button size="sm" onClick={handleRenameSave} disabled={busyId === a.id}>
                              Salva
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setRenameId(null)}>
                              Annulla
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm font-medium truncate">{a.title}</p>
                        )}
                        {preview && renameId !== a.id && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{preview}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="border-border/50 hover:border-primary/50 hover:text-primary"
                        >
                          <Link to={`/skill/${skillId}?assetId=${a.id}`}>
                            Apri
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-amber-400"
                          disabled={busyId === a.id}
                          onClick={() => handleStar(a)}
                          title={a.starred ? "Rimuovi preferito" : "Preferito"}
                        >
                          <Star className={`h-3.5 w-3.5 ${a.starred ? "fill-amber-400 text-amber-400" : ""}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-primary"
                          disabled={busyId === a.id || renameId === a.id}
                          onClick={() => handleRenameStart(a)}
                          title="Rinomina"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          disabled={busyId === a.id}
                          onClick={() => setPendingDelete(a)}
                          title="Elimina"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm delete dialog */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare "{pendingDelete?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Questo contenuto verrà rimosso definitivamente. Eventuali contenuti che ne discendono (chain) perdono solo il riferimento, non vengono eliminati.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
