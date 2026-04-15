// src/pages/Dashboard.tsx — versione REALE (dati da Supabase)
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { SKILLS, canUseSkill } from "@/lib/ember-types";
import { useProfile } from "@/hooks/useProfile";
import { useSkillRuns } from "@/hooks/useSkillRuns";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuotaBar } from "@/components/QuotaBar";
import { SkillIcon } from "@/components/SkillIcon";
import { AlertTriangle, ChevronRight, Clock, Loader2, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading, onboardingCompleted } = useProfile();
  const { runs, loading: runsLoading } = useSkillRuns(5);

  // Redirect a onboarding se profilo non completato
  useEffect(() => {
    if (!profileLoading && profile && !onboardingCompleted) {
      navigate("/onboarding", { replace: true });
    }
  }, [profileLoading, profile, onboardingCompleted, navigate]);

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) return null;

  const displayName = profile.business_profile?.nome || user?.email?.split("@")[0] || "utente";
  const trialExpired = profile.plan === "trial" && profile.trial_ends_at && new Date(profile.trial_ends_at) < new Date();

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-in">
          <h1 className="text-3xl font-bold">
            Bentornato, <span className="bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent">{displayName}</span>
          </h1>
        </div>

        {/* Quota bars */}
        <div className="grid sm:grid-cols-2 gap-4">
          <QuotaBar label="Skill-run" used={profile.skill_runs_used} total={profile.skill_runs_limit} />
          <QuotaBar label="Scraping oggi" used={profile.scrapes_used_today} total={profile.scrapes_daily_limit} />
        </div>

        {/* Profilo fisso */}
        {profile.business_profile && (
          <Card className="bg-card/80 border-border/50 animate-in">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <UserCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{(profile.business_profile as any).nome || "Il tuo profilo"}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{(profile.business_profile as any).chi_e || (profile.business_profile as any).headline || ""}</p>
                    {(profile.business_profile as any).settore && (
                      <Badge className="bg-primary/10 text-primary border-0 mt-2 text-xs">{(profile.business_profile as any).settore}</Badge>
                    )}
                  </div>
                </div>
                <Link to="/skill/auto-profile-setup">
                  <Button variant="ghost" size="sm" className="hover:text-primary transition-colors text-xs">
                    Rianalizza <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
              {profile.raw_profile_data?.score_totale != null && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/30">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                    (profile.raw_profile_data.score_totale as number) >= 70 ? 'bg-emerald-500/15 text-emerald-400' :
                    (profile.raw_profile_data.score_totale as number) >= 50 ? 'bg-amber-500/15 text-amber-400' :
                    'bg-destructive/15 text-destructive'
                  }`}>
                    {profile.raw_profile_data.score_totale as number}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium">LinkedIn Score</p>
                    <p className="text-xs text-muted-foreground">{(profile.raw_profile_data.livello as string) || ""} — {profile.raw_profile_data.sintesi ? (profile.raw_profile_data.sintesi as string).slice(0, 100) + "..." : "Analizza il profilo per vedere il dettaglio"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Trial expired banner */}
        {trialExpired && (
          <div className="bg-warning/5 border border-warning/20 rounded-xl p-5 flex items-center gap-4 backdrop-blur-sm">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Il tuo trial è scaduto.</p>
              <p className="text-xs text-muted-foreground mt-0.5">Scegli un piano per continuare a usare Ember.</p>
            </div>
            <div>
              <Button size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/20">
                Vedi piani
              </Button>
            </div>
          </div>
        )}

        {/* Skill layers */}
        {(["profilo", "content", "prospect"] as const).map(layer => {
          const layerSkills = SKILLS.filter(s => s.layer === layer);
          const info = LAYER_LABELS[layer];
          return (
            <div key={layer}>
              <h2 className={`text-xl font-bold mb-4 ${info.color}`}>{info.title}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {layerSkills.map((skill) => {
                  const check = canUseSkill(profile, skill);
                  return (
                    <Link to={`/skill/${skill.id}`} key={skill.id}>
                      <Card className={`bg-card border-border/50 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer relative group ${!check.allowed ? 'opacity-50' : ''}`}>
                        {!check.allowed && (
                          <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] rounded-xl z-10 flex items-center justify-center">
                            <Badge className="bg-primary/90 text-primary-foreground shadow-lg">Pro</Badge>
                          </div>
                        )}
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                              <SkillIcon name={skill.icon} className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{skill.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{skill.description}</p>
                              {skill.usesScraping && check.allowed && (
                                <p className="text-[10px] text-warning mt-2">⚡ Usa 1 credito scraping</p>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all duration-300 shrink-0 mt-1" />
                          </div>
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
        <div>
          <h2 className="text-xl font-bold mb-4">Ultimi risultati</h2>
          {runsLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : runs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nessun risultato ancora. Prova una skill!</p>
          ) : (
            <div className="space-y-2">
              {runs.map(run => {
                const skill = SKILLS.find(s => s.id === run.skill);
                const preview = run.output ? JSON.stringify(run.output).slice(0, 80) + "..." : "—";
                return (
                  <Card key={run.id} className="bg-card/60 border-border/50 hover:bg-card transition-all duration-200">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px]">
                        {skill?.name || run.skill}
                      </Badge>
                      <span className="text-xs text-muted-foreground tabular-nums flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(run.created_at), "d MMM, HH:mm", { locale: it })}
                      </span>
                      <p className="text-xs text-muted-foreground flex-1 truncate">{preview}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Segnali placeholder */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Segnali dalla tua rete</h2>
            <Link to="/watchlist" className="text-sm text-primary hover:text-primary-hover flex items-center gap-1 transition-colors">
              Vedi tutti <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="text-muted-foreground text-sm">
            Aggiungi profili alla watchlist per ricevere segnali su cambi ruolo, promozioni e post virali.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
