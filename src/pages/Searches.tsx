// src/pages/Searches.tsx
// ============================================================================
// Pagina "Le mie ricerche" — storico completo paginato delle prospect search.
// Linkata dalla right rail del prospect-finder (dopo le 10 più recenti) e dalla
// sidebar AppLayout.
// ============================================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  History as HistoryIcon,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search as SearchIcon,
  AlertTriangle,
} from "lucide-react";
import {
  useSearchHistory,
  searchSourceLabel,
  searchSourceColor,
  searchSummary,
  type SearchRow,
} from "@/hooks/useSearches";
import { toast } from "sonner";

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function durationLabel(ms: number | null): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function Searches() {
  const [page, setPage] = useState(0);
  const { searches, totalCount, totalPages, loading, remove } = useSearchHistory(page);
  const [pendingDelete, setPendingDelete] = useState<SearchRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    const ok = await remove(pendingDelete.id);
    setBusyId(null);
    setPendingDelete(null);
    if (ok) toast.success("Ricerca eliminata.");
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4 animate-in">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <HistoryIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Le mie ricerche</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Storico di tutte le ricerche prospect. Apri una ricerca per rivedere i profili trovati senza consumare quota.
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-muted-foreground animate-in">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">Caricamento storico…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && searches.length === 0 && (
          <Card className="bg-surface/30 border-dashed border-border/40 animate-in">
            <CardContent className="p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <SearchIcon className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Nessuna ricerca ancora</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Vai su "Trova prospect" e fai la tua prima ricerca per ICP, URL o nome.
                </p>
              </div>
              <Button asChild className="bg-primary hover:bg-primary-hover text-primary-foreground">
                <Link to="/skill/prospect-finder">Trova prospect</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista */}
        {!loading && searches.length > 0 && (
          <>
            <div className="grid gap-3 animate-in">
              {searches.map((s) => (
                <Card
                  key={s.id}
                  className="bg-surface/50 border-border/30 hover:border-border transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge
                            variant="outline"
                            className={`${searchSourceColor(s.source)} text-[10px] border`}
                          >
                            {searchSourceLabel(s.source)}
                          </Badge>
                          {s.status === "error" && (
                            <Badge className="bg-destructive/15 text-destructive border-0 text-[10px]">
                              <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                              Errore
                            </Badge>
                          )}
                          {s.status === "running" && (
                            <Badge className="bg-warning/15 text-warning border-0 text-[10px]">
                              In corso
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(s.created_at)}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate">{searchSummary(s)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {s.prospect_count} prospect · {durationLabel(s.duration_ms)}
                          {s.error_message && (
                            <span className="text-destructive ml-2">· {s.error_message.slice(0, 80)}</span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {s.prospect_count > 0 && (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="border-border/50"
                          >
                            <Link to={`/skill/prospect-finder?searchId=${s.id}`}>
                              Apri
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          disabled={busyId === s.id}
                          onClick={() => setPendingDelete(s)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Paginazione */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border/30">
                <p className="text-xs text-muted-foreground">
                  {totalCount} ricerche totali · pagina {page + 1} di {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border/50"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                    Precedente
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border/50"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Successiva
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm delete */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa ricerca?</AlertDialogTitle>
            <AlertDialogDescription>
              Lo storico verrà eliminato. I prospect trovati restano in "Trova prospect" (perdono solo il riferimento alla ricerca).
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
