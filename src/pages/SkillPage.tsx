// src/pages/SkillPage.tsx — v3.4: cache analisi profilo + deep-link sezione + rigenera per sezione
import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { SKILLS, canUseSkill } from "@/lib/ember-types";
import { callSkill, callRegenerateSection, emberErrorMessage } from "@/lib/ember-api";
import { useProfile } from "@/hooks/useProfile";
import { useSkillRuns } from "@/hooks/useSkillRuns";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkillIcon } from "@/components/SkillIcon";
import { ScoreBadge } from "@/components/ScoreBadge";
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
} from "lucide-react";
import { toast } from "sonner";

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
      return { profilo_business: bp, obiettivo: values.obiettivo || "attrarre clienti B2B" };
    case "post-writer":
      return { profilo_business: bp, tema: values.brief, formato: (values.format || "storytelling").toLowerCase() };
    case "visual-post-builder":
      return { post_text: values.post, formato_visual: (values.style || "carousel").toLowerCase() };
    case "content-performance":
      return { posts: [], periodo: "30d" };
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

// ============ SKILL OUTPUT DISPATCHER ============

function SkillOutput({
  skillId,
  output,
  targetSection,
  onRegenerateSection,
  regeneratingSection,
}: {
  skillId: string;
  output: Record<string, unknown>;
  targetSection: string | null;
  onRegenerateSection: (sectionName: string, feedback: string) => Promise<void>;
  regeneratingSection: string | null;
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
    const hook = data.hook || data.post_text?.split("\n")[0] || "";
    const body = data.body || data.post_text || "";
    const cta = data.cta || "";
    const hashtags = data.hashtags || [];
    return (
      <div className="space-y-4 animate-in">
        <div className="border-l-4 border-primary bg-primary/5 p-5 rounded-r-xl">
          <p className="font-bold text-lg whitespace-pre-wrap leading-relaxed">{hook}</p>
        </div>
        <div className="text-sm whitespace-pre-wrap leading-relaxed px-1">{body}</div>
        {cta && (
          <div className="bg-primary/5 border border-primary/20 p-5 rounded-xl">
            <p className="text-sm whitespace-pre-wrap">{cta}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {hashtags.map((h: string) => (
            <Badge key={h} variant="outline" className="border-border/50">
              {h}
            </Badge>
          ))}
        </div>
        {data.alt_hook && (
          <details className="text-sm group">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              Hook alternativo
            </summary>
            <p className="mt-2 whitespace-pre-wrap bg-surface/50 p-4 rounded-xl border border-border/30 animate-in">
              {data.alt_hook}
            </p>
          </details>
        )}
        {(data.best_time || data.estimated_read_time_sec) && (
          <p className="text-xs text-muted-foreground">
            ⏰{" "}
            {data.best_time
              ? `Orario suggerito: ${data.best_time}`
              : `Tempo lettura: ~${data.estimated_read_time_sec}s`}
          </p>
        )}
        <div className="flex gap-2 pt-2">
          <CopyButton text={[hook, body, cta, hashtags.join(" ")].filter(Boolean).join("\n\n")} />
          <Link to={`/skill/visual-post-builder?post=${encodeURIComponent(hook + "\n" + body)}`}>
            <Button
              variant="outline"
              size="sm"
              className="border-border/50 hover:border-primary/50 hover:text-primary transition-all"
            >
              Crea visual <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (skillId === "visual-post-builder") {
    return (
      <div className="space-y-5 animate-in">
        {(data.canva_query || data.cover_slide) && (
          <div>
            <h3 className="font-semibold mb-3">Struttura Visual</h3>
            {data.cover_slide && (
              <div className="bg-surface/50 border border-border/30 rounded-xl p-4 mb-2">
                <p className="text-sm font-medium">{data.cover_slide.title}</p>
                <p className="text-xs text-muted-foreground">{data.cover_slide.body}</p>
              </div>
            )}
            {data.slide_content?.map((s: any, i: number) => (
              <div key={i} className="bg-surface/50 border border-border/30 rounded-xl p-4 mb-2">
                <p className="text-sm">
                  <span className="text-primary mr-2">{i + 1}.</span>
                  {s.title || s}
                </p>
                {s.body && <p className="text-xs text-muted-foreground mt-1">{s.body}</p>}
              </div>
            ))}
            {data.cta_slide && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="text-sm font-medium">{data.cta_slide.title}</p>
                <p className="text-xs text-muted-foreground">{data.cta_slide.cta_text}</p>
              </div>
            )}
          </div>
        )}
        {data.midjourney_prompt && (
          <div>
            <h3 className="font-semibold mb-3">AI Image Prompt</h3>
            <div className="bg-surface/50 border border-border/30 rounded-xl p-4">
              <p className="text-sm font-mono">{data.midjourney_prompt}</p>
              <div className="mt-2">
                <CopyButton text={data.midjourney_prompt} />
              </div>
            </div>
          </div>
        )}
        {data.palette && (
          <div>
            <h3 className="font-semibold mb-3">Palette</h3>
            <div className="flex gap-3">
              {data.palette.map((c: string) => (
                <div key={c} className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg shadow-inner" style={{ background: c }} />
                  <span className="text-xs font-mono text-muted-foreground">{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (skillId === "content-performance") {
    return (
      <div className="space-y-5 animate-in">
        {data.score != null && (
          <div className="text-center py-2">
            <ScoreBadge score={data.score} size="lg" className="mx-auto" />
          </div>
        )}
        {data.patterns && (
          <div className="grid sm:grid-cols-3 gap-3">
            {Object.entries(data.patterns).map(([k, v]) => (
              <Card key={k} className="bg-surface/50 border-border/30">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{k.replace(/_/g, " ")}</p>
                  <p className="text-sm font-medium">{String(v)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {data.recommendations && (
          <div>
            <h3 className="font-semibold text-sm mb-2">Raccomandazioni</h3>
            {data.recommendations.map((r: string, i: number) => (
              <p key={i} className="text-sm text-muted-foreground mb-1 flex items-start gap-2">
                <span className="text-primary">{i + 1}.</span>
                {typeof r === "string" ? r : JSON.stringify(r)}
              </p>
            ))}
          </div>
        )}
        {data.next_30d_plan && (
          <div>
            <h3 className="font-semibold text-sm mb-2">Piano prossimi 30 giorni</h3>
            {data.next_30d_plan.map((a: string, i: number) => (
              <p key={i} className="text-sm text-muted-foreground mb-1">
                → {typeof a === "string" ? a : JSON.stringify(a)}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (skillId === "icp-builder") {
    return (
      <div className="space-y-5 animate-in">
        {data.icp && (
          <Card className="bg-surface/50 border-border/30">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4">ICP Card</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(data.icp).map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg bg-background/30">
                    <span className="text-muted-foreground capitalize text-xs block mb-0.5">
                      {k.replace(/_/g, " ")}
                    </span>
                    <span className="font-medium text-sm">
                      {Array.isArray(v) ? (v as string[]).join(", ") : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {data.linkedin_search_query && (
          <div>
            <h3 className="font-semibold mb-2">Sales Navigator Query</h3>
            <div className="bg-surface/50 border border-border/30 rounded-xl p-4 font-mono text-sm">
              {data.linkedin_search_query}
              <div className="mt-2">
                <CopyButton text={data.linkedin_search_query} />
              </div>
            </div>
          </div>
        )}
        {data.buyer_personas && (
          <div>
            <h3 className="font-semibold mb-2">Buyer Personas</h3>
            {data.buyer_personas.map((bp: any, i: number) => (
              <div key={i} className="bg-surface/50 border border-border/30 rounded-xl p-4 mb-2">
                <pre className="text-sm whitespace-pre-wrap">
                  {typeof bp === "string" ? bp : JSON.stringify(bp, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
        <Link to={`/skill/prospect-finder?icp=${encodeURIComponent(JSON.stringify(data.icp || {}))}`}>
          <Button className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/20">
            Cerca prospect con questo ICP <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
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
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    if (skillId === "visual-post-builder") init.post = searchParams.get("post") || "";
    if (skillId === "prospect-finder") {
      const icp = searchParams.get("icp");
      if (icp) init.query = icp;
    }
    if (skillId === "outreach-drafter") {
      init.nome = searchParams.get("nome") || "";
      init.headline = searchParams.get("headline") || "";
      init.azienda = searchParams.get("azienda") || "";
    }
    return init;
  });

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
        <Textarea
          placeholder="Descrivi il post che vuoi scrivere..."
          value={values.brief || ""}
          onChange={(e) => set("brief", e.target.value)}
          className="bg-surface border-border/50 focus:border-primary transition-colors"
          rows={4}
        />
        <Select value={values.format || "Storytelling"} onValueChange={(v) => set("format", v)}>
          <SelectTrigger className="bg-surface border-border/50">
            <SelectValue placeholder="Formato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Storytelling">Storytelling</SelectItem>
            <SelectItem value="Insight">Insight</SelectItem>
            <SelectItem value="Case Study">Case Study</SelectItem>
            <SelectItem value="Polarizzante">Polarizzante</SelectItem>
          </SelectContent>
        </Select>
        {submitBtn}
      </div>
    );
  }
  if (skillId === "visual-post-builder") {
    return (
      <div className="space-y-4">
        <Textarea
          placeholder="Incolla il testo del post..."
          value={values.post || ""}
          onChange={(e) => set("post", e.target.value)}
          className="bg-surface border-border/50 focus:border-primary transition-colors"
          rows={4}
        />
        <Select value={values.style || "Minimal"} onValueChange={(v) => set("style", v)}>
          <SelectTrigger className="bg-surface border-border/50">
            <SelectValue placeholder="Stile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Minimal">Minimal</SelectItem>
            <SelectItem value="Bold">Bold</SelectItem>
            <SelectItem value="Data Viz">Data Viz</SelectItem>
            <SelectItem value="Storytelling">Storytelling</SelectItem>
          </SelectContent>
        </Select>
        {submitBtn}
      </div>
    );
  }
  if (skillId === "content-performance") {
    return (
      <Button
        onClick={() => onSubmit(values)}
        disabled={loading}
        className="w-full bg-primary hover:bg-primary-hover text-primary-foreground h-11 shadow-lg shadow-primary/20"
      >
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}{" "}
        {loading ? "Analisi..." : "Analizza i miei post"}
      </Button>
    );
  }
  if (skillId === "icp-builder") {
    return (
      <div className="space-y-4">
        <Textarea
          placeholder="Descrivi il tuo cliente ideale..."
          value={values.description || ""}
          onChange={(e) => set("description", e.target.value)}
          className="bg-surface border-border/50 focus:border-primary transition-colors"
          rows={4}
        />
        {submitBtn}
      </div>
    );
  }
  if (skillId === "prospect-finder") {
    return (
      <div className="space-y-4">
        <Input
          placeholder="URL LinkedIn del prospect"
          value={values.url || ""}
          onChange={(e) => set("url", e.target.value)}
          className="bg-surface border-border/50 focus:border-primary h-11"
        />
        <Textarea
          placeholder="Descrizione ICP o contesto (opzionale)"
          value={values.query || ""}
          onChange={(e) => set("query", e.target.value)}
          className="bg-surface border-border/50 focus:border-primary transition-colors"
          rows={2}
        />
        {submitBtn}
      </div>
    );
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

  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [loadedFromCache, setLoadedFromCache] = useState(false);

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

    const payload = buildPayload(
      skill.id,
      formValues,
      profile.business_profile as Record<string, unknown> | null,
      user.id,
    );
    const result = await callSkill(skill.id, payload);

    if (result.ok) {
      setOutput(result.data as Record<string, unknown>);
      await logRun({
        skill: skill.id,
        input: payload,
        output: result.data as Record<string, unknown>,
        status: "completed",
        is_scrape: skill.usesScraping,
        duration_ms: result.duration_ms,
      });
      await consumeSkillRun(skill.usesScraping);

      // Persist auto-profile-setup analysis on profile
      // v3.4.1 fix (B2): NON sovrascrivere business_profile (ha campi custom da Onboarding:
      // tone_of_voice, value_proposition, punti_forza, tags) con il sotto-set di 5 campi
      // restituito dal prompt. Salviamo solo raw_profile_data e, se cambiato, linkedin_url.
      if (skill.id === "auto-profile-setup") {
        const data = result.data as any;
        if (data?.score_totale) {
          await updateRawProfileData(data);
          const newUrl = formValues.url?.trim();
          if (newUrl && newUrl !== profile.linkedin_url) {
            await updateProfile({ linkedin_url: newUrl });
          }
        }
      }

      toast.success(`${skill.name} completata in ${(result.duration_ms / 1000).toFixed(1)}s`);
    } else {
      const msg = emberErrorMessage(result.error);
      setError(msg);
      toast.error(msg);
      await logRun({
        skill: skill.id,
        input: payload,
        output: null,
        status: "error",
        is_scrape: false,
        error_message: result.error.message,
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

    setRegeneratingSection(sectionName);

    const result = await callRegenerateSection({
      user_id: user.id,
      section: sectionName,
      stato_attuale: section.stato_attuale || "",
      current_rewrite: section.riscrittura || "",
      profile_context: (data.profilo_business || profile.business_profile || {}) as Record<string, unknown>,
      user_feedback: feedback || undefined,
    });

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

      toast.success(`${sectionName} rigenerata`);
    } else {
      toast.error(emberErrorMessage(result.error));
    }

    setRegeneratingSection(null);
  };

  const scrapingRemaining = profile ? profile.scrapes_daily_limit - profile.scrapes_used_today : 0;

  // Per auto-profile-setup con cache: NON mostrare il form, solo risultato + Rianalizza
  const isAutoProfileWithCache = skill.id === "auto-profile-setup" && loadedFromCache && !forceNewRun;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
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

        {/* Form (nascosto se c'è cache per auto-profile-setup) */}
        {!isAutoProfileWithCache && (
          <Card className="bg-card/80 border-border/50 backdrop-blur-sm animate-in">
            <CardContent className="p-6">
              <SkillForm skillId={skill.id} onSubmit={handleSubmit} loading={loading} />
              {skill.usesScraping && (
                <p className="text-xs text-warning mt-3 flex items-center gap-1">
                  Usa 1 credito scraping{" "}
                  <span className="text-muted-foreground">({scrapingRemaining} rimasti oggi)</span>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Banner cache caricata */}
        {isAutoProfileWithCache && (
          <div className="flex items-center justify-between gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 animate-in">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Stai vedendo l'ultima analisi salvata.</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-border/50 hover:border-primary/50 hover:text-primary"
              onClick={() => navigate(`/skill/${skill.id}?force=1`)}
            >
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Rianalizza
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
                skillId={skill.id}
                output={output}
                targetSection={targetSection}
                onRegenerateSection={handleRegenerateSection}
                regeneratingSection={regeneratingSection}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
