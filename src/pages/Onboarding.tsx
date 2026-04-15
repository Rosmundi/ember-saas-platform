import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScoreBadge } from "@/components/ScoreBadge";
import { UserCheck, ChevronRight, Loader2, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { callSkill, emberErrorMessage } from "@/lib/ember-api";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import type { BusinessProfile } from "@/lib/ember-types";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saveOnboardingProfile } = useProfile();

  const [step, setStep] = useState(1);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<Record<string, unknown> | null>(null);

  const [bp, setBp] = useState<BusinessProfile>({
    nome: "", headline: "", settore: "", value_proposition: "",
    tone_of_voice: "Diretto e pratico", punti_forza: [], aree_miglioramento: [], tags: [],
  });

  const isValidUrl = linkedinUrl.startsWith("https://www.linkedin.com/in/");

  const handleAnalyze = async () => {
    if (!isValidUrl || !user) return;
    setLoading(true);

    const result = await callSkill("auto-profile-setup", {
      user_id: user.id,
      linkedin_url: linkedinUrl,
    });

    setLoading(false);

    if (!result.ok) {
      toast.error(emberErrorMessage(result.error));
      return;
    }

    const d = result.data as Record<string, unknown>;
    const pb = d.profilo_business as Record<string, unknown> || {};
    const tb = d.target_buyer as Record<string, unknown> || {};
    const hooks = (d.hook_editoriali || []) as string[];

    setBp({
      nome: pb.chi_e as string || "",
      headline: `${pb.settore || ""} | ${pb.offerta || ""}`.slice(0, 220),
      settore: pb.settore as string || "",
      value_proposition: [pb.offerta, pb.unique_value].filter(Boolean).join(". "),
      tone_of_voice: "Diretto e pratico",
      punti_forza: hooks.length > 0 ? hooks : ["Da definire"],
      aree_miglioramento: [],
      tags: (pb.settore as string || "").split(/[,\/\s]+/).filter((t: string) => t.length > 2),
    });

    setRawData(d);
    setStep(2);
    toast.success("Profilo analizzato!");
  };

  const handleConfirm = async () => {
    setLoading(true);
    await saveOnboardingProfile(linkedinUrl, bp, rawData || {});
    setLoading(false);
    setStep(3);
    toast.success("Profilo salvato!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/50 border border-border/50 mb-4">
            <UserCheck className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">Onboarding</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">EMBER</h1>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 w-16 rounded-full transition-all ${s <= step ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>

        {step === 1 && (
          <Card className="bg-card border-border/50 animate-in">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <UserCheck className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Iniziamo dal tuo profilo LinkedIn</h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Incolla il link del tuo profilo. Analizzeremo i dati pubblici per creare il tuo Business Profile.
                </p>
              </div>

              <Input
                placeholder="https://www.linkedin.com/in/tuoprofilo"
                value={linkedinUrl}
                onChange={e => setLinkedinUrl(e.target.value)}
                className="bg-surface border-border/50 focus:border-primary h-11"
              />
              {linkedinUrl && !isValidUrl && (
                <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  L'URL deve iniziare con https://www.linkedin.com/in/
                </div>
              )}

              <Button onClick={handleAnalyze} disabled={loading || !isValidUrl} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground h-11 shadow-lg shadow-primary/20">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                {loading ? "Analisi in corso..." : "Analizza profilo"}
              </Button>

              {loading && (
                <div className="text-center py-4 space-y-2">
                  <p className="text-sm font-medium">Stiamo analizzando il tuo profilo LinkedIn...</p>
                  <p className="text-xs text-muted-foreground">Tempo stimato: 30-60 secondi</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="bg-card border-border/50 animate-in">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold">Ecco il tuo Business Profile</h2>
                <p className="text-muted-foreground text-sm">Controlla, modifica se serve, e conferma.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nome / Chi sei</label>
                  <Input value={bp.nome} onChange={e => setBp({ ...bp, nome: e.target.value })} className="bg-surface border-border/50 h-10" />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Headline suggerita</label>
                  <Input value={bp.headline} onChange={e => setBp({ ...bp, headline: e.target.value })} className="bg-surface border-border/50 h-10" />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Settore</label>
                  <Badge className="bg-primary/10 text-primary border-0">{bp.settore || "N/A"}</Badge>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Value Proposition</label>
                  <Textarea
                    value={bp.value_proposition}
                    onChange={e => setBp({ ...bp, value_proposition: e.target.value })}
                    className="bg-surface border-border/50"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tone of Voice</label>
                  <Select value={bp.tone_of_voice} onValueChange={v => setBp({ ...bp, tone_of_voice: v })}>
                    <SelectTrigger className="bg-surface border-border/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Diretto e pratico">Diretto e pratico</SelectItem>
                      <SelectItem value="Consultivo e autorevole">Consultivo e autorevole</SelectItem>
                      <SelectItem value="Amichevole">Amichevole</SelectItem>
                      <SelectItem value="Tecnico">Tecnico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Punti di forza / Hook editoriali</label>
                  <div className="flex flex-wrap gap-2">
                    {bp.punti_forza.map((p, i) => (
                      <Badge key={i} className="bg-primary/10 text-primary border-0">{p}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {bp.tags.map((t, i) => (
                      <Badge key={i} variant="outline" className="border-border/50">{t}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Rigenera
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/20"
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Conferma
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="bg-card border-border/50 animate-in">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-bold">Il tuo profilo LinkedIn in sintesi</h2>
                <p className="text-muted-foreground text-sm">Ecco come si posiziona il tuo profilo. Puoi migliorarlo subito o dopo.</p>
                <ScoreBadge score={72} size="lg" className="mx-auto" />
                <p className="text-xs text-muted-foreground">Punteggio stimato — lancia l'audit completo per un'analisi dettagliata</p>
              </div>

              <div className="space-y-3">
                {[
                  "Riscrivi la sezione About con struttura problem-solution-proof",
                  "Aggiungi almeno 3 contenuti nella sezione Featured",
                  "Ottimizza la headline con keyword del tuo ICP",
                ].map((action, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-surface/50 rounded-xl border border-border/30">
                    <span className="text-primary font-bold">{i + 1}</span>
                    <p className="text-sm">{action}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => navigate("/skill/profile-optimizer")}
                  variant="outline"
                  className="flex-1 border-border/50 hover:border-primary/50"
                >
                  Vedi audit completo
                </Button>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/20"
                >
                  Vai alla dashboard <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
