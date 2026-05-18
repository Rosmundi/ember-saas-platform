// src/pages/SkillPage.tsx — v3.7 Pezzo 2A: picker ICP + tab multi-mode + right rail ricerche
import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { SKILLS, canUseSkill } from "@/lib/ember-types";
import { callSkill, callRegenerateSection, emberErrorMessage } from "@/lib/ember-api";
import { useProfile } from "@/hooks/useProfile";
import { useSkillRuns } from "@/hooks/useSkillRuns";
import { useIcps } from "@/hooks/useIcps";
import {
  useRecentSearches,
  useSearchById,
  searchSourceLabel,
  searchSourceColor,
  searchSummary,
} from "@/hooks/useSearches";
// v3.8.1 (Tranche 1.5): hooks per content_assets + right rail componente
import {
  useContentAssets,
  useContentAssetById,
  autoTitleForAsset,
  type ContentAssetType,
} from "@/hooks/useContentAssets";
import { ContentRail } from "@/components/content/ContentRail";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkillIcon } from "@/components/SkillIcon";
import { ScoreBadge } from "@/components/ScoreBadge";
// v3.6.1: card prospect "rich" per il risultato di prospect-search-harvest.
import { ProspectCard, type Prospect as HarvestProspect } from "@/components/prospects/ProspectCard";
import {
  Copy,
  RefreshCw,
  Loader2,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Sparkles,
  AlertTriangle,
  Wand2,
  History as HistoryIcon,
  Target,
  ImagePlus,
  Layers,
  Flag,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// v3.7.10 — Regioni IT mappate alle stringhe accettate da harvestapi/linkedin-profile-search.
// LinkedIn standardizza in inglese le regioni italiane. Mappa Verona/Milano/etc. → "Lombardy, Italy" etc.
// ============================================================================
const REGIONI_IT: Array<{ value: string; label: string }> = [
  { value: "Italy",                          label: "Tutta Italia" },
  { value: "Lombardy, Italy",                label: "Lombardia" },
  { value: "Veneto, Italy",                  label: "Veneto" },
  { value: "Latium, Italy",                  label: "Lazio" },
  { value: "Piedmont, Italy",                label: "Piemonte" },
  { value: "Emilia-Romagna, Italy",          label: "Emilia-Romagna" },
  { value: "Tuscany, Italy",                 label: "Toscana" },
  { value: "Sicily, Italy",                  label: "Sicilia" },
  { value: "Campania, Italy",                label: "Campania" },
  { value: "Liguria, Italy",                 label: "Liguria" },
  { value: "Friuli-Venezia Giulia, Italy",   label: "Friuli-Venezia Giulia" },
  { value: "Marche, Italy",                  label: "Marche" },
  { value: "Trentino-Alto Adige, Italy",     label: "Trentino-Alto Adige" },
  { value: "Sardinia, Italy",                label: "Sardegna" },
  { value: "Calabria, Italy",                label: "Calabria" },
  { value: "Apulia, Italy",                  label: "Puglia" },
  { value: "Abruzzo, Italy",                 label: "Abruzzo" },
  { value: "Umbria, Italy",                  label: "Umbria" },
  { value: "Basilicata, Italy",              label: "Basilicata" },
  { value: "Molise, Italy",                  label: "Molise" },
  { value: "Aosta Valley, Italy",            label: "Valle d'Aosta" },
];

// ============ UTILITY COMPONENTS ============

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiato!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="hover:text-primary transition-colors">
      {copied ? <CheckCircle className="h-3 w-3 mr-1 text-success" /> : <Copy className="h-3 w-3 mr-1" />}
      {copied ? "Copiato" : "Copia"}
    </Button>
  );
}

function CharCounter({ text, limit }: { text: string; limit: number }) {
  const count = text.length;
  const pct = (count / limit) * 100;
  return (
    <span
      className={`text-xs tabular-nums ${count > limit ? "text-destructive" : pct > 80 ? "text-warning" : "text-muted-foreground"}`}
    >
      {count}/{limit}
    </span>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";
  if (score >= 60) return "text-amber-400 border-amber-400/30 bg-amber-400/10";
  if (score >= 40) return "text-orange-400 border-orange-400/30 bg-orange-400/10";
  return "text-destructive border-destructive/30 bg-destructive/10";
}

const STATO_LABELS: Record<string, string> = {
  ok: "OK",
  da_migliorare: "Da migliorare",
  critico: "Critico",
};

const STATO_COLORS: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-400",
  da_migliorare: "bg-amber-500/15 text-amber-400",
  critico: "bg-destructive/15 text-destructive",
};

// ============ BUILD PAYLOAD PER N8N ============

function buildPayload(
  skillId: string,
  values: Record<string, string>,
  businessProfile: Record<string, unknown> | null,
  userId: string,
): Record<string, unknown> {
  const bp = businessProfile || {};

  switch (skillId) {
    case "auto-profile-setup":
      return { user_id: userId, linkedin_url: values.url };
    case "profile-optimizer":
      // v3.8.4: audit completo del profilo LinkedIn.
      return {
        profilo_business: bp,
        raw_profile_data: (values.raw_profile_data_json && JSON.parse(values.raw_profile_data_json)) || {},
        obiettivo: values.obiettivo || "",
        brand_kit: (values.brand_kit_json && JSON.parse(values.brand_kit_json)) || { tone: "corporate" },
      };
    case "post-writer":
      // v3.8.0: brand_kit + tone override + ICP target opzionale
      return {
        profilo_business: bp,
        tema: values.brief,
        formato: (values.format || "storytelling").toLowerCase(),
        brand_kit: (values.brand_kit_json && JSON.parse(values.brand_kit_json)) || null,
        icp_target: (values.icp_target_json && JSON.parse(values.icp_target_json)) || null,
      };
    case "post-improver":
      // v3.8.0 (Tranche 1): post mediocre → versione migliorata + score before/after + diff.
      return {
        profilo_business: bp,
        post_originale: values.post_originale,
        brand_kit: (values.brand_kit_json && JSON.parse(values.brand_kit_json)) || null,
      };
    case "hook-generator":
      // v3.8.0 (Tranche 1): tema → 5 hook (curiosity, contrarian, data, story, question).
      return {
        profilo_business: bp,
        tema: values.tema,
        brand_kit: (values.brand_kit_json && JSON.parse(values.brand_kit_json)) || null,
      };
    case "visual-brief":
      // v3.8.2 (Tranche 2): post → 3 prompt AI-image + concept + palette + dimensioni.
      return {
        profilo_business: bp,
        post_text: values.post_text,
        formato: (values.formato || "single").toLowerCase(), // single | square | story | reel-cover
        brand_kit: (values.brand_kit_json && JSON.parse(values.brand_kit_json)) || null,
      };
    case "carousel-brief":
      // v3.8.2 (Tranche 2): tema (+ post opzionale) → storyboard N slide con copy slot + prompt AI per slide.
      return {
        profilo_business: bp,
        tema: values.tema,
        post_text: values.post_text || "",
        num_slide: Number(values.num_slide || 8),
        brand_kit: (values.brand_kit_json && JSON.parse(values.brand_kit_json)) || null,
      };
    case "profile-banner-brief":
      // v3.8.2 (Tranche 2): profilo_business + brand_kit → banner 1584×396 con concept + palette + 3 prompt.
      return {
        profilo_business: bp,
        obiettivo: values.obiettivo || "attrarre clienti B2B",
        brand_kit: (values.brand_kit_json && JSON.parse(values.brand_kit_json)) || null,
      };
    // v3.8.3: rimossi i case di visual-post-builder e content-performance (skill obsolete).
    case "icp-builder":
      return { profilo_business: bp, obiettivo_commerciale: values.description };
    case "prospect-finder":
      return { linkedin_url_target: values.url || "", icp: values.query ? { descrizione: values.query } : {} };
    case "outreach-drafter":
      return {
        target_context: { nome: values.nome, headline: values.headline, azienda: values.azienda, note: values.note },
        canale: "connection_request",
        tono: "consulenziale",
      };
    case "reply-suggester":
      return { conversazione: values.message, obiettivo: values.context || "qualificare" };
    case "network-intelligence":
      return { watchlist_ids: [], periodo_giorni: 14 };
    default:
      return values;
  }
}

// ============ SECTION CARD (auto-profile-setup) ============

