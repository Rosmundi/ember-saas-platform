// src/pages/Icps.tsx
// ============================================================================
// Pagina "I miei ICP" — gestione multi-ICP.
// Lista cards con: nome, descrizione, settore principale, n° buyer personas, badge default.
// Azioni: imposta default, modifica (→ /skill/icp-builder?icpId=...), duplica, elimina,
// "Cerca con questo ICP" (→ /skill/prospect-finder?icpId=...).
//
// Empty state: invito a creare il primo ICP (→ /skill/icp-builder).
//
// Dipende da: useIcps (hook), AppLayout, shadcn/ui Card/Button/Badge.
// ============================================================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Target,
  Star,
  StarOff,
  Pencil,
  Copy,
  Trash2,
  Search,
  Plus,
  Loader2,
  Users,
} from "lucide-react";
import { useIcps, type IcpRow } from "@/hooks/useIcps";
import { toast } from "sonner";

// ----- Helpers display -------------------------------------------------------

function getSettoreLabel(icp: IcpRow): string {
  const j = icp.icp_json || {};
  const settore = (j as any).settore;
  if (Array.isArray(settore)) return settore.slice(0, 2).join(", ");
  if (typeof settore === "string") return settore;
  return "—";
}

function getDimensioneLabel(icp: IcpRow): string {
  const j = icp.icp_json || {};
  const dim = (j as any).dimensione_azienda;
  if (typeof dim === "string") return dim;
  if (dim && typeof dim === "object") {
    const dipendenti = (dim as any).dipendenti;
    if (typeof dipendenti === "string") return `${dipendenti} dip.`;
  }
  return "—";
}

function countPersonas(icp: IcpRow): number {
  return Array.isArray(icp.buyer_personas) ? icp.buyer_personas.length : 0;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

// ----- Card singola ----------------------------------------------------------

function IcpCard({
  icp,
  onSetDefault,
  onDuplicate,
  onDelete,
  busy,
}: {
  icp: IcpRow;
  onSetDefault: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onDelete: (id: string) => void;
  busy: boolean;
}) {
  return (
    <Card className="bg-surface/50 border-border/30 hover:border-border transition-all">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base truncate">{icp.name}</h3>
              {icp.is_default && (
                <Badge className="bg-primary/15 text-primary border-0 text-[10px]">
                  <Star className="h-3 w-3 mr-1" />
                  Default
                </Badge>
              )}
              {icp.source === "manual" && (
                <Badge variant="outline" className="border-border/50 text-[10px]">manuale</Badge>
              )}
              {icp.source === "duplicate" && (
                <Badge variant="outline" className="border-border/50 text-[10px]">copia</Badge>
              )}
            </div>
            {icp.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{icp.description}</p>
            )}
          </div>
        </div>

        {/* Sintesi */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-2 rounded-lg bg-background/30">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Settore</p>
            <p className="font-medium truncate">{getSettoreLabel(icp)}</p>
          </div>
          <div className="p-2 rounded-lg bg-background/30">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Dimensione</p>
            <p className="font-medium truncate">{getDimensioneLabel(icp)}</p>
          </div>
          <div className="p-2 rounded-lg bg-background/30">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Buyer personas</p>
            <p className="font-medium flex items-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              {countPersonas(icp)}
            </p>
          </div>
        </div>

        {/* Footer: data + azioni */}
        <div className="flex items-center justify-between pt-2 border-t border-border/20">
          <p className="text-[11px] text-muted-foreground">
            Creato il {formatDate(icp.created_at)}
            {icp.last_used_at && (
              <span> · Ultimo uso {formatDate(icp.last_used_at)}</span>
            )}
          </p>
        </div>

        {/* Azioni */}
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            size="sm"
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            <Link to={`/skill/prospect-finder?icpId=${icp.id}`}>
              <Search className="h-3.5 w-3.5 mr-1.5" />
              Cerca prospect
            </Link>
          </Button>

          <Button asChild size="sm" variant="outline" className="border-border/50">
            <Link to={`/skill/icp-builder?icpId=${icp.id}`}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Modifica
            </Link>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-border/50"
            disabled={busy}
            onClick={() => onDuplicate(icp.id)}
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Duplica
          </Button>

          {!icp.is_default && (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-primary"
              disabled={busy}
              onClick={() => onSetDefault(icp.id)}
            >
              <StarOff className="h-3.5 w-3.5 mr-1.5" />
              Imposta default
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive ml-auto"
            disabled={busy}
            onClick={() => onDelete(icp.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ----- Pagina ----------------------------------------------------------------

export default function Icps() {
  const navigate = useNavigate();
  const { icps, loading, setDefault, duplicate, remove } = useIcps();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<IcpRow | null>(null);

  const handleSetDefault = async (id: string) => {
    setBusyId(id);
    const ok = await setDefault(id);
    setBusyId(null);
    if (ok) toast.success("Impostato come ICP default.");
  };

  const handleDuplicate = async (id: string) => {
    setBusyId(id);
    const dup = await duplicate(id);
    setBusyId(null);
    if (dup) toast.success(`Duplicato come "${dup.name}".`);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    const ok = await remove(pendingDelete.id);
    setBusyId(null);
    setPendingDelete(null);
    if (ok) toast.success("ICP eliminato.");
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap animate-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">I miei ICP</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Crea, modifica e gestisci i tuoi profili cliente ideale. Quello marcato "Default" viene usato automaticamente nelle ricerche prospect.
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/skill/icp-builder?new=1")}
            className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuovo ICP
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-muted-foreground animate-in">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">Caricamento ICP…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && icps.length === 0 && (
          <Card className="bg-surface/30 border-dashed border-border/40 animate-in">
            <CardContent className="p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Nessun ICP ancora</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Crea il tuo primo Ideal Customer Profile per iniziare a cercare i prospect giusti su LinkedIn.
                </p>
              </div>
              <Button
                onClick={() => navigate("/skill/icp-builder?new=1")}
                className="bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crea il primo ICP
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista */}
        {!loading && icps.length > 0 && (
          <div className="grid gap-4 animate-in">
            {icps.map((icp) => (
              <IcpCard
                key={icp.id}
                icp={icp}
                onSetDefault={handleSetDefault}
                onDuplicate={handleDuplicate}
                onDelete={(id) => {
                  const target = icps.find((i) => i.id === id);
                  if (target) setPendingDelete(target);
                }}
                busy={busyId === icp.id}
              />
            ))}
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
            <AlertDialogTitle>Eliminare "{pendingDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              L'ICP verrà eliminato definitivamente. I prospect già trovati con questo ICP restano nella tua lista.
              {pendingDelete?.is_default && (
                <span className="block mt-2 text-warning">
                  ⚠️ Stai eliminando l'ICP <strong>default</strong>. Imposta un nuovo default subito dopo, altrimenti la ricerca prospect senza URL non saprà quale ICP usare.
                </span>
              )}
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
