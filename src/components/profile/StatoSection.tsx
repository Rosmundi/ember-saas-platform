// src/components/profile/StatoSection.tsx — v3.8.7
// Score + sintesi + top 3 priorità + next actions.
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

function scoreColor(score: number): string {
  if (score >= 80) return "hsl(160 84% 39%)"; // emerald
  if (score >= 60) return "hsl(38 92% 50%)"; // amber
  if (score >= 40) return "hsl(24 95% 53%)"; // orange
  return "hsl(0 84% 60%)"; // red
}

export function StatoSection({ audit }: { audit: any }) {
  if (!audit) {
    return (
      <Card className="bg-card border-border/50">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground italic">
            Nessun audit ancora. Clicca "Aggiorna audit" in alto per iniziare.
          </p>
        </CardContent>
      </Card>
    );
  }

  const score = audit.score_complessivo ?? audit.score_totale ?? 0;
  const color = scoreColor(score);
  const priorita: string[] = audit.priorita_top_3 || audit.azioni_prioritarie || [];
  const nextActions: any[] = audit.next_actions || [];
  const sintesi: string = audit.sintesi || "";
  const livello: string | undefined = audit.livello;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-card border-border/50 md:col-span-1">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
          <div className="text-5xl font-bold tabular-nums" style={{ color }}>
            {score}
          </div>
          <div className="text-sm text-muted-foreground mt-1">/ 100</div>
          {livello && (
            <div className="mt-3 text-sm font-semibold" style={{ color }}>
              {livello}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-primary/30 md:col-span-2">
        <CardContent className="p-6 space-y-3">
          {sintesi && <p className="text-sm leading-relaxed">{sintesi}</p>}
          {priorita.length > 0 && (
            <div className="pt-2 border-t border-border/30">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                Le 3 cose da fare adesso
              </h3>
              <ol className="space-y-1.5">
                {priorita.slice(0, 3).map((p, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                    <span className="leading-relaxed">{p}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {nextActions.length > 0 && (
            <div className="pt-2 border-t border-border/30 flex flex-wrap gap-1.5">
              {nextActions.slice(0, 4).map((na: any, i: number) => (
                <Button
                  key={i}
                  size="sm"
                  variant="ghost"
                  asChild
                  className="h-7 text-xs gap-1"
                >
                  <Link to={na.deeplink || "#"}>
                    {na.azione || na.label || "Azione"}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
