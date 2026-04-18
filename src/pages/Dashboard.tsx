// src/pages/Dashboard.tsx — v3.4: profilo persistente + prima/dopo + deep-link sezione
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { SKILLS } from "@/lib/ember-types";
import { canUseSkill } from "@/lib/ember-types";
import { useProfile } from "@/hooks/useProfile";
import { useSkillRuns } from "@/hooks/useSkillRuns";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuotaBar } from "@/components/QuotaBar";
import { SkillIcon } from "@/components/SkillIcon";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Loader2,
  UserCheck,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Copy,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";

const LAYER_LABELS: Record<string, { title: string; color: string }> = {
  profilo: { title: "Profilo", color: "text-blue-400" },
  content: { title: "Content", color: "text-primary" },
  prospect: { title: "Prospect e Outreach", color: "text-emerald-400" },
};

const LAYER_BADGE_COLORS: Record<string, string> = {
  profilo: "bg-blue-500/15 text-blue-400",
  content: "bg-primary/15 text-primary",
  prospect: "bg-emerald-500/15 text-emerald-400",
};

// ============ helpers ============

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";
  if (score >= 60) return "text-amber-400 border-amber-400/30 bg-amber-400/10";
  if (score >= 40) return "text-orange-400 border-orange-400/30 bg-orange-400/10";
  return "text-destructive border-destructive/30 bg-destructive/10";
}

function CopyInline({ text, label = "Copia" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs hover:text-primary"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Copiato!");
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <CheckCircle className="h-3 w-3 mr-1 text-success" /> : <Copy className="h-3 w-3 mr-1" />}
      {copied ? "Copiato" : label}
    </Button>
  );
}

