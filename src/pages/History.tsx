import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SKILLS } from "@/lib/ember-types";
import { useSkillRuns } from "@/hooks/useSkillRuns";
import { Copy, RefreshCw, ChevronDown, ChevronUp, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";

const layerBadgeColors: Record<string, string> = {
  profilo: 'bg-layer-profilo/15 text-layer-profilo',
  content: 'bg-layer-content/15 text-layer-content',
  prospect: 'bg-layer-prospect/15 text-layer-prospect',
};

export default function History() {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const { runs: allRuns, loading } = useSkillRuns(50);

  const runs = filter === 'all' ? allRuns : allRuns.filter(r => r.skill === filter);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between animate-in">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Cronologia</span>
            </div>
            <h1 className="text-2xl font-bold">I tuoi risultati</h1>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px] bg-card/60 border-border/50 backdrop-blur-sm">
              <SelectValue placeholder="Tutte le skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le skill</SelectItem>
              {SKILLS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-16 bg-card/30 rounded-xl border border-dashed border-border/50 animate-in">
            <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nessun risultato. Prova una skill dalla dashboard!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {runs.map((run, i) => {
              const skill = SKILLS.find(s => s.id === run.skill);
              const isExp = expanded === run.id;
              const inputPreview = JSON.stringify(run.input).slice(0, 60);
              const outputPreview = run.output ? JSON.stringify(run.output).slice(0, 80) : '';
              return (
                <Card key={run.id}
                  className={`border-border/50 cursor-pointer transition-all duration-300 group ${isExp ? 'bg-card border-border shadow-lg' : 'bg-card/60 hover:bg-card hover:border-border'}`}
                  onClick={() => setExpanded(isExp ? null : run.id)}
                  style={{ animationDelay: `${i * 50}ms` }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Badge className={`text-[10px] ${layerBadgeColors[skill?.layer || 'profilo']}`}>{skill?.name || run.skill}</Badge>
                      {run.is_scrape && <Badge variant="outline" className="text-[10px] border-warning/30 text-warning">⚡ Scraping</Badge>}
                      <span className="text-xs text-muted-foreground tabular-nums">{format(new Date(run.created_at), 'd MMM yyyy, HH:mm', { locale: it })}</span>
                      <p className="text-xs text-muted-foreground flex-1 truncate">{inputPreview}</p>
                      <div className={`transition-transform duration-200 ${isExp ? 'rotate-180' : ''}`}>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    {!isExp && outputPreview && <p className="text-xs text-muted-foreground mt-2 truncate">{outputPreview}…</p>}
                    {isExp && run.output && (
                      <div className="mt-4 bg-surface/50 rounded-xl p-4 border border-border/30 animate-in">
                        <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(run.output, null, 2)}</pre>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-border/20">
                          <Button variant="ghost" size="sm" className="hover:text-primary" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(JSON.stringify(run.output, null, 2)); toast.success("Copiato!"); }}>
                            <Copy className="h-3 w-3 mr-1" /> Copia
                          </Button>
                          <Button variant="ghost" size="sm" className="hover:text-primary" onClick={(e) => e.stopPropagation()}>
                            <RefreshCw className="h-3 w-3 mr-1" /> Rigenera
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}