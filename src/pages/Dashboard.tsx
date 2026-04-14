import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuotaBar } from "@/components/QuotaBar";
import { SkillIcon } from "@/components/SkillIcon";
import { SKILLS } from "@/lib/ember-types";
import { mockProfile, mockSkillRuns, mockSignals } from "@/lib/mock-data";
import { AlertTriangle, ChevronRight, Eye, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const layerColors: Record<string, string> = {
  profilo: 'text-layer-profilo',
  content: 'text-layer-content',
  prospect: 'text-layer-prospect',
};

const layerGradients: Record<string, string> = {
  profilo: 'from-layer-profilo/10 to-transparent',
  content: 'from-layer-content/10 to-transparent',
  prospect: 'from-layer-prospect/10 to-transparent',
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
        <div className="animate-in">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm text-primary font-medium">Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold">
            Bentornato, <span className="bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent">{nome}</span>
          </h1>
        </div>

        {/* Quota bars */}
        <div className="grid sm:grid-cols-2 gap-4 animate-in animate-in-delay-1">
          <QuotaBar label="Skill-run" used={profile.skill_runs_used} total={profile.skill_runs_limit} />
          <QuotaBar label="Scraping oggi" used={profile.scrapes_used_today} total={profile.scrapes_daily_limit} />
        </div>

        {/* Trial banner */}
        {trialExpired && (
          <div className="bg-warning/5 border border-warning/20 rounded-xl p-5 flex items-center gap-4 animate-in animate-in-delay-2 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Il tuo trial è scaduto</p>
              <p className="text-xs text-muted-foreground mt-0.5">Scegli un piano per continuare a usare tutte le skill.</p>
            </div>
            <Button size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/20">
              Vedi piani
            </Button>
          </div>
        )}

        {/* Skill sections */}
        {layerSections.map(({ title, layer }, sectionIdx) => {
          const skills = SKILLS.filter(s => s.layer === layer);
          return (
            <div key={layer} className="animate-in" style={{ animationDelay: `${(sectionIdx + 2) * 100}ms` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${layerGradients[layer]} ${layerColors[layer]}`} 
                  style={{ backgroundColor: 'currentColor', opacity: 0.5 }} />
                <h2 className="text-xl font-bold">{title}</h2>
              </div>
              <div className={`grid sm:grid-cols-2 ${layer === 'prospect' ? 'lg:grid-cols-3' : ''} gap-4`}>
                {skills.map((skill, i) => {
                  const available = skill.plans.includes(profile.plan);
                  return (
                    <Link to={`/skill/${skill.id}`} key={skill.id}>
                      <Card className={`glow-card bg-card border-border/50 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer relative group ${!available ? 'opacity-50' : ''}`}
                        style={{ animationDelay: `${i * 80}ms` }}>
                        {!available && (
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
                              {skill.usesScraping && available && (
                                <Badge variant="outline" className="mt-2 text-[10px] border-warning/30 text-warning">
                                  ⚡ Usa 1 credito scraping
                                </Badge>
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
        <div className="animate-in" style={{ animationDelay: '500ms' }}>
          <h2 className="text-xl font-bold mb-4">Ultimi risultati</h2>
          {mockSkillRuns.length > 0 ? (
            <div className="space-y-2">
              {mockSkillRuns.slice(0, 5).map((run, i) => {
                const skill = SKILLS.find(s => s.id === run.skill);
                const preview = run.output ? JSON.stringify(run.output).slice(0, 80) : '';
                return (
                  <Card key={run.id} className="bg-card/60 border-border/50 hover:bg-card hover:border-border transition-all duration-200 group"
                    style={{ animationDelay: `${(i + 5) * 60}ms` }}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <Badge variant="outline" className={`text-[10px] ${layerColors[skill?.layer || 'profilo']} border-current/30`}>
                        {skill?.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {format(new Date(run.created_at), 'd MMM HH:mm', { locale: it })}
                      </span>
                      <p className="text-xs text-muted-foreground flex-1 truncate">{preview}…</p>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="h-3 w-3 mr-1" /> Vedi
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-card/30 rounded-xl border border-dashed border-border/50">
              <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nessun risultato ancora. Prova una skill!</p>
            </div>
          )}
        </div>

        {/* Segnali dalla rete */}
        {mockSignals.length > 0 && (
          <div className="animate-in" style={{ animationDelay: '600ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Segnali dalla tua rete</h2>
              <Link to="/watchlist" className="text-sm text-primary hover:text-primary-hover flex items-center gap-1 transition-colors group">
                Vedi tutti <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="space-y-2">
              {mockSignals.slice(0, 3).map((signal, i) => (
                <Card key={i} className="bg-card/60 border-border/50 hover:bg-card hover:border-border transition-all duration-200 group">
                  <CardContent className="p-4 flex items-center gap-3">
                    <span className="font-medium text-sm whitespace-nowrap">{signal.nome}</span>
                    <Badge className={`text-[10px] ${signalTypeColors[signal.type] || 'bg-muted text-muted-foreground'}`}>
                      {signal.type.replace('_', ' ')}
                    </Badge>
                    <p className="text-xs text-muted-foreground flex-1 truncate">{signal.detail}</p>
                    <p className="text-xs text-primary whitespace-nowrap opacity-70 group-hover:opacity-100 transition-opacity">{signal.action}</p>
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