function SectionCard({
  section,
  initialExpanded,
  onRegenerate,
  regenerating,
}: {
  section: any;
  initialExpanded: boolean;
  onRegenerate: (sectionName: string, feedback: string) => Promise<void>;
  regenerating: boolean;
}) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setExpanded(initialExpanded);
  }, [initialExpanded]);

  const canRegenerate = section.nome === "Headline" || section.nome === "About";

  return (
    <Card id={`section-${section.nome}`} className="bg-surface/50 border-border/30 scroll-mt-24">
      <CardContent className="p-0">
        {/* Header cliccabile */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-4 flex items-center justify-between gap-3 hover:bg-surface/70 transition-colors text-left"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 font-bold text-sm ${scoreColor(
                section.score ?? 0,
              )}`}
            >
              {section.score ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{section.nome}</span>
                {section.stato && (
                  <Badge className={`${STATO_COLORS[section.stato] || ""} text-[10px] border-0`}>
                    {STATO_LABELS[section.stato] || section.stato}
                  </Badge>
                )}
                <span className="text-[10px] text-muted-foreground">peso {section.peso}</span>
              </div>
              {!expanded && section.problema && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{section.problema}</p>
              )}
            </div>
          </div>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </button>

        {/* Body espandibile */}
        {expanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-border/20 pt-4 animate-in">
            {/* Prima / Dopo */}
            {(section.stato_attuale || section.riscrittura) && (
              <div className="grid md:grid-cols-2 gap-3">
                {section.stato_attuale && (
                  <div className="p-4 rounded-xl bg-background/40 border border-border/30">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                      Prima (il tuo profilo ora)
                    </p>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
                      {section.stato_attuale}
                    </p>
                  </div>
                )}
                {section.riscrittura && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] uppercase tracking-wider text-primary">Dopo (suggerito)</p>
                      <CopyButton text={section.riscrittura} />
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{section.riscrittura}</p>
                    {section.nome === "About" && (
                      <div className="mt-2 pt-2 border-t border-primary/10">
                        <CharCounter text={section.riscrittura} limit={2000} />
                      </div>
                    )}
                    {section.nome === "Headline" && (
                      <div className="mt-2 pt-2 border-t border-primary/10">
                        <CharCounter text={section.riscrittura} limit={220} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Problema */}
            {section.problema && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Il problema</p>
                <p className="text-sm leading-relaxed">{section.problema}</p>
              </div>
            )}

            {/* Azione */}
            {section.azione && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Cosa fare</p>
                <p className="text-sm leading-relaxed text-primary">→ {section.azione}</p>
              </div>
            )}

            {/* Guida operativa */}
            {section.guida && (
              <div className="p-3 rounded-xl bg-background/30 border border-border/20">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  Come modificarlo su LinkedIn
                </p>
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{section.guida}</p>
              </div>
            )}

            {/* Skills suggerite */}
            {section.skills_suggerite && section.skills_suggerite.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Skills suggerite</p>
                <div className="flex flex-wrap gap-1.5">
                  {section.skills_suggerite.map((s: string) => (
                    <Badge
                      key={s}
                      className="bg-primary/10 text-primary border-0 cursor-pointer hover:bg-primary/20"
                      onClick={() => {
                        navigator.clipboard.writeText(s);
                        toast.success("Copiato!");
                      }}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* ========= RIGENERA (solo Headline / About) ========= */}
            {canRegenerate && section.riscrittura && (
              <div className="pt-3 border-t border-border/20">
                {!showFeedback ? (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border/50 hover:border-primary/50 hover:text-primary"
                      disabled={regenerating}
                      onClick={() => onRegenerate(section.nome, "")}
                    >
                      {regenerating ? (
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                      ) : (
                        <Wand2 className="h-3 w-3 mr-1.5" />
                      )}
                      Rigenera
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground"
                      disabled={regenerating}
                      onClick={() => setShowFeedback(true)}
                    >
                      Rigenera con feedback
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 p-3 rounded-xl bg-background/30 border border-border/30">
                    <p className="text-[11px] text-muted-foreground">
                      Cosa vuoi cambiare? (es. "più diretto", "metti più numeri", "meno aziendale")
                    </p>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Lascia vuoto per una variazione libera"
                      className="bg-surface/50 border-border/50 text-sm"
                      rows={2}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowFeedback(false);
                          setFeedback("");
                        }}
                        disabled={regenerating}
                      >
                        Annulla
                      </Button>
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary-hover text-primary-foreground"
                        disabled={regenerating}
                        onClick={async () => {
                          await onRegenerate(section.nome, feedback);
                          setShowFeedback(false);
                          setFeedback("");
                        }}
                      >
                        {regenerating ? (
                          <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                        ) : (
                          <Wand2 className="h-3 w-3 mr-1.5" />
                        )}
                        Genera nuova versione
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============ AUTO-PROFILE-SETUP RENDERER ============

function AutoProfileSetupOutput({
  data,
  targetSection,
  onRegenerateSection,
  regeneratingSection,
}: {
  data: any;
  targetSection: string | null;
  onRegenerateSection: (sectionName: string, feedback: string) => Promise<void>;
  regeneratingSection: string | null;
}) {
  return (
    <div className="space-y-6 animate-in">
      {/* Header: nome + score + livello */}
      <div className="flex items-center gap-5 flex-wrap">
        <div
          className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center shrink-0 font-bold text-3xl ${scoreColor(
            data.score_totale || 0,
          )}`}
        >
          {data.score_totale || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Score profilo</p>
          <p className="text-xl font-bold">{data.livello || "—"}</p>
          {data.sintesi && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{data.sintesi}</p>}
        </div>
      </div>

      {/* Azioni prioritarie */}
      {data.azioni_prioritarie?.length > 0 && (
        <div className="p-5 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Top 3 azioni prioritarie</p>
          <div className="space-y-2.5">
            {data.azioni_prioritarie.slice(0, 3).map((a: string, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed pt-0.5">{a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sezioni espandibili */}
      {data.sezioni?.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">
            Analisi per sezione
          </h3>
          <div className="space-y-2">
            {data.sezioni.map((s: any) => (
              <SectionCard
                key={s.nome}
                section={s}
                initialExpanded={targetSection === s.nome}
                onRegenerate={onRegenerateSection}
                regenerating={regeneratingSection === s.nome}
              />
            ))}
          </div>
        </div>
      )}

      {/* Profilo business */}
      {data.profilo_business && (
        <Card className="bg-surface/40 border-border/30">
          <CardContent className="p-5">
            <h3 className="font-semibold mb-3 text-sm">Chi sei (secondo il profilo)</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {Object.entries(data.profilo_business).map(([k, v]) => (
                <div key={k} className="p-3 rounded-lg bg-background/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                    {k.replace(/_/g, " ")}
                  </p>
                  <p className="text-sm">{String(v)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Target buyer */}
      {data.target_buyer && (
        <Card className="bg-surface/40 border-border/30">
          <CardContent className="p-5">
            <h3 className="font-semibold mb-3 text-sm">Target buyer ideale</h3>
            <p className="text-sm mb-3">{data.target_buyer.descrizione}</p>
            {data.target_buyer.pain_points?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Pain points</p>
                <ul className="space-y-1">
                  {data.target_buyer.pain_points.map((p: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary shrink-0">—</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hook editoriali */}
      {data.hook_editoriali?.length > 0 && (
        <Card className="bg-surface/40 border-border/30">
          <CardContent className="p-5">
            <h3 className="font-semibold mb-3 text-sm">Hook editoriali da usare nei post</h3>
            <div className="space-y-2">
              {data.hook_editoriali.map((h: string, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-background/30 border border-border/20 text-sm">
                  {h}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============ FILTERS USED CARD (v3.7.7) ============
// Mappature per render leggibile dei filtri harvestapi (schema Apify 2026).
// RIMOSSI: SENIORITY_LABELS, HEADCOUNT_LABELS (parametri non più nello schema API).
const INDUSTRY_LABELS: Record<string, string> = {
  "4": "Software/SaaS", "11": "Consulenza", "14": "Healthcare",
  "15": "Pharma", "23": "Food & Beverages", "27": "Retail",
  "43": "Financial Services", "44": "Real Estate", "48": "Construction",
  "53": "Automotive", "54": "Metallurgia", "59": "Energy",
  "67": "Education", "80": "Marketing & Adv", "96": "Packaging",
  "116": "Logistics", "117": "Plastics & Rubber", "135": "Manufacturing",
  "147": "Industrial Automation",
};

function FiltersUsedCard({
  filters,
  mode,
  compact = false,
}: {
  filters: Record<string, unknown>;
  mode: string;
  compact?: boolean;
}) {
  const f = filters as any;
  const rows: Array<{ label: string; value: string }> = [];

  // searchQuery (per name-mode, free text)
  if (f.searchQuery && String(f.searchQuery).trim()) {
    rows.push({ label: "Ricerca libera", value: String(f.searchQuery) });
  }

  // currentJobTitles
  if (Array.isArray(f.currentJobTitles) && f.currentJobTitles.length) {
    rows.push({ label: "Ruoli", value: f.currentJobTitles.join(", ") });
  }

  // industryIds → label leggibili
  if (Array.isArray(f.industryIds) && f.industryIds.length) {
    const labels = f.industryIds.map((id: string) => INDUSTRY_LABELS[id] || id);
    rows.push({ label: "Settori", value: labels.join(", ") });
  }

  // currentCompanyLinkedinUrls → mostra solo lo slug per leggibilità
  if (Array.isArray(f.currentCompanyLinkedinUrls) && f.currentCompanyLinkedinUrls.length) {
    const slugs = f.currentCompanyLinkedinUrls.map((url: string) => {
      const m = String(url).match(/linkedin\.com\/(?:company|school)\/([^/?#]+)/i);
      return m ? m[1] : url;
    });
    rows.push({ label: "Aziende", value: slugs.join(", ") });
  }

  // locations
  if (Array.isArray(f.locations) && f.locations.length) {
    rows.push({ label: "Località", value: f.locations.join(", ") });
  }

  if (rows.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">Nessun filtro applicato (ricerca aperta)</p>
    );
  }

  return (
    <Card className={compact ? "bg-surface/30 border-border/30" : "bg-surface/50 border-border/30"}>
      <CardContent className={compact ? "p-3 space-y-1.5" : "p-4 space-y-2"}>
        {!compact && (
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
            Filtri usati nella ricerca
          </p>
        )}
        {rows.map((r, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="text-muted-foreground min-w-[80px]">{r.label}:</span>
            <span className="font-medium flex-1 break-words">{r.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============ SKILL OUTPUT DISPATCHER ============

function SkillOutput({
  skillId,
  output,
  targetSection,
  onRegenerateSection,
  regeneratingSection,
  currentAssetId,
}: {
  skillId: string;
  output: Record<string, unknown>;
  targetSection: string | null;
  onRegenerateSection: (sectionName: string, feedback: string) => Promise<void>;
  regeneratingSection: string | null;
  currentAssetId?: string | null;
}) {
  const data = output as any;

  if (skillId === "auto-profile-setup") {
    return (
      <AutoProfileSetupOutput
        data={data}
        targetSection={targetSection}
        onRegenerateSection={onRegenerateSection}
        regeneratingSection={regeneratingSection}
      />
    );
  }

  if (skillId === "post-writer") {
    // v3.8.0: rendering esteso con varianti A/B + tips + char count.
    const mainPost = data.post_text || "";
    const mainHook = data.hook || mainPost.split("\n")[0] || "";
    const variantA = data.variant_a || null;
    const variantB = data.variant_b || null;
    const tips: string[] = Array.isArray(data.tips) ? data.tips : [];
    const hashtags: string[] = Array.isArray(data.hashtags) ? data.hashtags : [];
    const charCount = data.char_count || mainPost.length;

    const VariantCard = ({
      label,
      hook,
      text,
      angle,
    }: {
      label: string;
      hook: string;
      text: string;
      angle?: string;
    }) => (
      <Card className="bg-surface/50 border-border/30">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Badge className="bg-primary/10 text-primary border-0">{label}</Badge>
            {angle && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {angle}
              </span>
            )}
          </div>
          <p className="text-sm font-bold border-l-2 border-primary pl-3 whitespace-pre-wrap">
            {hook}
          </p>
          <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
            {text}
          </p>
          <div className="flex justify-between items-center pt-2 border-t border-border/20">
            <CharCounter text={text} limit={1200} />
            <CopyButton text={text} />
          </div>
        </CardContent>
      </Card>
    );

    return (
      <div className="space-y-5 animate-in">
        {/* Versione principale */}
        <Card className="bg-card border-primary/30">
          <CardContent className="p-5 space-y-3">
            <Badge className="bg-primary text-primary-foreground border-0">Versione consigliata</Badge>
            <div className="border-l-4 border-primary bg-primary/5 p-4 rounded-r-xl">
              <p className="font-bold text-base whitespace-pre-wrap leading-relaxed">{mainHook}</p>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{mainPost}</p>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {hashtags.map((h: string) => (
                  <Badge key={h} variant="outline" className="border-border/50 text-[10px]">
                    {h.startsWith("#") ? h : `#${h}`}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-border/20 flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">
                {charCount} caratteri
                {data.estimated_read_time_sec && <> · Tempo lettura ~{data.estimated_read_time_sec}s</>}
              </span>
              <div className="flex gap-2 flex-wrap">
                <CopyButton text={mainPost} />
                {currentAssetId && (
                  <>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-border/50 hover:border-primary/50 hover:text-primary"
                    >
                      <Link to={`/skill/post-improver?fromAssetId=${currentAssetId}`}>
                        <Wand2 className="h-3 w-3 mr-1" />
                        Migliora questo post
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-border/50 hover:border-primary/50 hover:text-primary"
                    >
                      <Link to={`/skill/hook-generator?fromAssetId=${currentAssetId}`}>
                        <Sparkles className="h-3 w-3 mr-1" />
                        Genera 5 hook
                      </Link>
                    </Button>
                  </>
                )}
                {currentAssetId && (
                  <>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-border/50 hover:border-primary/50 hover:text-primary"
                    >
                      <Link to={`/skill/visual-brief?fromAssetId=${currentAssetId}`}>
                        <ImagePlus className="h-3 w-3 mr-1" />
                        Brief visual
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-border/50 hover:border-primary/50 hover:text-primary"
                    >
                      <Link to={`/skill/visual-brief?tab=carousel&fromAssetId=${currentAssetId}`}>
                        <Layers className="h-3 w-3 mr-1" />
                        Brief carosello
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Varianti A/B */}
        {(variantA || variantB) && (
          <div>
            <h3 className="font-semibold text-sm mb-3">Varianti per A/B test</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {variantA && (
                <VariantCard
                  label="Variante A"
                  hook={variantA.hook || ""}
                  text={variantA.post_text || ""}
                  angle={variantA.angle}
                />
              )}
              {variantB && (
                <VariantCard
                  label="Variante B"
                  hook={variantB.hook || ""}
                  text={variantB.post_text || ""}
                  angle={variantB.angle}
                />
              )}
            </div>
          </div>
        )}

        {/* Tips operativi */}
        {tips.length > 0 && (
          <Card className="bg-warning/5 border-warning/30">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-warning">
                Tips per amplificare la performance
              </p>
              <ul className="space-y-1.5">
                {tips.slice(0, 3).map((t, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-warning shrink-0">→</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* CTA bottom: rigenera hook (link a hook-generator pre-popolato dall'asset) */}
        {currentAssetId && (
          <div className="pt-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary"
            >
              <Link to={`/skill/hook-generator?fromAssetId=${currentAssetId}`}>
                Non convince l'hook? Genera 5 alternative <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ============ POST-IMPROVER (v3.8.0 Tranche 1) ============
  if (skillId === "post-improver") {
    const improved: string = data.post_improved || "";
    const before = (data.score_before || {}) as Record<string, number>;
    const after = (data.score_after || {}) as Record<string, number>;
    const changes: Array<{ what?: string; why?: string }> = Array.isArray(data.changes) ? data.changes : [];

    const SCORE_LABELS: Record<string, string> = {
      hook: "Hook",
      structure: "Struttura",
      length: "Lunghezza",
      cta: "CTA",
      humanness: "Naturalezza",
    };

    const ScoreRow = ({ k }: { k: string }) => {
      const b = Number(before[k] ?? 0);
      const a = Number(after[k] ?? 0);
      const delta = a - b;
      return (
        <div className="flex items-center gap-3 text-xs">
          <span className="w-24 text-muted-foreground">{SCORE_LABELS[k] || k}</span>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-muted-foreground tabular-nums w-8 text-right">{b}</span>
            <div className="flex-1 h-1.5 bg-surface rounded-full relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-muted-foreground/40"
                style={{ width: `${b}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-primary"
                style={{ width: `${a}%` }}
              />
            </div>
            <span className="font-semibold tabular-nums w-8 text-right">{a}</span>
            {delta !== 0 && (
              <span
                className={`text-[10px] font-semibold ${
                  delta > 0 ? "text-emerald-400" : "text-destructive"
                }`}
              >
                {delta > 0 ? "+" : ""}
                {delta}
              </span>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-5 animate-in">
        <Card className="bg-card border-primary/30">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Badge className="bg-primary text-primary-foreground border-0">Versione migliorata</Badge>
              <span className="text-xs text-muted-foreground">{improved.length} caratteri</span>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{improved}</p>
            <div className="flex justify-end pt-2 border-t border-border/20">
              <CopyButton text={improved} />
            </div>
          </CardContent>
        </Card>

        {Object.keys(after).length > 0 && (
          <Card className="bg-surface/50 border-border/30">
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold text-sm">Score before → after</h3>
              <div className="space-y-2">
                {["hook", "structure", "length", "cta", "humanness"]
                  .filter((k) => k in after || k in before)
                  .map((k) => (
                    <ScoreRow key={k} k={k} />
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {changes.length > 0 && (
          <Card className="bg-surface/30 border-border/30">
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold text-sm">Cosa è cambiato</h3>
              <ul className="space-y-3">
                {changes.map((c, i) => (
                  <li key={i} className="text-sm border-l-2 border-primary/40 pl-3">
                    <p className="font-medium">{c.what}</p>
                    {c.why && <p className="text-xs text-muted-foreground mt-0.5">{c.why}</p>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* CTA chain dal post migliorato */}
        {currentAssetId && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border/30">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-border/50 hover:border-primary/50 hover:text-primary"
            >
              <Link to={`/skill/post-improver?fromAssetId=${currentAssetId}`}>
                <Wand2 className="h-3 w-3 mr-1" />
                Migliora ancora
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-border/50 hover:border-primary/50 hover:text-primary"
            >
              <Link to={`/skill/hook-generator?fromAssetId=${currentAssetId}`}>
                <Sparkles className="h-3 w-3 mr-1" />
                Genera 5 hook
              </Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ============ HOOK-GENERATOR (v3.8.0 Tranche 1) ============
  if (skillId === "hook-generator") {
    const hooks: Array<{ angle: string; text: string }> = Array.isArray(data.hooks) ? data.hooks : [];
    const ANGLE_LABELS: Record<string, string> = {
      curiosity: "Curiosity gap",
      contrarian: "Contrarian",
      data: "Data-driven",
      story: "Story",
      question: "Domanda",
    };
    const ANGLE_COLORS: Record<string, string> = {
      curiosity: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      contrarian: "bg-destructive/15 text-destructive border-destructive/30",
      data: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      story: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      question: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    };

    return (
      <div className="space-y-3 animate-in">
        <p className="text-sm text-muted-foreground">
          5 hook con angoli diversi. Copia quello che ti convince e usalo come prima riga del post.
        </p>
        {hooks.map((h, i) => (
          <Card key={i} className="bg-surface/50 border-border/30 hover:border-border transition-all">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] border ${ANGLE_COLORS[h.angle] || "border-border/50"}`}
                >
                  {ANGLE_LABELS[h.angle] || h.angle}
                </Badge>
                <CharCounter text={h.text || ""} limit={120} />
              </div>
              <p className="text-base font-medium leading-relaxed">{h.text}</p>
              <div className="flex justify-end pt-1">
                <CopyButton text={h.text} />
              </div>
            </CardContent>
          </Card>
        ))}
        {hooks.length > 0 && (
          <div className="pt-3 border-t border-border/30">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-border/50 hover:border-primary/50 hover:text-primary"
            >
              <Link
                to={
                  currentAssetId
                    ? `/skill/post-writer?fromAssetId=${currentAssetId}`
                    : "/skill/post-writer"
                }
              >
                Scrivi un post con uno di questi hook <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  // v3.8.2/v3.8.3 (Tranche 2.1): renderer unificato per visual-brief.
  // skillId può essere "visual-brief" (output single) o "carousel-brief" (output carosello,
  // dispatch dal tab Carosello). Il branch carosello è subito sotto e gestisce data.slides.
  if (skillId === "visual-brief" && !Array.isArray(data.slides)) {
    const prompts = data.prompts || {};
    const palette: string[] = Array.isArray(data.palette) ? data.palette : [];
    const dims = data.dimensions || {};
    const styleKw: string[] = Array.isArray(data.style_keywords) ? data.style_keywords : [];
    const dos: string[] = Array.isArray(data.do_dont?.do) ? data.do_dont.do : [];
    const donts: string[] = Array.isArray(data.do_dont?.dont) ? data.do_dont.dont : [];
    const PromptRow = ({ tool, text }: { tool: string; text: string }) => (
      <Card className="bg-surface/50 border-border/30">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Badge className="bg-primary/10 text-primary border-0 uppercase tracking-wider text-[10px]">
              {tool}
            </Badge>
            <CopyButton text={text} />
          </div>
          <p className="text-sm font-mono whitespace-pre-wrap leading-relaxed">{text}</p>
        </CardContent>
      </Card>
    );
    return (
      <div className="space-y-5 animate-in">
        {/* Concept + mood */}
        {(data.concept || data.mood) && (
          <Card className="bg-card border-primary/30">
            <CardContent className="p-5 space-y-2">
              <Badge className="bg-primary text-primary-foreground border-0">Concept</Badge>
              {data.concept && <p className="text-base font-medium leading-relaxed">{data.concept}</p>}
              {data.mood && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Mood:</span> {data.mood}
                </p>
              )}
              {styleKw.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {styleKw.map((k) => (
                    <Badge key={k} variant="outline" className="border-border/50 text-[10px]">
                      {k}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dimensions + palette */}
        <div className="grid sm:grid-cols-2 gap-3">
          {dims.width && (
            <Card className="bg-surface/50 border-border/30">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Dimensioni</p>
                <p className="text-sm font-medium">
                  {dims.width}×{dims.height} {dims.ratio && <span className="text-muted-foreground">· {dims.ratio}</span>}
                </p>
                {dims.label && <p className="text-xs text-muted-foreground mt-1">{dims.label}</p>}
              </CardContent>
            </Card>
          )}
          {palette.length > 0 && (
            <Card className="bg-surface/50 border-border/30">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Palette</p>
                <div className="flex flex-wrap gap-2">
                  {palette.map((c) => (
                    <div key={c} className="flex items-center gap-1.5">
                      <div
                        className="w-7 h-7 rounded-md shadow-inner border border-border/30"
                        style={{ background: c }}
                      />
                      <span className="text-[11px] font-mono text-muted-foreground">{c}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 3 prompt copia-incolla */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Prompt pronti per i generatori AI</h3>
          <div className="space-y-3">
            {prompts.midjourney && <PromptRow tool="Midjourney" text={prompts.midjourney} />}
            {prompts.flux_or_ideogram && <PromptRow tool="Flux / Ideogram" text={prompts.flux_or_ideogram} />}
            {prompts.dalle_or_gpt_image && <PromptRow tool="DALL·E / gpt-image-1" text={prompts.dalle_or_gpt_image} />}
          </div>
        </div>

        {/* Do / Don't */}
        {(dos.length > 0 || donts.length > 0) && (
          <div className="grid sm:grid-cols-2 gap-3">
            {dos.length > 0 && (
              <Card className="bg-emerald-500/5 border-emerald-500/20">
                <CardContent className="p-4">
                  <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-2">Do</p>
                  <ul className="space-y-1">
                    {dos.map((d, i) => (
                      <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                        · {d}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {donts.length > 0 && (
              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="p-4">
                  <p className="text-xs text-destructive font-semibold uppercase tracking-wider mb-2">Don't</p>
                  <ul className="space-y-1">
                    {donts.map((d, i) => (
                      <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                        · {d}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Canva fallback */}
        {data.fallback_canva_recipe && (
          <Card className="bg-surface/30 border-border/30">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                Senza AI? Apri Canva
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{data.fallback_canva_recipe}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // v3.8.2/v3.8.3 (Tranche 2.1): renderer carosello. Triggera quando:
  //   - skillId === "carousel-brief" (output fresh, dispatch dalla tab Carosello)
  //   - skillId === "visual-brief" ma l'asset salvato ha data.slides (apertura assetId di un carousel_brief)
  if (skillId === "carousel-brief" || (skillId === "visual-brief" && Array.isArray(data.slides))) {
    const cover = data.cover || null;
    const slides: any[] = Array.isArray(data.slides) ? data.slides : [];
    const cta = data.cta_slide || null;
    const tips: string[] = Array.isArray(data.design_tips) ? data.design_tips : [];
    const SlideCard = ({ n, headline, body, copy_slot, visual_hint, ai_prompt, kind }: any) => (
      <Card
        className={`${
          kind === "cover"
            ? "bg-primary/5 border-primary/30"
            : kind === "cta"
              ? "bg-amber-500/5 border-amber-500/30"
              : "bg-surface/50 border-border/30"
        }`}
      >
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Badge
              className={
                kind === "cover"
                  ? "bg-primary text-primary-foreground border-0"
                  : kind === "cta"
                    ? "bg-amber-500 text-amber-50 border-0"
                    : "bg-muted text-muted-foreground border-0"
              }
            >
              {kind === "cover" ? "Cover" : kind === "cta" ? "CTA" : `Slide ${n}`}
            </Badge>
            {visual_hint && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{visual_hint}</span>
            )}
          </div>
          {headline && <p className="text-sm font-bold leading-snug">{headline}</p>}
          {body && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{body}</p>}
          {copy_slot && (
            <div className="border-l-2 border-primary/40 bg-background/40 p-2 rounded-r">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Copy da incollare</p>
              <p className="text-xs font-medium whitespace-pre-wrap">{copy_slot}</p>
            </div>
          )}
          {ai_prompt && (
            <div className="bg-background/40 border border-border/30 rounded p-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">AI prompt sfondo</p>
                <CopyButton text={ai_prompt} />
              </div>
              <p className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">{ai_prompt}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
    return (
      <div className="space-y-5 animate-in">
        {data.title && (
          <Card className="bg-card border-primary/30">
            <CardContent className="p-5">
              <Badge className="bg-primary text-primary-foreground border-0 mb-2">Carosello</Badge>
              <p className="text-base font-semibold leading-relaxed">{data.title}</p>
              {data.summary && <p className="text-sm text-muted-foreground mt-1">{data.summary}</p>}
            </CardContent>
          </Card>
        )}
        <div className="space-y-3">
          {cover && (
            <SlideCard
              kind="cover"
              headline={cover.title || cover.headline}
              body={cover.subtitle || cover.body}
              copy_slot={cover.copy_slot}
              visual_hint={cover.visual_hint}
              ai_prompt={cover.ai_prompt}
            />
          )}
          {slides.map((s, i) => (
            <SlideCard
              key={i}
              kind="body"
              n={s.n ?? i + 2}
              headline={s.headline || s.title}
              body={s.body}
              copy_slot={s.copy_slot}
              visual_hint={s.visual_hint}
              ai_prompt={s.ai_prompt}
            />
          ))}
          {cta && (
            <SlideCard
              kind="cta"
              headline={cta.headline || cta.title}
              body={cta.body || cta.cta_text}
              copy_slot={cta.copy_slot || cta.cta_text}
              visual_hint={cta.visual_hint}
              ai_prompt={cta.ai_prompt}
            />
          )}
        </div>
        {tips.length > 0 && (
          <Card className="bg-surface/30 border-border/30">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Design tips</p>
              <ul className="space-y-1">
                {tips.map((t, i) => (
                  <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                    · {t}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // v3.8.2 (Tranche 2): profile-banner-brief renderer
  if (skillId === "profile-banner-brief") {
    const prompts = data.prompts || {};
    const palette: string[] = Array.isArray(data.palette) ? data.palette : [];
    const dims = data.dimensions || { width: 1584, height: 396, ratio: "4:1", label: "Banner LinkedIn" };
    const PromptRow = ({ tool, text }: { tool: string; text: string }) => (
      <Card className="bg-surface/50 border-border/30">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Badge className="bg-primary/10 text-primary border-0 uppercase tracking-wider text-[10px]">
              {tool}
            </Badge>
            <CopyButton text={text} />
          </div>
          <p className="text-sm font-mono whitespace-pre-wrap leading-relaxed">{text}</p>
        </CardContent>
      </Card>
    );
    return (
      <div className="space-y-5 animate-in">
        {/* Concept */}
        {(data.concept || data.mood) && (
          <Card className="bg-card border-primary/30">
            <CardContent className="p-5 space-y-2">
              <Badge className="bg-primary text-primary-foreground border-0">Concept banner</Badge>
              {data.concept && <p className="text-base font-medium leading-relaxed">{data.concept}</p>}
              {data.mood && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Mood:</span> {data.mood}
                </p>
              )}
              {(data.headline_text || data.subline_text) && (
                <div className="border-l-2 border-primary/40 bg-background/40 p-3 rounded-r mt-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    Testo sovrimpresso suggerito
                  </p>
                  {data.headline_text && (
                    <p className="text-sm font-bold leading-snug">{data.headline_text}</p>
                  )}
                  {data.subline_text && (
                    <p className="text-xs text-muted-foreground mt-0.5">{data.subline_text}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dimensions + palette + safe zone */}
        <div className="grid sm:grid-cols-2 gap-3">
          <Card className="bg-surface/50 border-border/30">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Dimensioni</p>
              <p className="text-sm font-medium">
                {dims.width}×{dims.height} {dims.ratio && <span className="text-muted-foreground">· {dims.ratio}</span>}
              </p>
              {dims.label && <p className="text-xs text-muted-foreground mt-1">{dims.label}</p>}
            </CardContent>
          </Card>
          {palette.length > 0 && (
            <Card className="bg-surface/50 border-border/30">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Palette</p>
                <div className="flex flex-wrap gap-2">
                  {palette.map((c) => (
                    <div key={c} className="flex items-center gap-1.5">
                      <div
                        className="w-7 h-7 rounded-md shadow-inner border border-border/30"
                        style={{ background: c }}
                      />
                      <span className="text-[11px] font-mono text-muted-foreground">{c}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        {data.safe_zone_note && (
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">Attenzione: safe zone</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{data.safe_zone_note}</p>
            </CardContent>
          </Card>
        )}

        {/* Prompts */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Prompt pronti per i generatori AI</h3>
          <div className="space-y-3">
            {prompts.midjourney && <PromptRow tool="Midjourney" text={prompts.midjourney} />}
            {prompts.flux_or_ideogram && <PromptRow tool="Flux / Ideogram" text={prompts.flux_or_ideogram} />}
            {prompts.dalle_or_gpt_image && <PromptRow tool="DALL·E / gpt-image-1" text={prompts.dalle_or_gpt_image} />}
          </div>
        </div>

        {/* Canva fallback */}
        {data.fallback_canva_recipe && (
          <Card className="bg-surface/30 border-border/30">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                Senza AI? Apri Canva
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{data.fallback_canva_recipe}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // v3.8.3: rimossi i renderer di visual-post-builder e content-performance (skill obsolete).

  if (skillId === "icp-builder") {
    // v3.4.2 fix (P3): renderer tipizzato per gestire strutture nested (oggetti, array di oggetti).
    const renderValue = (v: unknown): React.ReactNode => {
      if (v == null) return <span className="text-muted-foreground">—</span>;
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        return <span className="font-medium text-sm">{String(v)}</span>;
      }
      if (Array.isArray(v)) {
        if (v.length === 0) return <span className="text-muted-foreground">—</span>;
        // v3.4.2 fix: array di primitive → bullet list (era join(', '))
        if (v.every((x) => typeof x === "string" || typeof x === "number")) {
          return (
            <ul className="list-disc list-outside ml-4 space-y-0.5 text-sm font-medium">
              {v.map((x, i) => (
                <li key={i}>{String(x)}</li>
              ))}
            </ul>
          );
        }
        return (
          <ul className="space-y-2">
            {v.map((x, i) => (
              <li key={i} className="text-sm font-medium border-l-2 border-primary/30 pl-2">
                {typeof x === "object" && x !== null
                  ? Object.entries(x).map(([kk, vv]) => (
                      <div key={kk}>
                        <span className="text-muted-foreground text-xs capitalize">{kk.replace(/_/g, " ")}: </span>
                        {typeof vv === "string" ? vv : Array.isArray(vv) ? vv.join(", ") : JSON.stringify(vv)}
                      </div>
                    ))
                  : String(x)}
              </li>
            ))}
          </ul>
        );
      }
      if (typeof v === "object") {
        return (
          <div className="space-y-0.5">
            {Object.entries(v as Record<string, unknown>).map(([kk, vv]) => (
              <div key={kk} className="text-sm">
                <span className="text-muted-foreground text-xs capitalize">{kk.replace(/_/g, " ")}: </span>
                <span className="font-medium">
                  {Array.isArray(vv) ? vv.join(", ") : typeof vv === "object" ? JSON.stringify(vv) : String(vv)}
                </span>
              </div>
            ))}
          </div>
        );
      }
      return <span>{String(v)}</span>;
    };

    const renderPersona = (bp: Record<string, unknown>, i: number) => (
      <Card key={i} className="bg-surface/50 border-border/30">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h4 className="font-semibold text-base">{String(bp.nome ?? `Persona ${i + 1}`)}</h4>
            {bp.ruolo != null && <span className="text-xs text-primary/70">{String(bp.ruolo)}</span>}
            {(bp.età != null || bp.eta != null) && (
              <span className="text-xs text-muted-foreground">· {String(bp.età ?? bp.eta)}</span>
            )}
          </div>
          {bp.background != null && (
            <p className="text-sm text-muted-foreground leading-relaxed">{String(bp.background)}</p>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(bp).map(([k, v]) => {
              if (["nome", "ruolo", "età", "eta", "background"].includes(k)) return null;
              return (
                <div key={k} className="p-2 rounded-lg bg-background/30">
                  <span className="text-muted-foreground capitalize text-xs block mb-1">{k.replace(/_/g, " ")}</span>
                  {renderValue(v)}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );

    const searchQueries: string[] = Array.isArray(data.linkedin_search_query)
      ? (data.linkedin_search_query as unknown[]).filter((x): x is string => typeof x === "string")
      : typeof data.linkedin_search_query === "string"
        ? [data.linkedin_search_query]
        : [];

    return (
      <div className="space-y-5 animate-in">
        {data.icp && (
          <Card className="bg-surface/50 border-border/30">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4">ICP Card</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {Object.entries(data.icp).map(([k, v]) => (
                  <div key={k} className="p-3 rounded-lg bg-background/30">
                    <span className="text-muted-foreground capitalize text-xs block mb-1">{k.replace(/_/g, " ")}</span>
                    {renderValue(v)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {searchQueries.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Sales Navigator Query</h3>
            <div className="space-y-2">
              {searchQueries.map((q, i) => (
                <div
                  key={i}
                  className="bg-surface/50 border border-border/30 rounded-xl p-4 font-mono text-xs flex items-start justify-between gap-3"
                >
                  <span className="flex-1 break-all">{q}</span>
                  <CopyButton text={q} />
                </div>
              ))}
            </div>
          </div>
        )}
        {Array.isArray(data.buyer_personas) && data.buyer_personas.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Buyer Personas</h3>
            <div className="space-y-3">
              {(data.buyer_personas as Record<string, unknown>[]).map((bp, i) => renderPersona(bp, i))}
            </div>
          </div>
        )}
        {/* v3.4.2 fix B: niente query string. L'ICP è già in DB (raw_profile_data.icp_current)
            e in localStorage come fallback. Il form prospect-finder legge da DB e precompila.
            v3.4.4 fix: usiamo <Button asChild><Link> per evitare <button> dentro <a> (HTML invalido
            che causava click "mangiato" e navigation fallita in alcuni browser). */}
        <Button
          asChild
          className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/20"
        >
          <Link to="/skill/prospect-finder">
            Cerca prospect con questo ICP <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  // v3.6.1: render dedicato a prospect-search-harvest (lista 25 prospects da Apify harvestapi).
  // Schema item: { id?, linkedin_url, short_data: {firstName, lastName, headline, location, about, profilePicture, ...} }
  // Diverso da prospect-finder che usa { nome, headline, fit_score, connection_request, ... }.
  if (skillId === "prospect-search-harvest") {
    const prospects = (data.prospects || []) as HarvestProspect[];
    const countSaved =
      (data.count_saved as number | undefined) ?? (data.count as number | undefined) ?? prospects.length;
    const remainingToday = ((data as any).quota_consumed?.remaining_today ?? null) as number | null;
    const fromHistory = (data as any)._from_history === true;
    const searchMode = (data as any).search_mode as string | undefined;
    const filtersUsed = (data as any).filters_used as Record<string, unknown> | undefined;
    const hint = (data as any).hint as string | null | undefined;

    // Empty state con hint contestuale + filtri usati per debug
    if (!prospects.length) {
      return (
        <div className="space-y-4 animate-in">
          {fromHistory && (
            <div className="flex items-center justify-between gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
              <div className="flex items-center gap-2 text-sm">
                <HistoryIcon className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Stai vedendo una ricerca passata. Nessuna quota consumata.</span>
              </div>
              <Button asChild size="sm" variant="outline" className="border-border/50">
                <Link to="/skill/prospect-finder">Nuova ricerca</Link>
              </Button>
            </div>
          )}
          <div className="p-5 rounded-xl bg-warning/5 border border-warning/30 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-sm">Nessun prospect trovato</p>
                <p className="text-sm text-muted-foreground">
                  {hint || "I filtri sono troppo stretti. Prova ad allargarli."}
                </p>
                {!fromHistory && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ✓ Nessuna quota consumata. Puoi riprovare con filtri diversi.
                  </p>
                )}
              </div>
            </div>
          </div>
          {filtersUsed && Object.keys(filtersUsed).length > 0 && (
            <FiltersUsedCard filters={filtersUsed} mode={searchMode || "icp"} />
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-in">
        {fromHistory && (
          <div className="flex items-center justify-between gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
            <div className="flex items-center gap-2 text-sm">
              <HistoryIcon className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Stai vedendo una ricerca passata. Nessuna quota consumata.</span>
            </div>
            <Button asChild size="sm" variant="outline" className="border-border/50">
              <Link to="/skill/prospect-finder">Nuova ricerca</Link>
            </Button>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-muted-foreground">
            Trovati <span className="text-foreground font-medium">{countSaved}</span> prospect.
            {remainingToday != null && <> · {remainingToday} search rimaste oggi.</>}
          </div>
          {filtersUsed && Object.keys(filtersUsed).length > 0 && (
            <details className="text-xs text-muted-foreground cursor-pointer">
              <summary className="hover:text-primary transition-colors">Vedi filtri usati</summary>
              <div className="mt-2">
                <FiltersUsedCard filters={filtersUsed} mode={searchMode || "icp"} compact />
              </div>
            </details>
          )}
        </div>
        <div className="grid gap-3">
          {prospects.map((p, i) => (
            <ProspectCard key={p.id || p.linkedin_url || i} prospect={p} />
          ))}
        </div>
      </div>
    );
  }

  if (skillId === "prospect-finder") {
    const prospects = data.prospects || (data.fit_score != null ? [data] : []);
    return (
      <div className="space-y-3 animate-in">
        {prospects.map((p: any, i: number) => (
          <Card key={i} className="bg-surface/50 border-border/30 hover:border-border transition-all group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-sm">{p.nome || "Prospect"}</h3>
                    {p.fit_score != null && <ScoreBadge score={p.fit_score} size="sm" />}
                  </div>
                  {p.headline && <p className="text-xs text-muted-foreground mt-0.5">{p.headline}</p>}
                  {(p.reason || p.fit_rationale) && (
                    <p className="text-xs text-primary/70 mt-1">{p.reason || p.fit_rationale}</p>
                  )}
                </div>
              </div>
              {(p.connection_request || p.opening_hook) && (
                <div className="mt-4 bg-background/30 rounded-xl p-4 border border-border/20">
                  <p className="text-sm leading-relaxed">{p.connection_request || p.opening_hook}</p>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/10">
                    <CharCounter text={p.connection_request || p.opening_hook || ""} limit={300} />
                    <div className="flex gap-1">
                      <CopyButton text={p.connection_request || p.opening_hook || ""} />
                      <Link
                        to={`/skill/outreach-drafter?nome=${encodeURIComponent(p.nome || "")}&headline=${encodeURIComponent(p.headline || "")}&azienda=${encodeURIComponent(p.azienda || "")}`}
                      >
                        <Button variant="ghost" size="sm" className="hover:text-primary">
                          Outreach completo <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (skillId === "outreach-drafter") {
    const sections = [
      { title: "Messaggio principale", items: [data.messaggio_principale].filter(Boolean), limit: 300 },
      { title: "Varianti", items: [data.variante_A, data.variante_B].filter(Boolean), limit: 300 },
      { title: "Follow-up", items: [data.follow_up_7gg, data.follow_up_14gg].filter(Boolean), limit: 0 },
    ];
    if (data.connection_requests) {
      return (
        <div className="space-y-6 animate-in">
          {[
            { title: "Connection Request", items: data.connection_requests, limit: 300 },
            { title: "Primo Messaggio", items: data.first_messages, limit: 500 },
            { title: "Follow-up", items: data.followups, limit: 0 },
          ].map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-3">{section.title}</h3>
              <div className="space-y-2">
                {section.items?.map((item: any) => (
                  <Card key={item.variant || item.timing} className="bg-surface/50 border-border/30">
                    <CardContent className="p-4">
                      <Badge variant="outline" className="mb-3 border-border/50 text-[10px]">
                        {item.variant || item.timing}
                      </Badge>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.text}</p>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/10">
                        {section.limit > 0 ? <CharCounter text={item.text} limit={section.limit} /> : <span />}
                        <CopyButton text={item.text} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-5 animate-in">
        {sections.map(
          (section) =>
            section.items.length > 0 && (
              <div key={section.title}>
                <h3 className="font-semibold mb-3">{section.title}</h3>
                {section.items.map((text: string, i: number) => (
                  <Card key={i} className="bg-surface/50 border-border/30 mb-2">
                    <CardContent className="p-4">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/10">
                        {section.limit > 0 ? <CharCounter text={text} limit={section.limit} /> : <span />}
                        <CopyButton text={text} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ),
        )}
      </div>
    );
  }

  if (skillId === "reply-suggester") {
    const classification = data.classification || { stato: data.stato_conversazione, intent: data.intent_rilevato };
    const replies = data.replies || data.reply_options || [];
    return (
      <div className="space-y-5 animate-in">
        <div className="flex flex-wrap gap-2">
          {Object.entries(classification)
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <Badge key={k} className="bg-primary/10 text-primary border-0">
                {k}: {String(v)}
              </Badge>
            ))}
        </div>
        <div className="space-y-3">
          {replies.map((r: any, i: number) => (
            <Card key={i} className="bg-surface/50 border-border/30 hover:border-border transition-all">
              <CardContent className="p-5">
                <Badge className="mb-3 bg-primary/10 text-primary border-0">
                  {r.approach || r.angolo || `Opzione ${i + 1}`}
                </Badge>
                <p className="text-sm leading-relaxed">{r.text || r.testo}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/10">
                  <p className="text-xs text-primary/70">{r.next_step ? `Next step: ${r.next_step}` : ""}</p>
                  <CopyButton text={r.text || r.testo || ""} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {data.next_best_action && (
          <p className="text-sm text-muted-foreground bg-surface/50 p-4 rounded-xl border border-border/30">
            💡 {data.next_best_action}
          </p>
        )}
      </div>
    );
  }

  if (skillId === "network-intelligence") {
    const signals = data.signals || data.segnali_da_monitorare || [];
    return (
      <div className="space-y-4 animate-in">
        {data.last_check && (
          <p className="text-sm text-muted-foreground">
            Ultimo check: {new Date(data.last_check).toLocaleDateString("it-IT")}
          </p>
        )}
        {signals.map((s: any, i: number) => (
          <Card key={i} className="bg-surface/50 border-border/30 hover:border-border transition-all">
            <CardContent className="p-5">
              {s.nome && <span className="font-medium text-sm mr-2">{s.nome}</span>}
              {s.type && <Badge className="bg-primary/15 text-primary">{s.type.replace("_", " ")}</Badge>}
              <p className="text-sm text-muted-foreground mt-2">
                {s.detail || s.descrizione || (typeof s === "string" ? s : JSON.stringify(s))}
              </p>
              {s.message && (
                <div className="bg-background/30 rounded-xl p-4 border border-border/20 mt-3">
                  <p className="text-sm">{s.message}</p>
                  <div className="mt-2">
                    <CopyButton text={s.message} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {data.next_actions_per_segnale && (
          <div>
            <h3 className="font-semibold text-sm mb-2">Azioni suggerite</h3>
            {data.next_actions_per_segnale.map((a: any, i: number) => (
              <p key={i} className="text-sm text-muted-foreground mb-1">
                → {typeof a === "string" ? a : JSON.stringify(a)}
              </p>
            ))}
          </div>
        )}
        <Link to="/watchlist">
          <Button
            variant="outline"
            className="border-border/50 hover:border-primary/50 hover:text-primary transition-all"
          >
            Gestisci watchlist
          </Button>
        </Link>
      </div>
    );
  }

  // Fallback generico
  return (
    <div className="space-y-3 animate-in">
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className="p-3 bg-surface/50 rounded-xl border border-border/30">
          <span className="text-xs text-muted-foreground capitalize block mb-0.5">{k.replace(/_/g, " ")}</span>
          <span className="text-sm font-medium">{typeof v === "string" ? v : JSON.stringify(v, null, 2)}</span>
        </div>
      ))}
    </div>
  );
}

// ============ SKILL FORM ============

// v3.4.2 fix (P4): helper per serializzare un oggetto ICP in testo leggibile per la textarea prospect-finder.
// Appiattisce campi noti (settore, dimensione_azienda, ruolo_decisore, pain_points, trigger_events).
function formatIcpForTextarea(icp: any): string {
  if (!icp || typeof icp !== "object") return typeof icp === "string" ? icp : "";
  const out: string[] = [];
  const flat = (v: any): string => {
    if (v == null) return "";
    if (typeof v === "string" || typeof v === "number") return String(v);
    if (Array.isArray(v)) {
      if (v.every((x) => typeof x === "string" || typeof x === "number")) return v.join(", ");
      return v
        .map((x) => (typeof x === "object" ? x.descrizione || x.nome || JSON.stringify(x) : String(x)))
        .join("; ");
    }
    if (typeof v === "object")
      return Object.entries(v)
        .map(([k, vv]) => `${k}: ${flat(vv)}`)
        .join(", ");
    return String(v);
  };
  for (const [k, v] of Object.entries(icp)) {
    const label = k.replace(/_/g, " ").replace(/^./, (s) => s.toUpperCase());
    const val = flat(v);
    if (val) out.push(`${label}: ${val}`);
  }
  return out.join("\n\n");
}

// ============================================================================
// ProspectFinderForm (v3.7 Pezzo 2A) — tab multi-mode
// ============================================================================

type SearchMode = "icp" | "url" | "name" | "company";

function ProspectFinderForm({
  values,
  setValues,
  loading,
  onSubmit,
}: {
  values: Record<string, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  loading: boolean;
  onSubmit: (data: Record<string, string>) => void;
}) {
  const { icps, defaultIcp, loading: loadingIcps } = useIcps();
  const [searchMode, setSearchMode] = useState<SearchMode>(
    (values.searchMode as SearchMode) || (values.url ? "url" : "icp"),
  );

  const setMode = (m: SearchMode) => {
    setSearchMode(m);
    setValues((prev) => ({ ...prev, searchMode: m }));
  };
  const set = (k: string, v: string) => setValues((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (defaultIcp && !values.icpId) {
      setValues((prev) => ({ ...prev, icpId: defaultIcp.id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultIcp?.id]);

  const submitBtn = (
    <Button
      onClick={() => onSubmit({ ...values, searchMode })}
      disabled={
        loading ||
        (searchMode === "icp" && !values.icpId) ||
        (searchMode === "url" && !values.url)
      }
      className="w-full bg-primary hover:bg-primary-hover text-primary-foreground h-11 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
    >
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
      {loading ? "Ricerca in corso..." : "Trova prospect"}
    </Button>
  );

  const submitBtnName = (
    <Button
      onClick={() => onSubmit({ ...values, searchMode: "name" })}
      disabled={loading || !values.firstName?.trim() || !values.lastName?.trim()}
      className="w-full bg-primary hover:bg-primary-hover text-primary-foreground h-11 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
    >
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
      {loading ? "Ricerca in corso..." : "Trova persone"}
    </Button>
  );

  const isValidCompanyUrl = (u: string): boolean => {
    if (!u) return false;
    return /^https?:\/\/(www\.)?linkedin\.com\/(company|school|showcase)\//i.test(u.trim());
  };

  const submitBtnCompany = (
    <Button
      onClick={() => onSubmit({ ...values, searchMode: "company" })}
      disabled={
        loading ||
        !isValidCompanyUrl(values.company_url || "") ||
        !values.icpId ||
        icps.length === 0
      }
      className="w-full bg-primary hover:bg-primary-hover text-primary-foreground h-11 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
    >
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
      {loading ? "Trovo decisori..." : "Trova decisori"}
    </Button>
  );

  return (
    <div className="space-y-4">
      <Tabs value={searchMode} onValueChange={(v) => setMode(v as SearchMode)}>
        <TabsList className="grid grid-cols-4 w-full bg-surface/50 border border-border/30">
          <TabsTrigger value="icp">Per ICP</TabsTrigger>
          <TabsTrigger value="url">Per URL</TabsTrigger>
          <TabsTrigger value="name">Per nome</TabsTrigger>
          <TabsTrigger value="company">Per azienda</TabsTrigger>
        </TabsList>

        <TabsContent value="icp" className="space-y-4 mt-4">
          {loadingIcps ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Caricamento ICP…
            </div>
          ) : icps.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-border/40 bg-surface/30 text-center space-y-3">
              <p className="font-medium text-sm">Nessun ICP ancora</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Costruisci il tuo primo Ideal Customer Profile per iniziare a cercare i prospect giusti.
              </p>
              <Button asChild className="bg-primary hover:bg-primary-hover text-primary-foreground">
                <Link to="/skill/icp-builder">
                  Costruisci ICP <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Quale ICP usare?
                </label>
                <Select value={values.icpId || ""} onValueChange={(v) => set("icpId", v)}>
                  <SelectTrigger className="bg-surface border-border/50 h-11">
                    <SelectValue placeholder="Seleziona un ICP" />
                  </SelectTrigger>
                  <SelectContent>
                    {icps.map((icp) => (
                      <SelectItem key={icp.id} value={icp.id}>
                        <span className="flex items-center gap-2">
                          <span>{icp.name}</span>
                          {icp.is_default && (
                            <Badge className="bg-primary/15 text-primary border-0 text-[9px]">default</Badge>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  <Link to="/icps" className="hover:text-primary transition-colors">
                    Gestisci i tuoi ICP →
                  </Link>
                </p>
              </div>
              {submitBtn}
            </>
          )}
        </TabsContent>

        <TabsContent value="url" className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              URL del profilo LinkedIn
            </label>
            <Input
              placeholder="https://www.linkedin.com/in/..."
              value={values.url || ""}
              onChange={(e) => set("url", e.target.value)}
              className="bg-surface border-border/50 focus:border-primary h-11"
            />
            <p className="text-xs text-muted-foreground">
              Analizziamo il profilo singolo e calcoliamo il fit score con il tuo ICP default.
            </p>
          </div>
          {submitBtn}
        </TabsContent>

        <TabsContent value="name" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Nome <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Mario"
                value={values.firstName || ""}
                onChange={(e) => set("firstName", e.target.value)}
                className="bg-surface border-border/50 focus:border-primary h-11"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Cognome <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Rossi"
                value={values.lastName || ""}
                onChange={(e) => set("lastName", e.target.value)}
                className="bg-surface border-border/50 focus:border-primary h-11"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Parole chiave <span className="text-muted-foreground/60">(opzionale — per filtrare per ruolo o competenza)</span>
            </label>
            <Input
              placeholder="es. CEO, marketing, automation"
              value={values.keywords || ""}
              onChange={(e) => set("keywords", e.target.value)}
              className="bg-surface border-border/50 focus:border-primary h-11"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Località <span className="text-muted-foreground/60">(opzionale — default: Italia)</span>
            </label>
            <Input
              placeholder="es. Italia / Milano / Forlì"
              value={values.location || ""}
              onChange={(e) => set("location", e.target.value)}
              className="bg-surface border-border/50 focus:border-primary h-11"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Puoi scrivere solo la città ("Forlì") oppure paese intero ("Italia"). Il sistema completa automaticamente con ", Italy" se manca.
              Per ricerche più ampie, lascia vuoto.
            </p>
          </div>
          {submitBtnName}
        </TabsContent>
        <TabsContent value="company" className="space-y-4 mt-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              URL LinkedIn dell'azienda <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="https://www.linkedin.com/company/nome-azienda/"
              value={values.company_url || ""}
              onChange={(e) => set("company_url", e.target.value)}
              className="bg-surface border-border/50 focus:border-primary h-11"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Vai sulla pagina LinkedIn dell'azienda e copia l'URL dalla barra del browser.
            </p>
          </div>

          {loadingIcps ? (
            <div className="text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Caricamento ICP…
            </div>
          ) : icps.length === 0 ? (
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 text-sm">
              <p className="font-medium mb-1">Serve almeno un ICP</p>
              <p className="text-muted-foreground mb-3">
                I decisori vengono filtrati in base ai ruoli del tuo ICP. Costruiscine uno prima di cercare per azienda.
              </p>
              <Button asChild size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground">
                <Link to="/skill/icp-builder?new=1">
                  Costruisci ICP <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          ) : (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Filtra ruoli con questo ICP
              </label>
              <Select value={values.icpId || ""} onValueChange={(v) => set("icpId", v)}>
                <SelectTrigger className="bg-surface border-border/50 h-11">
                  <SelectValue placeholder="Seleziona un ICP" />
                </SelectTrigger>
                <SelectContent>
                  {icps.map((icp) => (
                    <SelectItem key={icp.id} value={icp.id}>
                      <span className="flex items-center gap-2">
                        <span>{icp.name}</span>
                        {icp.is_default && (
                          <Badge className="bg-primary/15 text-primary border-0 text-[9px]">default</Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                I ruoli (CEO, Direttore, ecc.) e la seniority vengono presi da questo ICP. L'azienda fa da filtro extra.
              </p>
            </div>
          )}

          {submitBtnCompany}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SkillForm({
  skillId,
  onSubmit,
  loading,
}: {
  skillId: string;
  onSubmit: (data: Record<string, string>) => void;
  loading: boolean;
}) {
  const [searchParams] = useSearchParams();
  const { profile, updateRawProfileData } = useProfile();

  // v3.4.3 (P5): banner ICP precompilato. Fonte primaria = profile.raw_profile_data.icp_current (DB).
  // Fallback = localStorage (utile se profile ancora in loading).
  const [storedIcp, setStoredIcp] = useState<{ generated_at: string; user_input?: string } | null>(null);
  useEffect(() => {
    if (skillId !== "prospect-finder") return;
    const fromDb = (profile?.raw_profile_data as any)?.icp_current;
    if (fromDb?.generated_at) {
      setStoredIcp({ generated_at: fromDb.generated_at, user_input: fromDb.user_input || "" });
      return;
    }
    try {
      const raw = localStorage.getItem("ember:last_icp");
      if (!raw) {
        setStoredIcp(null);
        return;
      }
      const obj = JSON.parse(raw);
      setStoredIcp({ generated_at: obj.generated_at || "", user_input: obj.user_input || "" });
    } catch {
      setStoredIcp(null);
    }
  }, [skillId, profile?.raw_profile_data]);
  // v3.4.2 fix (P1): helper per costruire il testo pre-compilato del campo
  // "description" di icp-builder a partire da raw_profile_data.target_buyer.
  // Ritorna '' se il profilo non ha ancora l'analisi completa.
  const buildIcpPrefill = (p: typeof profile): string => {
    const tb = (p?.raw_profile_data as any)?.target_buyer;
    if (!tb) return "";
    const desc = typeof tb.descrizione === "string" ? tb.descrizione.trim() : "";
    const pains = Array.isArray(tb.pain_points)
      ? ((tb.pain_points as unknown[]).filter((x) => typeof x === "string" && (x as string).trim()) as string[])
      : [];
    const parts: string[] = [];
    if (desc) parts.push(desc);
    if (pains.length) parts.push("\n\nPain points:\n" + pains.map((pp) => `- ${pp}`).join("\n"));
    return parts.join("");
  };

  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    // v3.4.1 fix (H3): precompila URL LinkedIn dal profilo o dalla query string
    // così "Rianalizza" dalla Dashboard non costringe a reincollare l'URL.
    if (skillId === "auto-profile-setup") {
      init.url = searchParams.get("url") || profile?.linkedin_url || "";
    }
    // v3.8.3: visual-post-builder rimossa.
    // v3.4.3 (P5): prospect-finder — priorità: query string > DB (profile.raw_profile_data.icp_current) > localStorage.
    // DB è la fonte persistente (refresh-safe, cross-device). localStorage è fallback cache.
    if (skillId === "prospect-finder") {
      const icpFromUrl = searchParams.get("icp");
      if (icpFromUrl) {
        try {
          const parsed = JSON.parse(icpFromUrl);
          init.query = formatIcpForTextarea(parsed);
        } catch {
          init.query = icpFromUrl;
        }
      } else {
        const fromDb = (profile?.raw_profile_data as any)?.icp_current;
        if (fromDb?.icp) {
          init.query = formatIcpForTextarea(fromDb.icp);
        } else {
          try {
            const stored = localStorage.getItem("ember:last_icp");
            if (stored) {
              const obj = JSON.parse(stored);
              if (obj?.icp) init.query = formatIcpForTextarea(obj.icp);
            }
          } catch {
            /* ignore */
          }
        }
      }
    }
    if (skillId === "outreach-drafter") {
      init.nome = searchParams.get("nome") || "";
      init.headline = searchParams.get("headline") || "";
      init.azienda = searchParams.get("azienda") || "";
    }
    // v3.8.0 (Tranche 1): hook-generator pre-compilato da query string ?tema=...
    if (skillId === "hook-generator") {
      init.tema = searchParams.get("tema") || "";
    }
    // v3.8.3 (Tranche 2.1): visual-brief unifica anche carousel. Tab via ?tab=single|carousel.
    if (skillId === "visual-brief") {
      init.tab = searchParams.get("tab") || "single";
      init.post_text = searchParams.get("post") || "";
      init.formato = searchParams.get("formato") || "single";
      init.tema = searchParams.get("tema") || "";
      init.num_slide = searchParams.get("num_slide") || "8";
    }
    if (skillId === "profile-banner-brief") {
      init.obiettivo = searchParams.get("obiettivo") || "";
    }
    // post-improver: nessun init particolare; l'utente incolla manualmente.
    // v3.4.2 fix (P1): precompila ICP builder con target dal profilo analizzato.
    // Priorità: query string ?description= > raw_profile_data.target_buyer.
    if (skillId === "icp-builder") {
      // v3.7.10: precompila name e descrizione. Se ?icpId=X, name/description verranno
      // caricati da DB nell'useEffect successivo. Qui inizializziamo solo da query string.
      init.name = searchParams.get("name") || "";
      const fromUrl = searchParams.get("description") || "";
      init.description = fromUrl || buildIcpPrefill(profile);
      init.zone = searchParams.get("zone") || "Italy"; // CSV multi-region (default: tutta Italia)
    }
    return init;
  });

  // Se il profilo si carica dopo il mount, aggiorna i campi dipendenti una volta sola.
  useEffect(() => {
    if (skillId === "auto-profile-setup" && !values.url && profile?.linkedin_url) {
      setValues((prev) => ({ ...prev, url: profile.linkedin_url || "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.linkedin_url]);

  // v3.4.2 fix (P1): sync ICP prefill quando raw_profile_data arriva tardi.
  // Solo se il campo è ancora vuoto (non sovrascrive input manuale dell'utente).
  useEffect(() => {
    if (skillId === "icp-builder" && !values.description) {
      const pre = buildIcpPrefill(profile);
      if (pre) setValues((prev) => ({ ...prev, description: pre }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.raw_profile_data]);

  // v3.8.1 (Tranche 1.5): pre-compila form da ?fromAssetId=<uuid> per chain content.
  // Esempi:
  //   - hook → post-writer: init.brief = "Scrivi un post che inizi con: <hook text>"
  //   - post → post-improver: init.post_originale = post.output.post_text
  //   - post → hook-generator: init.tema = post.input.tema (riusa lo stesso tema)
  useEffect(() => {
    if (
      ![
        "post-writer",
        "post-improver",
        "hook-generator",
        // v3.8.3 (Tranche 2.1): visual-brief unifica anche il caso carosello.
        "visual-brief",
        "profile-banner-brief",
      ].includes(skillId)
    )
      return;
    const fromId = searchParams.get("fromAssetId");
    if (!fromId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("content_assets")
        .select("type, input, output, title")
        .eq("id", fromId)
        .maybeSingle();
      if (cancelled || !data) return;
      const a = data as any;
      const inp = a.input || {};
      const out = a.output || {};
      setValues((prev) => {
        const next = { ...prev };
        if (skillId === "post-writer") {
          // se parto da hook → uso quel hook come spunto
          if (a.type === "hook" && Array.isArray(out.hooks) && out.hooks.length) {
            const h = out.hooks[0];
            if (!next.brief) {
              next.brief = `Scrivi un post che parta con questo hook:\n"${h.text}"\n\nTema generale: ${inp.tema || ""}`;
            }
          } else if (a.type === "improvement" && out.post_improved) {
            // riparto dal post migliorato → riformulo come tema
            if (!next.brief) next.brief = out.post_improved.slice(0, 500);
          }
        }
        if (skillId === "post-improver") {
          // arrivo da post → metto il post_text come post_originale
          if (a.type === "post" && out.post_text && !next.post_originale) {
            next.post_originale = out.post_text;
          } else if (a.type === "improvement" && out.post_improved && !next.post_originale) {
            next.post_originale = out.post_improved;
          }
        }
        if (skillId === "hook-generator") {
          // arrivo da post o improvement → riuso il tema o il testo come tema
          if (!next.tema) {
            if (a.type === "post" && inp.tema) next.tema = String(inp.tema);
            else if (a.type === "post" && out.post_text) next.tema = out.post_text.slice(0, 200);
            else if (a.type === "improvement" && out.post_improved) next.tema = out.post_improved.slice(0, 200);
          }
        }
        // v3.8.3 (Tranche 2.1): visual-brief unificato — pre-fill diverso per tab single|carousel.
        if (skillId === "visual-brief") {
          // Detect target tab: query string ?tab=... ha priorità; altrimenti deduce dall'asset
          // di partenza (se è un carousel_brief, default carousel; altrimenti single).
          if (!next.tab) {
            const requestedTab = searchParams.get("tab");
            if (requestedTab) next.tab = requestedTab;
            else if (a.type === "carousel_brief") next.tab = "carousel";
            else next.tab = "single";
          }
          // post_text (utile sia per tab single che per il "post sorgente" in carousel)
          if (!next.post_text) {
            if (a.type === "post" && out.post_text) next.post_text = out.post_text;
            else if (a.type === "improvement" && out.post_improved) next.post_text = out.post_improved;
          }
          // tema (solo per tab carousel)
          if (!next.tema) {
            if (a.type === "post" && inp.tema) next.tema = String(inp.tema);
            else if (a.type === "improvement" && out.post_improved) next.tema = out.post_improved.slice(0, 200);
          }
        }
        // profile-banner-brief: non parte da un asset esistente (input = profilo+brand_kit).
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId, searchParams]);

  // v3.4.3 (P5): sync prospect-finder query quando l'ICP in DB arriva tardi.
  // Solo se query è ancora vuota (non sovrascrive input manuale).
  useEffect(() => {
    if (skillId !== "prospect-finder") return;
    if (values.query) return;
    const fromDb = (profile?.raw_profile_data as any)?.icp_current;
    if (fromDb?.icp) {
      setValues((prev) => ({ ...prev, query: formatIcpForTextarea(fromDb.icp) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.raw_profile_data]);

  // v3.7.10: in modalità edit (?icpId=...), precompila name + description + zone dall'ICP esistente.
  useEffect(() => {
    if (skillId !== "icp-builder") return;
    const editingId = searchParams.get("icpId");
    if (!editingId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("icps")
        .select("name, description, filters_override")
        .eq("id", editingId)
        .maybeSingle();
      if (!cancelled && data) {
        const fo = (data as any).filters_override || {};
        const locs = Array.isArray(fo.locations) ? fo.locations : [];
        setValues((prev) => ({
          ...prev,
          name: prev.name || (data as any).name || "",
          description: prev.description || (data as any).description || "",
          zone: prev.zone && prev.zone !== "Italy" ? prev.zone : (locs.length > 0 ? locs.join(",") : "Italy"),
        }));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId, searchParams]);

  const set = (k: string, v: string) => setValues((prev) => ({ ...prev, [k]: v }));

  const submitBtn = (
    <Button
      onClick={() => onSubmit(values)}
      disabled={loading}
      className="w-full bg-primary hover:bg-primary-hover text-primary-foreground h-11 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
    >
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
      {loading ? "Elaborazione..." : "Genera"}
    </Button>
  );

  if (skillId === "auto-profile-setup") {
    return (
      <div className="space-y-4">
        <Input
          placeholder="https://www.linkedin.com/in/tuoprofilo"
          value={values.url || ""}
          onChange={(e) => set("url", e.target.value)}
          className="bg-surface border-border/50 focus:border-primary h-11"
        />
        {submitBtn}
      </div>
    );
  }
  if (skillId === "post-writer") {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tema / idea / notizia</label>
          <Textarea
            placeholder="Es. 'Ho appena chiuso un cliente parlando di un errore comune nelle PMI manifatturiere. Voglio raccontare la lezione.'"
            value={values.brief || ""}
            onChange={(e) => set("brief", e.target.value)}
            className="bg-surface border-border/50 focus:border-primary transition-colors"
            rows={5}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Formato</label>
          <Select value={values.format || "Storytelling"} onValueChange={(v) => set("format", v)}>
            <SelectTrigger className="bg-surface border-border/50">
              <SelectValue placeholder="Formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Storytelling">Storytelling — racconta un'esperienza</SelectItem>
              <SelectItem value="Insight">Insight — un'idea + perché conta</SelectItem>
              <SelectItem value="Case Study">Case Study — problema + soluzione + risultato</SelectItem>
              <SelectItem value="Polarizzante">Polarizzante — opinione contraria al mainstream</SelectItem>
              <SelectItem value="Listicle">Listicle — N modi per X</SelectItem>
              <SelectItem value="Lezione">Lezione — cosa ho imparato facendo X</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {submitBtn}
      </div>
    );
  }
  if (skillId === "post-improver") {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Post da migliorare</label>
          <Textarea
            placeholder="Incolla qui il tuo post LinkedIn così com'è, anche bozza grezza..."
            value={values.post_originale || ""}
            onChange={(e) => set("post_originale", e.target.value)}
            className="bg-surface border-border/50 focus:border-primary transition-colors"
            rows={9}
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Manteniamo il tuo messaggio centrale e la tua voce. Cambiamo solo struttura, hook, CTA e fluidità.
          </p>
        </div>
        {submitBtn}
      </div>
    );
  }
  if (skillId === "hook-generator") {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tema / argomento del post</label>
          <Textarea
            placeholder="Es. 'Errori comuni nelle PMI nel scegliere un CRM' oppure 'Perché il networking sui fiere non funziona più'"
            value={values.tema || ""}
            onChange={(e) => set("tema", e.target.value)}
            className="bg-surface border-border/50 focus:border-primary transition-colors"
            rows={3}
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Genereremo 5 hook (prima riga del post) con angoli diversi: curiosity, contrarian, data, story, question.
          </p>
        </div>
        {submitBtn}
      </div>
    );
  }
  // v3.8.3 (Tranche 2.1): visual-brief form unificato con tab Singolo | Carosello.
  // values.tab: "single" (default) | "carousel". Il dispatch a n8n usa due webhook diversi
  // (ember/visual-brief vs ember/carousel-brief), gestiti in handleSubmit.
  if (skillId === "visual-brief") {
    const tab = values.tab || "single";
    return (
      <div className="space-y-4">
        <Tabs value={tab} onValueChange={(v) => set("tab", v)}>
          <TabsList className="grid grid-cols-2 w-full bg-surface/50">
            <TabsTrigger value="single">
              <ImagePlus className="h-3.5 w-3.5 mr-1.5" /> Singolo
            </TabsTrigger>
            <TabsTrigger value="carousel">
              <Layers className="h-3.5 w-3.5 mr-1.5" /> Carosello
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4 pt-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Post LinkedIn da illustrare
              </label>
              <Textarea
                placeholder="Incolla qui il post completo (o solo l'hook + concetto principale)..."
                value={values.post_text || ""}
                onChange={(e) => set("post_text", e.target.value)}
                className="bg-surface border-border/50 focus:border-primary transition-colors"
                rows={8}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Niente generazione di immagini reali. Ti diamo concept, palette e 3 prompt copia-incolla per generatori AI.
              </p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Formato visual</label>
              <Select value={values.formato || "single"} onValueChange={(v) => set("formato", v)}>
                <SelectTrigger className="bg-surface border-border/50">
                  <SelectValue placeholder="Formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Singolo (1200×1200) — feed quadrato</SelectItem>
                  <SelectItem value="landscape">Landscape (1200×627) — feed orizzontale</SelectItem>
                  <SelectItem value="portrait">Portrait (1080×1350) — più visibile in feed</SelectItem>
                  <SelectItem value="story">Story / Reel cover (1080×1920)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="carousel" className="space-y-4 pt-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tema / argomento del carosello</label>
              <Textarea
                placeholder="Es. 'I 5 errori più comuni di chi sceglie il primo CRM' — sii specifico, è il filo conduttore dello storyboard."
                value={values.tema || ""}
                onChange={(e) => set("tema", e.target.value)}
                className="bg-surface border-border/50 focus:border-primary transition-colors"
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Post sorgente <span className="text-muted-foreground/60">(opzionale, dà più contesto)</span>
              </label>
              <Textarea
                placeholder="Se hai già un post sul tema, incollalo qui per allineare lo storyboard."
                value={values.post_text || ""}
                onChange={(e) => set("post_text", e.target.value)}
                className="bg-surface border-border/50 focus:border-primary transition-colors"
                rows={4}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Numero slide (incluse cover e CTA)</label>
              <Select value={values.num_slide || "8"} onValueChange={(v) => set("num_slide", v)}>
                <SelectTrigger className="bg-surface border-border/50">
                  <SelectValue placeholder="N slide" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 slide — breve</SelectItem>
                  <SelectItem value="7">7 slide — standard</SelectItem>
                  <SelectItem value="8">8 slide — consigliato</SelectItem>
                  <SelectItem value="10">10 slide — esteso</SelectItem>
                  <SelectItem value="12">12 slide — long form</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>
        {submitBtn}
      </div>
    );
  }
  // v3.8.2 (Tranche 2): profile-banner-brief form
  if (skillId === "profile-banner-brief") {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Obiettivo del banner <span className="text-muted-foreground/60">(opzionale)</span>
          </label>
          <Textarea
            placeholder="Es. 'Attrarre PMI manifatturiere in cerca di un sales partner B2B' — più sei specifico, più mirato sarà il concept."
            value={values.obiettivo || ""}
            onChange={(e) => set("obiettivo", e.target.value)}
            className="bg-surface border-border/50 focus:border-primary transition-colors"
            rows={3}
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Banner LinkedIn 1584×396. Usiamo il tuo profilo business + brand kit. Output: concept + palette + 3 prompt copia-incolla per generatori AI.
          </p>
        </div>
        {submitBtn}
      </div>
    );
  }
  // v3.8.3: rimossi i form di visual-post-builder e content-performance (skill obsolete).
  if (skillId === "icp-builder") {
    // v3.7.10: form esteso con Nome ICP (richiesto) + Zone target (multi-select regioni IT).
    const selectedZones = (values.zone || "Italy").split(",").map((z) => z.trim()).filter(Boolean);
    const toggleZone = (z: string) => {
      const set_ = new Set(selectedZones);
      if (z === "Italy") {
        // Selezionare "Tutta Italia" deseleziona tutte le altre regioni.
        setValues((prev) => ({ ...prev, zone: "Italy" }));
        return;
      }
      // Selezionare una regione specifica deseleziona "Italy" generico.
      set_.delete("Italy");
      if (set_.has(z)) set_.delete(z);
      else set_.add(z);
      const next = Array.from(set_);
      setValues((prev) => ({ ...prev, zone: next.length > 0 ? next.join(",") : "Italy" }));
    };
    const editingIcpId = searchParams.get("icpId");
    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Nome ICP <span className="text-muted-foreground/60">(es. "PMI manifatturiere Lombardia", "Agenzie marketing Roma")</span>
          </label>
          <Input
            placeholder="Nome breve per identificare questo ICP"
            value={values.name || ""}
            onChange={(e) => set("name", e.target.value)}
            className="bg-surface border-border/50 focus:border-primary h-11"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Descrizione del cliente ideale</label>
          <Textarea
            placeholder="Descrivi il tuo cliente ideale: settore, dimensione, ruoli, problemi che vuole risolvere..."
            value={values.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className="bg-surface border-border/50 focus:border-primary transition-colors"
            rows={4}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Zone target <span className="text-muted-foreground/60">(scegli una o più regioni; default: tutta Italia)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {REGIONI_IT.map((r) => {
              const active = selectedZones.includes(r.value);
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => toggleZone(r.value)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-surface border-border/50 hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
        {!editingIcpId && (
          <p className="text-[11px] text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg p-2">
            💡 Stai creando un <strong>nuovo ICP</strong>. Verrà aggiunto a "I miei ICP" senza sovrascrivere quelli esistenti.
          </p>
        )}
        {editingIcpId && (
          <p className="text-[11px] text-muted-foreground bg-amber-500/5 border border-amber-500/20 rounded-lg p-2">
            ✏️ Stai <strong>modificando</strong> un ICP esistente. Le modifiche sostituiranno la versione corrente.
          </p>
        )}
        {submitBtn}
      </div>
    );
  }
  if (skillId === "prospect-finder") {
    // v3.7 Pezzo 2A: rimosso il banner "ICP precompilato" + clearIcp.
    // Nuovo flusso: tab `Per ICP | Per URL | (Per nome) | (Per azienda)`.
    return <ProspectFinderForm values={values} setValues={setValues} loading={loading} onSubmit={onSubmit} />;
  }
  if (skillId === "outreach-drafter") {
    return (
      <div className="space-y-4">
        <Input
          placeholder="Nome"
          value={values.nome || ""}
          onChange={(e) => set("nome", e.target.value)}
          className="bg-surface border-border/50 focus:border-primary h-11"
        />
        <Input
          placeholder="Headline"
          value={values.headline || ""}
          onChange={(e) => set("headline", e.target.value)}
          className="bg-surface border-border/50 focus:border-primary h-11"
        />
        <Input
          placeholder="Azienda"
          value={values.azienda || ""}
          onChange={(e) => set("azienda", e.target.value)}
          className="bg-surface border-border/50 focus:border-primary h-11"
        />
        <Textarea
          placeholder="Note aggiuntive (opzionale)"
          value={values.note || ""}
          onChange={(e) => set("note", e.target.value)}
          className="bg-surface border-border/50 focus:border-primary transition-colors"
          rows={2}
        />
        {submitBtn}
      </div>
    );
  }
  if (skillId === "reply-suggester") {
    return (
      <div className="space-y-4">
        <Textarea
          placeholder="Incolla il messaggio ricevuto..."
          value={values.message || ""}
          onChange={(e) => set("message", e.target.value)}
          className="bg-surface border-border/50 focus:border-primary transition-colors"
          rows={4}
        />
        <Textarea
          placeholder="Obiettivo (es: fissare call, qualificare)"
          value={values.context || ""}
          onChange={(e) => set("context", e.target.value)}
          className="bg-surface border-border/50 focus:border-primary transition-colors"
          rows={2}
        />
        {submitBtn}
      </div>
    );
  }
  if (skillId === "network-intelligence") {
    return (
      <Button
        onClick={() => onSubmit(values)}
        disabled={loading}
        className="w-full bg-primary hover:bg-primary-hover text-primary-foreground h-11 shadow-lg shadow-primary/20"
      >
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}{" "}
        {loading ? "Aggiornamento..." : "Aggiorna ora"}
      </Button>
    );
  }
  return submitBtn;
}

// ============ MAIN COMPONENT ============

export default function SkillPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const skill = SKILLS.find((s) => s.id === skillId);
  const { profile, consumeSkillRun, updateRawProfileData, updateProfile } = useProfile();
  const { logRun } = useSkillRuns();
  const icpHook = useIcps();

  // v3.8.1 (Tranche 1.5): content_assets — auto-save dopo generation + read assetId/fromAssetId.
  const contentAssetsHook = useContentAssets();
  const assetId = searchParams.get("assetId");
  const fromAssetId = searchParams.get("fromAssetId");
  const { asset: openedAsset } = useContentAssetById(assetId);
  const { asset: parentAsset } = useContentAssetById(fromAssetId);

  // Mappa skill.id → ContentAssetType. Solo per skill content writing.
  const skillToAssetType = (sid: string | undefined): ContentAssetType | null => {
    if (sid === "post-writer") return "post";
    if (sid === "post-improver") return "improvement";
    if (sid === "hook-generator") return "hook";
    // v3.8.2/v3.8.3: visual-brief = tab Singolo. carousel-brief è il dispatch target della tab Carosello
    // (entrambi mostrati nella stessa skill page "visual-brief").
    if (sid === "visual-brief") return "visual_brief";
    if (sid === "carousel-brief") return "carousel_brief";
    if (sid === "profile-banner-brief") return "banner_brief";
    if (sid === "profile-optimizer") return "profile_audit";
    return null;
  };
  const currentAssetType = skillToAssetType(skill?.id);
  const isContentSkill = currentAssetType !== null;
  // v3.7 Pezzo 2A: riapertura ricerca passata via ?searchId=
  const reopenSearchId = searchParams.get("searchId");
  const { data: reopenedSearch } = useSearchById(reopenSearchId);

  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [loadedFromCache, setLoadedFromCache] = useState(false);
  // v3.6.1: traccia il workflow effettivamente chiamato (può differire da skill.id
  // quando il routing dirotta prospect-finder → prospect-search-harvest).
  // Serve a SkillOutput per scegliere il render corretto.
  const [lastEffectiveSkillId, setLastEffectiveSkillId] = useState<string | null>(null);

  const forceNewRun = searchParams.get("force") === "1";
  const targetSection = searchParams.get("section");

  // Load cached analysis for auto-profile-setup
  useEffect(() => {
    if (skill?.id !== "auto-profile-setup") return;
    if (forceNewRun) return;
    if (output) return;

    const cached = profile?.raw_profile_data as any;
    if (cached?.score_totale) {
      setOutput(cached);
      setLoadedFromCache(true);
    }
  }, [skill?.id, profile?.raw_profile_data, forceNewRun, output]);

  // v3.7.10: cache loading per icp-builder. Fonte di verità = tabella `icps` (via useIcps).
  //   - ?new=1            → form pulito, niente cache
  //   - ?icpId=<uuid>     → carica QUELL'ICP per modifica (anche values: name/description/zone)
  //   - (nessun param)    → mostra ICP default come cache (compat con flusso v3.6)
  useEffect(() => {
    if (skill?.id !== "icp-builder") return;
    if (forceNewRun) return;
    if (output) return;
    const isNewIcp = searchParams.get("new") === "1";
    if (isNewIcp) return;

    const editingIcpId = searchParams.get("icpId");
    if (editingIcpId) {
      const target = icpHook.icps.find((i) => i.id === editingIcpId);
      if (target) {
        setOutput({
          icp: target.icp_json,
          buyer_personas: target.buyer_personas,
          linkedin_search_query: target.linkedin_search_query,
          trigger_events: target.trigger_events,
          exclusioni: target.exclusioni,
        });
        setLoadedFromCache(true);
      }
      return;
    }

    if (icpHook.defaultIcp) {
      setOutput({
        icp: icpHook.defaultIcp.icp_json,
        buyer_personas: icpHook.defaultIcp.buyer_personas,
        linkedin_search_query: icpHook.defaultIcp.linkedin_search_query,
        trigger_events: icpHook.defaultIcp.trigger_events,
        exclusioni: icpHook.defaultIcp.exclusioni,
      });
      setLoadedFromCache(true);
    }
  }, [skill?.id, icpHook.icps, icpHook.defaultIcp, forceNewRun, output, searchParams]);

  // Scroll to target section after output renders
  useEffect(() => {
    if (!output || !targetSection) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`section-${targetSection}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [output, targetSection]);

  // v3.8.1 (Tranche 1.5): reset stato al cambio skill (chiude bug "errore residuo tra schede").
  useEffect(() => {
    setOutput(null);
    setError(null);
    setLoadedFromCache(false);
    setLastEffectiveSkillId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skill?.id]);

  // v3.8.1: ?assetId=<uuid> → riapri asset esistente (read-only, niente API call).
  useEffect(() => {
    if (!isContentSkill) return;
    if (!assetId || !openedAsset) return;
    if (output) return;
    setOutput(openedAsset.output as Record<string, unknown>);
    setLoadedFromCache(true);
  }, [isContentSkill, assetId, openedAsset, output]);

  // v3.7 Pezzo 2A: riapertura ricerca passata via ?searchId= (no API call).
  useEffect(() => {
    if (skill?.id !== "prospect-finder") return;
    if (!reopenSearchId) return;
    if (!reopenedSearch) return;
    setOutput({
      prospects: reopenedSearch.prospects,
      count: reopenedSearch.prospects.length,
      count_saved: reopenedSearch.prospects.length,
      search_id: reopenedSearch.id,
      _from_history: true,
    });
    setLastEffectiveSkillId("prospect-search-harvest");
  }, [skill?.id, reopenSearchId, reopenedSearch?.id, reopenedSearch]);

  if (!skill) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Skill non trovata.</p>
        </div>
      </AppLayout>
    );
  }

  const handleSubmit = async (formValues: Record<string, string>) => {
    if (!profile || !user) return;

    const check = canUseSkill(profile, skill);
    if (!check.allowed) {
      toast.error(check.reason || "Non puoi usare questa skill.");
      return;
    }

    setLoading(true);
    setOutput(null);
    setError(null);
    setLoadedFromCache(false);

    // v3.6.0 routing: la pagina è SEMPRE /skill/prospect-finder, ma:
    //   - se l'utente ha incollato un URL → workflow "prospect-finder" (scrape singolo + fit_score)
    //   - se l'utente ha SOLO ICP/testo → workflow "prospect-search-harvest" (search massiva → 25 prospects)
    // Usiamo l'ICP strutturato salvato da icp-builder (raw_profile_data.icp_current) se presente,
    // altrimenti fallback su {descrizione: testo libero}.
    let effectiveSkillId: string = skill.id;

    // v3.8.0 (Tranche 1): inietta brand_kit nel formValues per le skill content-writing.
    // buildPayload legge values.brand_kit_json (string JSON) e lo deserializza.
    const brandKit = ((profile as any)?.brand_kit as Record<string, unknown> | undefined) ?? null;
    const rawProfileData = ((profile as any)?.raw_profile_data as Record<string, unknown> | undefined) ?? null;
    const formValuesWithBrand: Record<string, string> = {
      ...formValues,
      brand_kit_json: brandKit ? JSON.stringify(brandKit) : "",
      raw_profile_data_json: rawProfileData ? JSON.stringify(rawProfileData) : "",
      // ICP target opzionale (per post-writer): default = ICP default dell'utente, se presente.
      icp_target_json:
        formValues.icp_target_json ||
        (icpHook.defaultIcp?.icp_json ? JSON.stringify(icpHook.defaultIcp.icp_json) : ""),
    };

    let payload = buildPayload(
      skill.id,
      formValuesWithBrand,
      profile.business_profile as unknown as Record<string, unknown> | null,
      user.id,
    );

    // v3.8.3 (Tranche 2.1): visual-brief con tab "Carosello" dispatcha al webhook carousel-brief.
    if (skill.id === "visual-brief" && (formValues.tab || "single") === "carousel") {
      effectiveSkillId = "carousel-brief";
      payload = buildPayload(
        "carousel-brief",
        formValuesWithBrand,
        profile.business_profile as unknown as Record<string, unknown> | null,
        user.id,
      );
    }

    if (skill.id === "prospect-finder") {
      const mode = (formValues.searchMode as string) || (formValues.url ? "url" : "icp");

      if (mode === "icp") {
        // v3.7 Pezzo 2A: usa l'ICP scelto dal picker (formValues.icpId)
        effectiveSkillId = "prospect-search-harvest";
        const pickedIcpId = formValues.icpId;
        const pickedIcp = icpHook.icps.find((i) => i.id === pickedIcpId) || icpHook.defaultIcp;
        if (!pickedIcp) {
          toast.error("Seleziona un ICP. Se non ne hai ancora, costruiscine uno da \"I miei ICP\".");
          setLoading(false);
          return;
        }
        payload = {
          user_id: user.id,
          icp: pickedIcp.icp_json,
          icp_id: pickedIcp.id,
          icp_name: pickedIcp.name,
          filters_override: pickedIcp.filters_override || null,
          list_name: "",
        };
        // Best-effort, non blocca
        icpHook.touchUsed(pickedIcp.id);
      } else if (mode === "url") {
        // Per URL: skillId resta 'prospect-finder' (1 scrape singolo + fit_score).
        // Aggiungiamo l'ICP default per il fit score, se presente.
        const fallbackIcp = icpHook.defaultIcp?.icp_json ?? {};
        payload = {
          user_id: user.id,
          linkedin_url_target: formValues.url || "",
          icp: fallbackIcp,
        };
      } else if (mode === "name") {
        // v3.7.2 Pezzo 2B: ricerca per nome+cognome.
        // Bypassa l'ICP, va al workflow harvest che switcha sul branch IF (search_mode='name').
        effectiveSkillId = "prospect-search-harvest";
        const firstName = (formValues.firstName || "").trim();
        const lastName = (formValues.lastName || "").trim();
        if (!firstName || !lastName) {
          toast.error("Inserisci nome e cognome.");
          setLoading(false);
          return;
        }
        const locations = (formValues.location || "").trim()
          ? [(formValues.location as string).trim()]
          : ["Italy"];
        payload = {
          user_id: user.id,
          search_mode: "name",
          firstName,
          lastName,
          keywords: (formValues.keywords || "").trim(),
          locations,
          list_name: "",
        };
      } else if (mode === "company") {
        // v3.7.3 Pezzo 2C: ricerca decisori di un'azienda.
        effectiveSkillId = "prospect-search-harvest";
        const companyUrl = (formValues.company_url || "").trim();
        if (!/^https?:\/\/(www\.)?linkedin\.com\/(company|school|showcase)\//i.test(companyUrl)) {
          toast.error("Incolla un URL LinkedIn azienda valido (https://www.linkedin.com/company/...).");
          setLoading(false);
          return;
        }
        const pickedIcpId = formValues.icpId;
        const pickedIcp = icpHook.icps.find((i) => i.id === pickedIcpId) || icpHook.defaultIcp;
        if (!pickedIcp) {
          toast.error("Seleziona un ICP per filtrare i ruoli dei decisori.");
          setLoading(false);
          return;
        }
        payload = {
          user_id: user.id,
          search_mode: "company",
          company_url: companyUrl,
          icp: pickedIcp.icp_json,
          icp_id: pickedIcp.id,
          icp_name: pickedIcp.name,
          list_name: "",
        };
        icpHook.touchUsed(pickedIcp.id);
      }
    }

    // SkillId è una union literal stretta in ember-types; cast esplicito perché
    // 'prospect-search-harvest' è già whitelisted lato gateway run-skill.
    const result = await callSkill(effectiveSkillId as any, payload);

    if (result.ok) {
      setOutput(result.data as Record<string, unknown>);
      // v3.6.1: ricorda il workflow effettivo per scegliere il render corretto
      // (es. quando prospect-finder è stato dirottato a prospect-search-harvest).
      setLastEffectiveSkillId(effectiveSkillId);
      await logRun({
        skill: effectiveSkillId,
        input: payload,
        output: result.data as Record<string, unknown>,
        status: "completed",
        is_scrape: skill.usesScraping,
        duration_ms: result.duration_ms,
      });
      await consumeSkillRun(skill.usesScraping);

      // v3.4.4 fix (bug persistenza ICP): TUTTI i salvataggi su raw_profile_data usano merge
      // difensivo leggendo lo stato fresco dal DB, così non sovrascriviamo chiavi scritte in
      // parallelo (es. icp_current scritto da icp-builder viene preservato da auto-profile-setup).
      // Motivo: `profile` nella closure di handleSubmit è potenzialmente stale dopo consumeSkillRun.
      async function mergeRawProfileData(patch: Record<string, unknown>) {
        try {
          const { data: fresh } = await supabase
            .from("profiles")
            .select("raw_profile_data")
            .eq("user_id", user.id)
            .maybeSingle();
          const currentRaw = ((fresh as any)?.raw_profile_data || {}) as Record<string, unknown>;
          await updateRawProfileData({ ...currentRaw, ...patch });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("[SkillPage] mergeRawProfileData failed, falling back to stale merge:", e);
          const currentRaw = (profile.raw_profile_data || {}) as Record<string, unknown>;
          await updateRawProfileData({ ...currentRaw, ...patch });
        }
      }

      // Persist auto-profile-setup analysis on profile
      // v3.4.1 fix (B2): NON sovrascrivere business_profile (ha campi custom da Onboarding:
      // tone_of_voice, value_proposition, punti_forza, tags) con il sotto-set di 5 campi
      // restituito dal prompt. Salviamo solo raw_profile_data e, se cambiato, linkedin_url.
      // v3.4.4 fix: MERGE invece di overwrite. Prima scriveva `updateRawProfileData(data)` che
      // cancellava icp_current se presente. Ora preserviamo tutte le altre chiavi.
      if (skill.id === "auto-profile-setup") {
        const data = result.data as any;
        if (data?.score_totale) {
          await mergeRawProfileData(data);
          const newUrl = formValues.url?.trim();
          if (newUrl && newUrl !== profile.linkedin_url) {
            await updateProfile({ linkedin_url: newUrl });
          }
        }
      }

      // v3.7.10: persistenza ICP su tabella `icps` (multi-ICP).
      // Modalità:
      //   - ?icpId=<uuid> → UPDATE quello specifico
      //   - ?new=1 oppure nessun ICP esistente → INSERT nuovo
      //   - default (nessun param + esiste defaultIcp) → INSERT NUOVO (NON sovrascrive!).
      // L'utente che vuole sostituire un ICP deve farlo da /icps → "Modifica".
      if (skill.id === "icp-builder") {
        const data = (result.data ?? {}) as any;
        const icpPayload = data?.icp ?? data;
        if (icpPayload && typeof icpPayload === "object" && Object.keys(icpPayload).length > 0) {
          const editingIcpId = searchParams.get("icpId");
          const isNewIcp = searchParams.get("new") === "1";
          const inputName = (formValues.name || "").trim();
          // Zone target: CSV string → array. "Italy" significa "tutta Italia" e va passato come-is.
          const zonesCsv = (formValues.zone || "Italy").trim();
          const zones = zonesCsv.split(",").map((z) => z.trim()).filter(Boolean);
          const filtersOverride: Record<string, unknown> = zones.length > 0 ? { locations: zones } : {};

          const fields = {
            icp_json: icpPayload,
            buyer_personas: data.buyer_personas ?? null,
            linkedin_search_query: data.linkedin_search_query ?? null,
            trigger_events: data.trigger_events ?? null,
            exclusioni: data.exclusioni ?? null,
            description: formValues.description || "",
            filters_override: filtersOverride,
          };

          if (editingIcpId) {
            // UPDATE
            const patch: any = { ...fields };
            if (inputName) patch.name = inputName;
            const updated = await icpHook.update(editingIcpId, patch);
            if (updated) toast.success(`ICP "${updated.name}" aggiornato.`);
          } else {
            // INSERT (sempre nuovo, anche se non c'è ?new=1)
            const fallbackName = inputName || `ICP del ${new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`;
            const isFirst = icpHook.icps.length === 0;
            const created = await icpHook.create({
              name: fallbackName,
              ...fields,
              is_default: isFirst,
              source: "auto",
            });
            if (created) toast.success(`ICP "${created.name}" creato.`);
          }
        } else {
          // eslint-disable-next-line no-console
          console.warn("[SkillPage] icp-builder: nessun payload utile da salvare");
        }
      }

      // v3.8.1 (Tranche 1.5): auto-save asset per skill content (post-writer, post-improver, hook-generator).
      // v3.8.3: l'asset type viene risolto da effectiveSkillId (per visual-brief la tab Carosello
      // dispatcha a "carousel-brief" → asset type "carousel_brief").
      const effectiveAssetType = skillToAssetType(effectiveSkillId) || currentAssetType;
      if (isContentSkill && effectiveAssetType && result.data && Object.keys(result.data).length > 0) {
        const inputSnapshot = { ...payload };
        // Rimuovi user_id dal snapshot (è già implicito nel row)
        delete (inputSnapshot as any).user_id;
        const created = await contentAssetsHook.create({
          type: effectiveAssetType,
          parent_id: fromAssetId || null,
          input: inputSnapshot,
          output: result.data as Record<string, unknown>,
          title: autoTitleForAsset(
            effectiveAssetType,
            inputSnapshot,
            result.data as Record<string, unknown>,
          ),
        });
        if (created) {
          // Aggiorna URL con ?assetId=<id> così se l'utente ricarica vede l'asset salvato.
          const sp = new URLSearchParams(searchParams);
          sp.delete("fromAssetId");
          sp.set("assetId", created.id);
          navigate(`/skill/${skill.id}?${sp.toString()}`, { replace: true });
        }
      }

      toast.success(`${skill.name} completata in ${(result.duration_ms / 1000).toFixed(1)}s`);
    } else {
      // v3.4.4: cast esplicito perché in alcune config TS strict il narrowing della discriminated
      // union si perde (probabilmente per via dei generics di callSkill<T>). Il tipo a runtime è
      // corretto: se result.ok === false, error è sempre presente (vedi EmberResult in ember-api.ts).
      const errResult = result as Extract<typeof result, { ok: false }>;
      const msg = emberErrorMessage(errResult.error);
      setError(msg);
      toast.error(msg);
      await logRun({
        skill: effectiveSkillId,
        input: payload,
        output: null,
        status: "error",
        is_scrape: false,
        error_message: errResult.error.message,
      });
    }

    setLoading(false);
  };

  // ========== Rigenera singola sezione ==========
  const handleRegenerateSection = async (sectionName: string, feedback: string) => {
    if (!profile || !user || !output) return;
    const data = output as any;
    const section = data.sezioni?.find((s: any) => s.nome === sectionName);
    if (!section) return;

    // v3.4.1 fix (H1): gating quota skill_runs. regenerate-section costa come una skill normale (Claude call)
    // quindi consuma 1 skill_run ma NON 1 scrape. Blocca se l'utente ha esaurito la quota.
    if (profile.skill_runs_used >= profile.skill_runs_limit) {
      toast.error("Hai raggiunto il limite di skill-run. Rianalizza domani o passa a un piano superiore.");
      return;
    }

    setRegeneratingSection(sectionName);
    const regenStart = Date.now();

    const result = await callRegenerateSection({
      user_id: user.id,
      section: sectionName,
      stato_attuale: section.stato_attuale || "",
      current_rewrite: section.riscrittura || "",
      profile_context: (data.profilo_business || profile.business_profile || {}) as unknown as Record<string, unknown>,
      user_feedback: feedback || undefined,
    });

    const regenDuration = Date.now() - regenStart;

    if (result.ok) {
      const newRewrite = result.data.new_rewrite;
      // Update local output
      const updated = {
        ...data,
        sezioni: data.sezioni.map((s: any) => (s.nome === sectionName ? { ...s, riscrittura: newRewrite } : s)),
      };
      setOutput(updated);

      // Persist to profile
      await updateRawProfileData(updated);

      // v3.4.1 fix (H1): traccia la rigenerazione come skill_run (no scrape).
      // Richiede migration 002_allow_regenerate_skill.sql per allargare il CHECK constraint.
      await logRun({
        skill: "regenerate-section",
        input: { section: sectionName, feedback: feedback || null },
        output: { new_rewrite: newRewrite, variazione_applicata: result.data.variazione_applicata },
        status: "completed",
        is_scrape: false,
        duration_ms: regenDuration,
      });
      await consumeSkillRun(false);

      toast.success(`${sectionName} rigenerata`);
    } else {
      // v3.4.4: stesso cast del blocco sopra (narrowing TS perso con generics)
      const errResult = result as Extract<typeof result, { ok: false }>;
      await logRun({
        skill: "regenerate-section",
        input: { section: sectionName, feedback: feedback || null },
        output: null,
        status: "error",
        is_scrape: false,
        error_message: errResult.error.message,
      });
      toast.error(emberErrorMessage(errResult.error));
    }

    setRegeneratingSection(null);
  };

  const scrapingRemaining = profile ? profile.scrapes_daily_limit - profile.scrapes_used_today : 0;
  // v3.6.1: per prospect-finder/harvest il counter giusto è "searches", non "scrapes".
  // Nota: la pagina è sempre /skill/prospect-finder; harvest è un dirottamento RUNTIME,
  // quindi qui basta matchare 'prospect-finder' (skill.id type union non ha 'harvest').
  const searchesRemaining = profile ? Math.max(profile.searches_daily_limit - profile.searches_used_today, 0) : 0;
  const isProspectSearchSkill = skill?.id === "prospect-finder";

  // Per auto-profile-setup con cache: NON mostrare il form, solo risultato + Rianalizza
  const isAutoProfileWithCache = skill.id === "auto-profile-setup" && loadedFromCache && !forceNewRun;
  // v3.4.3 (P5): stesso comportamento per icp-builder. Se c'è un ICP in DB, nascondi il form e mostra "Rianalizza".
  const isIcpBuilderWithCache = skill.id === "icp-builder" && loadedFromCache && !forceNewRun;
  const showCacheBanner = isAutoProfileWithCache || isIcpBuilderWithCache;
  const hideFormBecauseCache = showCacheBanner;

  const isProspectFinder = skill.id === "prospect-finder";

  return (
    <AppLayout>
      <div
        className={
          isProspectFinder
            ? "max-w-6xl mx-auto grid gap-6 lg:grid-cols-[1fr_320px]"
            : isContentSkill
              ? "max-w-6xl mx-auto grid gap-6 lg:grid-cols-[1fr_300px]"
              : "max-w-3xl mx-auto space-y-6"
        }
      >
        <div className="space-y-6 min-w-0">
        {/* Header */}
        <div className="flex items-start gap-4 animate-in">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <SkillIcon name={skill.icon} className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{skill.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">{skill.description}</p>
          </div>
        </div>

        {/* Form (nascosto se c'è cache: auto-profile-setup o icp-builder) */}
        {!hideFormBecauseCache && (
          <Card className="bg-card/80 border-border/50 backdrop-blur-sm animate-in">
            <CardContent className="p-6">
              <SkillForm skillId={skill.id} onSubmit={handleSubmit} loading={loading} />
              {skill.usesScraping && (
                <p className="text-xs text-warning mt-3 flex items-center gap-1">
                  {isProspectSearchSkill ? (
                    <>
                      Usa 1 search <span className="text-muted-foreground">({searchesRemaining} rimaste oggi)</span>
                    </>
                  ) : (
                    <>
                      Usa 1 credito scraping{" "}
                      <span className="text-muted-foreground">({scrapingRemaining} rimasti oggi)</span>
                    </>
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Banner cache caricata (auto-profile-setup o icp-builder) */}
        {showCacheBanner && (
          <div className="flex items-center justify-between gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 animate-in">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-blue-400 shrink-0" />
              <span>
                {isIcpBuilderWithCache
                  ? "Stai vedendo l'ultimo ICP salvato."
                  : "Stai vedendo l'ultima analisi salvata."}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-border/50 hover:border-primary/50 hover:text-primary"
              onClick={() => navigate(`/skill/${skill.id}?force=1`)}
            >
              <RefreshCw className="h-3 w-3 mr-1.5" />
              {isIcpBuilderWithCache ? "Ricostruisci ICP" : "Rianalizza"}
            </Button>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl p-4 animate-in">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 animate-in">
            <div className="relative inline-block">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="absolute inset-0 h-10 w-10 rounded-full animate-ping bg-primary/10" />
            </div>
            <p className="text-foreground font-medium mt-6">Ember sta lavorando...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tempo stimato: {skill.usesScraping ? "30-60" : "15-30"} secondi
            </p>
          </div>
        )}

        {/* Output */}
        {output && !loading && (
          <Card className="bg-card/80 border-border/50 backdrop-blur-sm animate-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">Risultato</h2>
                </div>
                {/* Rigenera top-level solo per skill NON auto-profile-setup (quella ha rigenera per sezione) */}
                {skill.id !== "auto-profile-setup" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSubmit({})}
                    className="hover:text-primary transition-colors"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> Rigenera
                  </Button>
                )}
              </div>
              <SkillOutput
                skillId={lastEffectiveSkillId || skill.id}
                output={output}
                targetSection={targetSection}
                onRegenerateSection={handleRegenerateSection}
                regeneratingSection={regeneratingSection}
                currentAssetId={assetId}
              />
            </CardContent>
          </Card>
        )}
        </div>

        {/* RIGHT RAIL — solo per prospect-finder */}
        {isProspectFinder && <RecentSearchesRail />}
        {isContentSkill && currentAssetType && <ContentRail type={currentAssetType} />}
      </div>
    </AppLayout>
  );
}

function RecentSearchesRail() {
  const { searches, loading } = useRecentSearches(10);
  return (
    <aside className="lg:sticky lg:top-6 self-start">
      <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HistoryIcon className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Ricerche recenti</h3>
            </div>
            {searches.length > 0 && (
              <Link
                to="/searches"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Vedi tutte
              </Link>
            )}
          </div>

          {loading && (
            <p className="text-xs text-muted-foreground py-3">Caricamento…</p>
          )}

          {!loading && searches.length === 0 && (
            <div className="p-4 rounded-lg border border-dashed border-border/40 text-center">
              <p className="text-xs text-muted-foreground">
                Nessuna ricerca ancora. Falla qui sopra.
              </p>
            </div>
          )}

          {!loading && searches.length > 0 && (
            <div className="space-y-2">
              {searches.map((s) => (
                <Link
                  key={s.id}
                  to={`/skill/prospect-finder?searchId=${s.id}`}
                  className="block p-3 rounded-lg bg-surface/40 border border-border/30 hover:border-primary/40 hover:bg-surface/70 transition-all group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={`${searchSourceColor(s.source)} text-[9px] border`}
                    >
                      {searchSourceLabel(s.source)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                    {searchSummary(s)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {s.prospect_count} prospect
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