// ============ MAIN COMPONENT ============

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading, onboardingCompleted } = useProfile();
  const { runs, loading: runsLoading } = useSkillRuns(5);

  useEffect(() => {
    if (!profileLoading && profile && !onboardingCompleted) {
      navigate("/onboarding", { replace: true });
    }
  }, [profileLoading, profile, onboardingCompleted, navigate]);

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) return null;

  const displayName = profile.business_profile?.nome || user?.email?.split("@")[0] || "utente";
  const trialExpired =
    profile.plan === "trial" && profile.trial_ends_at && new Date(profile.trial_ends_at) < new Date();

  // Dati profilo dall'ultima analisi (persistent in profile.raw_profile_data)
  const rawData = profile.raw_profile_data as Record<string, any> | null;
  const hasAnalysis = !!rawData?.score_totale;
  const scoreTotale: number = rawData?.score_totale || 0;
  const livello: string = rawData?.livello || "—";
  const sintesi: string = rawData?.sintesi || "";
  const azioniPrioritarie: string[] = rawData?.azioni_prioritarie || [];
  const sezioni: any[] = rawData?.sezioni || [];

  // Aree da migliorare: score < 70, ordinate ascendenti, top 3
  const areeDaMigliorare = sezioni
    .filter((s) => typeof s.score === "number" && s.score < 70)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  // Prima/Dopo: Headline e About
  const headlineSection = sezioni.find((s) => s.nome === "Headline");
  const aboutSection = sezioni.find((s) => s.nome === "About");

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="animate-in">
          <h1 className="text-2xl font-bold">
            Bentornato,{" "}
            <span className="bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
              {displayName}
            </span>
          </h1>
        </div>

        {/* Quota bars */}
        <div className="grid sm:grid-cols-2 gap-4 animate-in">
          <QuotaBar label="Skill-run" used={profile.skill_runs_used} total={profile.skill_runs_limit} />
          <QuotaBar label="Scraping oggi" used={profile.scrapes_used_today} total={profile.scrapes_daily_limit} />
        </div>

        {/* =============== CARD PROFILO PERSISTENTE =============== */}
        <Card className="bg-card/80 border-border/50 backdrop-blur-sm animate-in">
          <CardContent className="p-6 space-y-5">
            {/* Header card profilo */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                  <UserCheck className="h-5 w-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-base">{profile.business_profile?.nome || "Il tuo profilo"}</h2>
                  {profile.business_profile?.chi_e && (
                    <p className="text-xs text-muted-foreground mt-0.5">{profile.business_profile.chi_e}</p>
                  )}
                  {profile.business_profile?.settore && (
                    <Badge className="mt-2 bg-blue-500/10 text-blue-400 border-0 text-[10px]">
                      {profile.business_profile.settore}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link to="/skill/auto-profile-setup?force=1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border/50 hover:border-primary/50 hover:text-primary"
                  >
                    <RefreshCw className="h-3 w-3 mr-1.5" />
                    Rianalizza
                  </Button>
                </Link>
                {hasAnalysis && (
                  <Link to="/skill/auto-profile-setup">
                    <Button size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground">
                      Vedi analisi completa
                      <ArrowRight className="h-3 w-3 ml-1.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            {/* v3.4.1 fix (B3): mostra la card SOLO se c'è almeno la riscrittura.
    Se anche stato_attuale è presente → layout 2 col (Prima | Dopo).
    Se stato_attuale manca (profili cached pre-v3.4) → solo Dopo + CTA Rianalizza. */}
            {headlineSection?.riscrittura && (
              <div className="pt-4 border-t border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {headlineSection.stato_attuale ? "Headline — prima / dopo" : "Headline — versione suggerita"}
                  </p>
                  <Link
                    to="/skill/auto-profile-setup?section=Headline"
                    className="text-[11px] text-primary hover:text-primary-hover flex items-center gap-1"
                  >
                    Modifica in dettaglio <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                {headlineSection.stato_attuale ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Link
                      to="/skill/auto-profile-setup?section=Headline"
                      className="block p-4 rounded-xl bg-surface/40 border border-border/30 hover:border-border/60 transition-colors"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Prima</p>
                      <p className="text-sm leading-relaxed line-clamp-3">{headlineSection.stato_attuale}</p>
                    </Link>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] uppercase tracking-wider text-primary">Dopo</p>
                        <CopyInline text={headlineSection.riscrittura} />
                      </div>
                      <p className="text-sm leading-relaxed line-clamp-3">{headlineSection.riscrittura}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] uppercase tracking-wider text-primary">Suggerita</p>
                        <CopyInline text={headlineSection.riscrittura} />
                      </div>
                      <p className="text-sm leading-relaxed line-clamp-3">{headlineSection.riscrittura}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Il testo attuale non è stato rilevato.{" "}
                      <Link to="/skill/auto-profile-setup?force=1" className="text-primary hover:underline">
                        Rianalizza
                      </Link>{" "}
                      per abilitare il confronto prima/dopo.
                    </p>
                  </div>
                )}
              </div>
            )}
            {/* Stato: analisi presente → score + livello + sintesi */}
            {hasAnalysis && (
              <>
                <div className="flex items-start gap-5 flex-wrap">
                  <div
                    className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center shrink-0 font-bold text-2xl ${scoreColor(
                      scoreTotale,
                    )}`}
                  >
                    {scoreTotale}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Livello</p>
                    <p className="font-semibold">{livello}</p>
                    {sintesi && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{sintesi}</p>}
                  </div>
                </div>

                {/* Da fare subito */}
                {azioniPrioritarie.length > 0 && (
                  <div className="pt-4 border-t border-border/30">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Da fare subito
                    </p>
                    <div className="space-y-2">
                      {azioniPrioritarie.slice(0, 3).map((a, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <p className="text-sm leading-relaxed">{a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* =========== PRIMA / DOPO — Headline =========== */}
                {headlineSection && (headlineSection.stato_attuale || headlineSection.riscrittura) && (
                  <div className="pt-4 border-t border-border/30">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Headline — prima / dopo
                      </p>
                      <Link
                        to="/skill/auto-profile-setup?section=Headline"
                        className="text-[11px] text-primary hover:text-primary-hover flex items-center gap-1"
                      >
                        Modifica in dettaglio <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Link
                        to="/skill/auto-profile-setup?section=Headline"
                        className="block p-4 rounded-xl bg-surface/40 border border-border/30 hover:border-border/60 transition-colors"
                      >
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Prima</p>
                        <p className="text-sm leading-relaxed line-clamp-3">{headlineSection.stato_attuale || "—"}</p>
                      </Link>
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] uppercase tracking-wider text-primary">Dopo</p>
                          {headlineSection.riscrittura && <CopyInline text={headlineSection.riscrittura} />}
                        </div>
                        <p className="text-sm leading-relaxed line-clamp-3">{headlineSection.riscrittura || "—"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* =========== PRIMA / DOPO — About =========== */}
                {aboutSection && (aboutSection.stato_attuale || aboutSection.riscrittura) && (
                  <div className="pt-4 border-t border-border/30">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        About — prima / dopo
                      </p>
                      <Link
                        to="/skill/auto-profile-setup?section=About"
                        className="text-[11px] text-primary hover:text-primary-hover flex items-center gap-1"
                      >
                        Modifica in dettaglio <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Link
                        to="/skill/auto-profile-setup?section=About"
                        className="block p-4 rounded-xl bg-surface/40 border border-border/30 hover:border-border/60 transition-colors"
                      >
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Prima</p>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap line-clamp-6">
                          {aboutSection.stato_attuale || "—"}
                        </p>
                      </Link>
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] uppercase tracking-wider text-primary">Dopo</p>
                          {aboutSection.riscrittura && <CopyInline text={aboutSection.riscrittura} />}
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap line-clamp-6">
                          {aboutSection.riscrittura || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Aree da migliorare */}
                {areeDaMigliorare.length > 0 && (
                  <div className="pt-4 border-t border-border/30">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Aree da migliorare
                    </p>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {areeDaMigliorare.map((s) => (
                        <Link
                          key={s.nome}
                          to={`/skill/auto-profile-setup?section=${encodeURIComponent(s.nome)}`}
                          className="block"
                        >
                          <div
                            className={`p-4 rounded-xl border transition-all hover:shadow-md ${scoreColor(
                              s.score,
                            )} hover:brightness-110`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold">{s.nome}</span>
                              <span className="text-sm font-bold tabular-nums">{s.score}</span>
                            </div>
                            <p className="text-[11px] opacity-90 line-clamp-2">{s.problema || s.azione}</p>
                            <div className="flex items-center gap-1 mt-2 text-[10px] opacity-80">
                              Vedi dettaglio <ChevronRight className="h-3 w-3" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Trial expired banner */}
        {trialExpired && (
          <div className="flex items-center gap-3 bg-warning/10 border border-warning/30 rounded-xl p-4 animate-in">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Il tuo trial è scaduto.</p>
              <p className="text-xs text-muted-foreground">Scegli un piano per continuare a usare Ember.</p>
            </div>
            <Link to="/settings">
              <Button size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground">
                Vedi piani
              </Button>
            </Link>
          </div>
        )}

        {/* Skill layers */}
        {(["profilo", "content", "prospect"] as const).map((layer) => {
          const layerSkills = SKILLS.filter((s) => s.layer === layer);
          const info = LAYER_LABELS[layer];
          return (
            <div key={layer} className="space-y-3 animate-in">
              <h2 className={`text-lg font-semibold ${info.color}`}>{info.title}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {layerSkills.map((skill, i) => {
                  const check = canUseSkill(profile, skill);
                  return (
                    <Link key={skill.id} to={check.allowed ? `/skill/${skill.id}` : "#"} className="block">
                      <Card
                        className={`bg-card/80 border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all group relative ${
                          !check.allowed ? "opacity-60" : ""
                        }`}
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <SkillIcon name={skill.icon} className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                                {skill.name}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{skill.description}</p>
                            </div>
                          </div>
                          {skill.usesScraping && check.allowed && (
                            <p className="text-[10px] text-warning mt-2">Usa 1 credito scraping</p>
                          )}
                          {!check.allowed && (
                            <Badge className="absolute top-3 right-3 bg-primary/20 text-primary text-[10px] border-0">
                              Pro
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Ultimi risultati */}
        <div className="space-y-3 animate-in">
          <h2 className="text-lg font-semibold">Ultimi risultati</h2>
          {runsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : runs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Nessun risultato ancora. Prova una skill!</p>
          ) : (
            <div className="space-y-2">
              {runs.map((run) => {
                const skill = SKILLS.find((s) => s.id === run.skill);
                const preview = run.output ? JSON.stringify(run.output).slice(0, 80) + "..." : "—";
                return (
                  <Link key={run.id} to={`/skill/${run.skill}`}>
                    <Card className="bg-card/60 border-border/30 hover:border-border transition-all">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Badge className={LAYER_BADGE_COLORS[skill?.layer || "profilo"] + " text-[10px] border-0"}>
                          {skill?.name || run.skill}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(run.created_at), "d MMM, HH:mm", { locale: it })}
                        </span>
                        <span className="text-xs text-muted-foreground flex-1 truncate">{preview}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Segnali placeholder */}
        <div className="space-y-3 animate-in">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Segnali dalla tua rete</h2>
            <Link to="/watchlist" className="text-xs text-primary hover:text-primary-hover transition-colors">
              Vedi tutti
            </Link>
          </div>
          <p className="text-sm text-muted-foreground py-4">
            Aggiungi profili alla watchlist per ricevere segnali su cambi ruolo, promozioni e post virali.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
