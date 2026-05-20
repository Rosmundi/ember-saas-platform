// src/components/profile/StatoSection.tsx — v3.8.9
// Score radiale + sintesi + top 3 priorità + next actions.
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

function scoreColor(score: number): string {
  if (score >= 80) return "hsl(160 84% 39%)"; // emerald
  if (score >= 60) return "hsl(38 92% 50%)"; // amber
  if (score >= 40) return "hsl(24 95% 53%)"; // orange
  return "hsl(0 84% 60%)"; // red
}

function scoreLevel(score: number): string {
  if (score >= 80) return "Eccellente";
  if (score >= 60) return "Buono";
  if (score >= 40) return "Intermedio";
  return "Da migliorare";
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 58;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="hsl(var(--border))"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          opacity={0.3}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          style={{
            strokeDashoffset: offset,
            transition: "stroke-dashoffset 0.8s ease-out",
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold tabular-nums leading-none" style={{ color }}>
          {score}
        </div>
        <div className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wider">
          / 100
        </div>
      </div>
    </div>
  );
}

export function StatoSection({ audit }: { audit: any }) {
  if (!audit) {
    return (
      <Card className="bg-card border-border/50 border-dashed">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Nessun audit disponibile</p>
            <p className="text-xs text-muted-foreground mt-1">
              Clicca "Aggiorna audit" in alto per iniziare.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const score = audit.score_complessivo ?? audit.score_totale ?? 0;
  const color = scoreColor(score);
  const priorita: string[] = audit.priorita_top_3 || audit.azioni_prioritarie || [];
  const nextActions: any[] = audit.next_actions || [];
  const sintesi: string = audit.sintesi || "";
  const livello: string = audit.livello || scoreLevel(score);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* SCORE CARD */}
      <Card
        className="relative overflow-hidden bg-card border-border/50 md:col-span-1"
        style={{
          backgroundImage: `radial-gradient(circle at top right, ${color}1a, transparent 60%)`,
        }}
      >
        <CardContent className="p-5 flex flex-row md:flex-col items-center gap-4 md:gap-3 h-full">
          <ScoreRing score={score} color={color} />

          <div className="flex flex-col items-start md:items-center gap-1.5 md:text-center">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              <TrendingUp className="h-3 w-3" />
              Profile score
            </div>
            <div
              className="text-xs font-bold px-2.5 py-0.5 rounded-full border"
              style={{
                color,
                borderColor: `${color}40`,
                backgroundColor: `${color}15`,
              }}
            >
              {livello}
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              {score >= 60 ? "Sei sopra la media" : "C'è margine di crescita"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* PRIORITY CARD */}
      <Card className="bg-card border-border/50 md:col-span-2 overflow-hidden">
        <CardContent className="p-6 space-y-4 h-full flex flex-col">
          {sintesi && (
            <div className="flex gap-3">
              <div className="w-1 self-stretch rounded-full bg-primary/60 shrink-0" />
              <p className="text-sm leading-relaxed text-foreground/90 italic">
                {sintesi}
              </p>
            </div>
          )}

          {priorita.length > 0 && (
            <div className="space-y-2.5 flex-1">
              <h3 className="text-xs font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                <Target className="h-3.5 w-3.5 text-primary" />
                Le 3 cose da fare adesso
              </h3>
              <ol className="space-y-2">
                {priorita.slice(0, 3).map((p, i) => (
                  <li
                    key={i}
                    className="group flex gap-3 items-start p-3 rounded-lg bg-surface/40 border border-border/30 hover:border-primary/40 hover:bg-surface/60 transition-all"
                  >
                    <span
                      className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed pt-0.5">{p}</span>
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
                  className="h-7 text-xs gap-1 hover:bg-primary/10 hover:text-primary"
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
