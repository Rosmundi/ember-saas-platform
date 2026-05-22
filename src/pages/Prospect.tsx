// src/pages/Prospect.tsx
// ============================================================================
// v3.8.10 — Hub unificato Layer Prospect.
// Tre sezioni in tabs: Target (ICP), Cerca (4 modalità), Storico ricerche.
// Le ricerche aprono /skill/prospect-finder con query params.
// La gestione ICP riusa la logica di useIcps. Outreach parte da una card prospect
// nello storico (apre /skill/prospect-finder?searchId=...).
// ============================================================================

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Link as LinkIcon,
  User,
  Building2,
  History as HistoryIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Radar,
} from "lucide-react";
import { useIcps, type IcpRow } from "@/hooks/useIcps";
import {
  useSearchHistory,
  searchSourceLabel,
  searchSourceColor,
  searchSummary,
  type SearchRow,
} from "@/hooks/useSearches";
import { toast } from "sonner";

// ----- helpers ---------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}
function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("it-IT", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}
function durationLabel(ms: number | null): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
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

// ============================================================================
// Target Section (ICP)
// ============================================================================

function IcpMiniCard({
  icp,
  onSetDefault,
  onDuplicate,
  onDelete,
  busy,
}: {
  icp: IcpRow;
  onSetDefault: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  busy: boolean;
}) {
  return (
    <Card className="bg-surface/50 border-border/30 hover:border-border transition-all">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base truncate">{icp.name}</h3>
              {icp.is_default && (
                <Badge className="bg-primary/15 text-primary border-0 text-[10px]">
                  <Star className="h-3 w-3 mr-1" /> Default
                </Badge>
              )}
            </div>
            {icp.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{icp.description}</p>
            )}
          </div>
        </div>

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

        <div className="flex items-center justify-between pt-2 border-t border-border/20">
          <p className="text-[11px] text-muted-foreground">
            Creato il {formatDate(icp.created_at)}
            {icp.last_used_at && <span> · Ultimo uso {formatDate(icp.last_used_at)}</span>}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground">
            <Link to={`/skill/prospect-finder?mode=icp&icpId=${icp.id}`}>
              <Search className="h-3.5 w-3.5 mr-1.5" /> Cerca prospect
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-border/50">
            <Link to={`/skill/icp-builder?icpId=${icp.id}`}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Modifica
            </Link>
          </Button>
          <Button size="sm" variant="outline" className="border-border/50" disabled={busy} onClick={() => onDuplicate(icp.id)}>
            <Copy className="h-3.5 w-3.5 mr-1.5" /> Duplica
          </Button>
          {!icp.is_default && (
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary" disabled={busy} onClick={() => onSetDefault(icp.id)}>
              <StarOff className="h-3.5 w-3.5 mr-1.5" /> Imposta default
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive ml-auto" disabled={busy} onClick={() => onDelete(icp.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TargetSection() {
  const navigate = useNavigate();
  const { icps, loading, setDefault, duplicate, remove } = useIcps();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<IcpRow | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">I tuoi ICP</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Definisci il cliente ideale. L'ICP marcato "Default" viene usato dalle ricerche prospect.
          </p>
        </div>
        <Button
          onClick={() => navigate("/skill/icp-builder?new=1")}
          size="sm"
          className="bg-primary hover:bg-primary-hover text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Nuovo ICP
        </Button>
      </div>

      {loading && (
        <div className="text-center py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          <p className="text-sm">Caricamento ICP…</p>
        </div>
      )}

      {!loading && icps.length === 0 && (
        <Card className="bg-surface/30 border-dashed border-border/40">
          <CardContent className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Nessun ICP ancora</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Crea il tuo primo Ideal Customer Profile per iniziare a cercare i prospect giusti.
              </p>
            </div>
            <Button
              onClick={() => navigate("/skill/icp-builder?new=1")}
              className="bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" /> Crea il primo ICP
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && icps.length > 0 && (
        <div className="grid gap-4">
          {icps.map((icp) => (
            <IcpMiniCard
              key={icp.id}
              icp={icp}
              busy={busyId === icp.id}
              onSetDefault={async (id) => {
                setBusyId(id);
                const ok = await setDefault(id);
                setBusyId(null);
                if (ok) toast.success("Impostato come ICP default.");
              }}
              onDuplicate={async (id) => {
                setBusyId(id);
                const dup = await duplicate(id);
                setBusyId(null);
                if (dup) toast.success(`Duplicato come "${dup.name}".`);
              }}
              onDelete={(id) => {
                const target = icps.find((i) => i.id === id);
                if (target) setPendingDelete(target);
              }}
            />
          ))}
        </div>
      )}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare "{pendingDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              L'ICP verrà eliminato definitivamente. I prospect già trovati restano nella tua lista.
              {pendingDelete?.is_default && (
                <span className="block mt-2 text-warning">
                  ⚠️ Stai eliminando l'ICP <strong>default</strong>. Impostane uno nuovo subito dopo.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingDelete) return;
                setBusyId(pendingDelete.id);
                const ok = await remove(pendingDelete.id);
                setBusyId(null);
                setPendingDelete(null);
                if (ok) toast.success("ICP eliminato.");
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// Search Section (4 modalità)
// ============================================================================

function SearchSection() {
  const navigate = useNavigate();
  const { icps, defaultIcp, loading } = useIcps();
  const [mode, setMode] = useState<"icp" | "url" | "name" | "company">("icp");
  const [icpId, setIcpId] = useState<string>("");
  const [url, setUrl] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");

  const effectiveIcpId = icpId || defaultIcp?.id || "";

  const go = () => {
    const params = new URLSearchParams();
    params.set("mode", mode);
    if (mode === "icp") {
      if (effectiveIcpId) params.set("icpId", effectiveIcpId);
    } else if (mode === "url") {
      if (!url.trim()) { toast.error("Inserisci un URL LinkedIn."); return; }
      params.set("url", url.trim());
    } else if (mode === "name") {
      if (!firstName.trim() && !lastName.trim()) { toast.error("Inserisci nome o cognome."); return; }
      if (firstName.trim()) params.set("firstName", firstName.trim());
      if (lastName.trim()) params.set("lastName", lastName.trim());
    } else if (mode === "company") {
      if (!company.trim()) { toast.error("Inserisci il nome azienda."); return; }
      params.set("company", company.trim());
    }
    navigate(`/skill/prospect-finder?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Trova prospect</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Scegli come cercare. La ricerca apre Prospect Finder con i parametri precompilati.
        </p>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="icp"><Target className="h-3.5 w-3.5 mr-1.5" />Per ICP</TabsTrigger>
          <TabsTrigger value="url"><LinkIcon className="h-3.5 w-3.5 mr-1.5" />Per URL</TabsTrigger>
          <TabsTrigger value="name"><User className="h-3.5 w-3.5 mr-1.5" />Per nome</TabsTrigger>
          <TabsTrigger value="company"><Building2 className="h-3.5 w-3.5 mr-1.5" />Per azienda</TabsTrigger>
        </TabsList>

        <TabsContent value="icp" className="mt-4">
          <Card className="bg-surface/50 border-border/30">
            <CardContent className="p-5 space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Caricamento ICP…</p>
              ) : icps.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Nessun ICP disponibile. <Link to="/skill/icp-builder?new=1" className="text-primary underline">Crea il primo ICP</Link>.
                </div>
              ) : (
                <>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">ICP da usare</label>
                  <select
                    value={effectiveIcpId}
                    onChange={(e) => setIcpId(e.target.value)}
                    className="w-full bg-background/30 border border-border/50 rounded-md px-3 py-2 text-sm"
                  >
                    {icps.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}{i.is_default ? " (default)" : ""}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="url" className="mt-4">
          <Card className="bg-surface/50 border-border/30">
            <CardContent className="p-5 space-y-3">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">URL ricerca LinkedIn</label>
              <Input
                placeholder="https://www.linkedin.com/search/results/people/?..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="name" className="mt-4">
          <Card className="bg-surface/50 border-border/30">
            <CardContent className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Nome</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Mario" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Cognome</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Rossi" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="mt-4">
          <Card className="bg-surface/50 border-border/30">
            <CardContent className="p-5 space-y-3">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Nome azienda</label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme S.p.A." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={go} className="bg-primary hover:bg-primary-hover text-primary-foreground">
          <Search className="h-4 w-4 mr-2" /> Avvia ricerca
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// History Section
// ============================================================================

function HistorySection() {
  const [page, setPage] = useState(0);
  const { searches, totalCount, totalPages, loading, remove } = useSearchHistory(page);
  const [pendingDelete, setPendingDelete] = useState<SearchRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Storico ricerche</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Rivedi le ricerche passate senza consumare quota. Da una ricerca puoi aprire ogni prospect e scrivere un outreach.
        </p>
      </div>

      {loading && (
        <div className="text-center py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          <p className="text-sm">Caricamento storico…</p>
        </div>
      )}

      {!loading && searches.length === 0 && (
        <Card className="bg-surface/30 border-dashed border-border/40">
          <CardContent className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Radar className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Nessuna ricerca ancora</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Vai sul tab "Cerca" e lancia la tua prima ricerca prospect.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && searches.length > 0 && (
        <>
          <div className="grid gap-3">
            {searches.map((s) => (
              <Card key={s.id} className="bg-surface/50 border-border/30 hover:border-border transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline" className={`${searchSourceColor(s.source)} text-[10px] border`}>
                          {searchSourceLabel(s.source)}
                        </Badge>
                        {s.status === "error" && (
                          <Badge className="bg-destructive/15 text-destructive border-0 text-[10px]">
                            <AlertTriangle className="h-2.5 w-2.5 mr-1" /> Errore
                          </Badge>
                        )}
                        {s.status === "running" && (
                          <Badge className="bg-warning/15 text-warning border-0 text-[10px]">In corso</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{formatDateTime(s.created_at)}</span>
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
                        <Button asChild size="sm" variant="outline" className="border-border/50">
                          <Link to={`/skill/prospect-finder?searchId=${s.id}`}>
                            Apri <ChevronRight className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      )}
                      <Button
                        size="sm" variant="ghost"
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border/30">
              <p className="text-xs text-muted-foreground">
                {totalCount} ricerche totali · pagina {page + 1} di {totalPages}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-border/50" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Precedente
                </Button>
                <Button size="sm" variant="outline" className="border-border/50" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  Successiva <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa ricerca?</AlertDialogTitle>
            <AlertDialogDescription>
              Lo storico verrà eliminato. I prospect trovati restano nella lista (perdono solo il riferimento alla ricerca).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingDelete) return;
                setBusyId(pendingDelete.id);
                const ok = await remove(pendingDelete.id);
                setBusyId(null);
                setPendingDelete(null);
                if (ok) toast.success("Ricerca eliminata.");
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function Prospect() {
  const [params, setParams] = useSearchParams();
  const initial = (params.get("tab") as "target" | "cerca" | "storico") || "target";
  const [tab, setTab] = useState<"target" | "cerca" | "storico">(initial);

  const onTabChange = (v: string) => {
    setTab(v as typeof tab);
    const next = new URLSearchParams(params);
    next.set("tab", v);
    setParams(next, { replace: true });
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start gap-4 animate-in">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Radar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Prospect</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Definisci il target, cerca i prospect su LinkedIn e gestisci lo storico delle ricerche.
            </p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={onTabChange}>
          <TabsList>
            <TabsTrigger value="target"><Target className="h-3.5 w-3.5 mr-1.5" />Target</TabsTrigger>
            <TabsTrigger value="cerca"><Search className="h-3.5 w-3.5 mr-1.5" />Cerca</TabsTrigger>
            <TabsTrigger value="storico"><HistoryIcon className="h-3.5 w-3.5 mr-1.5" />Storico</TabsTrigger>
          </TabsList>
          <TabsContent value="target" className="mt-6"><TargetSection /></TabsContent>
          <TabsContent value="cerca" className="mt-6"><SearchSection /></TabsContent>
          <TabsContent value="storico" className="mt-6"><HistorySection /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
