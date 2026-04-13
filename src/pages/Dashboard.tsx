import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuotaBar } from "@/components/QuotaBar";
import { SkillIcon } from "@/components/SkillIcon";
import { SKILLS } from "@/lib/ember-types";
import { mockProfile, mockSkillRuns, mockSignals } from "@/lib/mock-data";
import { AlertTriangle, ChevronRight, Eye } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const layerColors: Record<string, string> = {
  profilo: 'text-layer-profilo',
  content: 'text-layer-content',
  prospect: 'text-layer-prospect',
};

const layerSections = [
  { title: "Profilo", layer: 'profilo' as const },
  { title: "Content", layer: 'content' as const },
  { title: "Prospect e Outreach", layer: 'prospect' as const },
];

const signalTypeColors: Record<string, string> = {
  promozione: 'bg-layer-profilo/20 text-layer-profilo',
  post_virale: 'bg-primary/20 text-primary',
  nuovo_ruolo: 'bg-success/20 text-success',
};

export default function Dashboard() {
  const profile = mockProfile;
  const nome = profile.business_profile?.nome?.split(' ')[0] || 'Utente';
  const trialExpired = new Date(profile.trial_ends_at) < new Date() && profile.plan === 'trial';

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Bentornato, {nome}</h1>
        </div>

        {/* Quota bars */}
        <div className="grid sm:grid-cols-2 gap-4">
          <QuotaBar label="Skill-run" used={profile.skill_runs_used} total={profile.skill_runs_limit} />
          <QuotaBar label="Scraping oggi" used={profile.scrapes_used_today} total={profile.scrapes_daily_limit} />
        </div>

        {/* Trial banner */}
        {trialExpired && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm flex-1">Il tuo trial è scaduto. Scegli un piano per continuare.</p>
            <Button size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground">Vedi piani</Button>
          </div>
        )}

        {/* Skill sections */}
        {layerSections.map(({ title, layer }) => {
          const skills = SKILLS.filter(s => s.layer === layer);
          return (
            <div key={layer}>
              <h2 className="text-xl font-bold mb-4">{title}</h2>
              <div className={`grid sm:grid-cols-2 ${layer === 'prospect' ? 'lg:grid-cols-3' : ''} gap-4`}>
                {skills.map((skill) => {
                  const available = skill.plans.includes(profile.plan);
                  return (
                    <Link to={`/skill/${skill.id}`} key={skill.id}>
                      <Card className={`bg-card border-border hover:border-primary hover:shadow-lg transition-all cursor-pointer relative ${!available ? 'opacity-60' : ''}`}>
                        {!available && (
                          <div className="absolute inset-0 bg-background/40 rounded-lg z-10 flex items-center justify-center">
                            <Badge className="bg-primary text-primary-foreground">Pro</Badge>
                          </div>
                        )}
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <SkillIcon name={skill.icon} className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm">{skill.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1">{skill.description}</p>
                              {skill.usesScraping && available && (
                                <Badge variant="outline" className="mt-2 text-[10px] border-warning/30 text-warning">
                                  Usa 1 credito scraping
                                </Badge>
                              )}
                            </div>
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
          {mockSkillRuns.length > 0 ? (
            <div className="space-y-2">
              {mockSkillRuns.slice(0, 5).map((run) => {
                const skill = SKILLS.find(s => s.id === run.skill);
                const preview = run.output ? JSON.stringify(run.output).slice(0, 80) : '';
                return (
                  <Card key={run.id} className="bg-card border-border">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Badge variant="outline" className={`text-[10px] ${layerColors[skill?.layer || 'profilo']} border-current`}>
                        {skill?.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(run.created_at), 'd MMM HH:mm', { locale: it })}
                      </span>
                      <p className="text-xs text-muted-foreground flex-1 truncate">{preview}…</p>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3 w-3 mr-1" /> Vedi
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Nessun risultato ancora. Prova una skill!</p>
          )}
        </div>

        {/* Segnali dalla rete */}
        {mockSignals.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Segnali dalla tua rete</h2>
              <Link to="/watchlist" className="text-sm text-primary hover:underline flex items-center">
                Vedi tutti <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-2">
              {mockSignals.slice(0, 3).map((signal, i) => (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="p-4 flex items-center gap-3">
                    <span className="font-medium text-sm whitespace-nowrap">{signal.nome}</span>
                    <Badge className={`text-[10px] ${signalTypeColors[signal.type] || 'bg-muted text-muted-foreground'}`}>
                      {signal.type.replace('_', ' ')}
                    </Badge>
                    <p className="text-xs text-muted-foreground flex-1 truncate">{signal.detail}</p>
                    <p className="text-xs text-primary whitespace-nowrap">{signal.action}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
