import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SKILLS } from "@/lib/ember-types";
import { mockSkillRuns } from "@/lib/mock-data";
import { Copy, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";

const layerBadgeColors: Record<string, string> = {
  profilo: 'bg-layer-profilo/20 text-layer-profilo',
  content: 'bg-layer-content/20 text-layer-content',
  prospect: 'bg-layer-prospect/20 text-layer-prospect',
};

export default function History() {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const runs = filter === 'all' ? mockSkillRuns : mockSkillRuns.filter(r => r.skill === filter);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Cronologia</h1>

        <div className="flex gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px] bg-surface border-border"><SelectValue placeholder="Tutte le skill" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le skill</SelectItem>
              {SKILLS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {runs.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Nessun risultato. Prova una skill dalla dashboard!</p>
        ) : (
          <div className="space-y-2">
            {runs.map((run) => {
              const skill = SKILLS.find(s => s.id === run.skill);
              const isExpanded = expanded === run.id;
              const inputPreview = JSON.stringify(run.input).slice(0, 60);
              const outputPreview = run.output ? JSON.stringify(run.output).slice(0, 80) : '';
              return (
                <Card key={run.id} className="bg-card border-border cursor-pointer" onClick={() => setExpanded(isExpanded ? null : run.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Badge className={`text-[10px] ${layerBadgeColors[skill?.layer || 'profilo']}`}>{skill?.name}</Badge>
                      {run.is_scrape && <Badge variant="outline" className="text-[10px] border-warning/30 text-warning">Scraping</Badge>}
                      <span className="text-xs text-muted-foreground">{format(new Date(run.created_at), 'd MMM yyyy, HH:mm', { locale: it })}</span>
                      <p className="text-xs text-muted-foreground flex-1 truncate">{inputPreview}</p>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    {!isExpanded && outputPreview && <p className="text-xs text-muted-foreground mt-2 truncate">{outputPreview}…</p>}
                    {isExpanded && run.output && (
                      <div className="mt-4 bg-surface rounded-lg p-4 border border-border">
                        <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(run.output, null, 2)}</pre>
                        <div className="flex gap-2 mt-3">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(JSON.stringify(run.output, null, 2)); toast.success("Copiato!"); }}>
                            <Copy className="h-3 w-3 mr-1" /> Copia
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
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
