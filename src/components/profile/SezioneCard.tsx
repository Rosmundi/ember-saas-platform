// src/components/profile/SezioneCard.tsx — v3.8.7
// Schema-agnostic: accetta sia `nome`/`riscrittura` (auto-profile-setup +
// profile-optimizer v3.8.7) sia legacy `sezione`/`esempio_riscritto`
// (profile-optimizer v3.8.5).
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronDown, AlertTriangle, Sparkles, CheckCircle, Flag, Copy,
} from "lucide-react";
import { toast } from "sonner";

interface SezioneCardProps {
  nome?: string;
  sezione?: string;
  score: number;
  peso?: number;
  stato?: "ok" | "da_migliorare" | "critico" | string;
  stato_attuale?: string;
  problema?: string;
  soluzione?: string;
  azione?: string;
  guida?: string;
  riscrittura?: string;
  esempio_riscritto?: string;
  defaultExpanded?: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  headline: "Headline",
  about: "About / Informazioni",
  featured: "In evidenza (Featured)",
  experience: "Esperienze",
  skills_e_competenze: "Skill e competenze",
  foto_e_banner: "Foto e banner",
  attivita_recente: "Attività recente",
  Headline: "Headline",
  About: "About / Informazioni",
  Featured: "In evidenza (Featured)",
  Esperienza: "Esperienze",
  Skills: "Skill e competenze",
  "Foto e Banner": "Foto e banner",
  "Attività": "Attività recente",
  Raccomandazioni: "Raccomandazioni",
  Formazione: "Formazione",
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";
  if (score >= 60) return "text-amber-400 border-amber-400/30 bg-amber-400/10";
  if (score >= 40) return "text-orange-400 border-orange-400/30 bg-orange-400/10";
  return "text-destructive border-destructive/30 bg-destructive/10";
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setDone(true);
        toast.success("Copiato!");
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? (
        <CheckCircle className="h-3 w-3 mr-1 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3 mr-1" />
      )}
      {done ? "Copiato" : "Copia"}
    </Button>
  );
}

export function SezioneCard(props: SezioneCardProps) {
  const [expanded, setExpanded] = useState(props.defaultExpanded ?? false);
  const sectionKey = props.nome || props.sezione || "";
  const label = SECTION_LABELS[sectionKey] || sectionKey || "Sezione";
  const proposto = props.riscrittura || props.esempio_riscritto || "";
  const score = Number(props.score) || 0;

  return (
    <Card className="bg-card border-border/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-accent/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`px-2 py-0.5 rounded text-xs font-bold border shrink-0 ${scoreColor(score)}`}>
            {score}/100
          </div>
          <h3 className="font-semibold text-sm truncate">{label}</h3>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <CardContent className="px-5 pb-5 pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Cosa c'è ora sul tuo profilo
              </p>
              <div className="rounded-md border border-border/50 bg-surface/40 p-3 text-xs leading-relaxed">
                {props.stato_attuale ? (
                  <p className="whitespace-pre-wrap">{props.stato_attuale}</p>
                ) : (
                  <p className="italic text-muted-foreground">
                    Sezione vuota o dato non disponibile.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              {props.problema && (
                <div className="flex gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <span className="font-semibold">Problema:</span> {props.problema}
                  </p>
                </div>
              )}
              {props.soluzione && (
                <div className="flex gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <span className="font-semibold">Soluzione:</span> {props.soluzione}
                  </p>
                </div>
              )}
              {props.azione && props.azione !== props.soluzione && (
                <div className="flex gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <span className="font-semibold">Azione:</span> {props.azione}
                  </p>
                </div>
              )}
              {props.guida && (
                <div className="flex gap-2">
                  <Flag className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <span className="font-semibold">Come modificarlo su LinkedIn:</span>{" "}
                    {props.guida}
                  </p>
                </div>
              )}
            </div>
          </div>

          {proposto && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Testo pronto da copiare
                </p>
                <CopyBtn text={proposto} />
              </div>
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                <p className="text-xs whitespace-pre-wrap leading-relaxed">{proposto}</p>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
