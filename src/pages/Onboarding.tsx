import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronRight, Link as LinkIcon } from "lucide-react";
import { mockBusinessProfile } from "@/lib/mock-data";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(mockBusinessProfile);
  const [urlError, setUrlError] = useState("");

  const progressPct = (step / 3) * 100;

  const handleAnalyze = async () => {
    if (!linkedinUrl.startsWith("https://www.linkedin.com/in/")) {
      setUrlError("L'URL deve iniziare con https://www.linkedin.com/in/");
      return;
    }
    setUrlError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 2500));
    setLoading(false);
    setStep(2);
  };

  const handleConfirm = () => {
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-primary font-bold text-xl">EMBER</span>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Step {step} di 3</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-8">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <LinkIcon className="h-7 w-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold">Iniziamo dal tuo profilo LinkedIn</h1>
                  <p className="text-muted-foreground mt-2">
                    Incolla il link del tuo profilo. Analizzeremo i dati pubblici per creare il tuo Business Profile.
                  </p>
                </div>

                {!loading ? (
                  <div className="space-y-4">
                    <Input
                      placeholder="https://www.linkedin.com/in/tuoprofilo"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="bg-surface border-border"
                    />
                    {urlError && <p className="text-sm text-destructive">{urlError}</p>}
                    <Button onClick={handleAnalyze} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground">
                      Analizza profilo
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Stiamo analizzando il tuo profilo LinkedIn...</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-2xl font-bold">Ecco il tuo Business Profile</h1>
                  <p className="text-muted-foreground mt-2">Controlla, modifica se serve, e conferma.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nome</label>
                    <Input value={profile.nome} onChange={e => setProfile({...profile, nome: e.target.value})} className="bg-surface border-border" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Headline</label>
                    <Input value={profile.headline} onChange={e => setProfile({...profile, headline: e.target.value})} className="bg-surface border-border" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Settore</label>
                    <Badge className="bg-primary-light text-primary border-0">{profile.settore}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Value Proposition</label>
                    <Textarea value={profile.value_proposition} onChange={e => setProfile({...profile, value_proposition: e.target.value})} className="bg-surface border-border" rows={3} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Tone of Voice</label>
                    <Select value={profile.tone_of_voice} onValueChange={v => setProfile({...profile, tone_of_voice: v})}>
                      <SelectTrigger className="bg-surface border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Diretto e pratico">Diretto e pratico</SelectItem>
                        <SelectItem value="Consultivo e autorevole">Consultivo e autorevole</SelectItem>
                        <SelectItem value="Amichevole">Amichevole</SelectItem>
                        <SelectItem value="Tecnico">Tecnico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Punti di forza</label>
                    <div className="flex flex-wrap gap-2">
                      {profile.punti_forza.map(p => <Badge key={p} className="bg-primary-light text-primary border-0">{p}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Aree da migliorare</label>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {profile.aree_miglioramento.map(a => <li key={a}>• {a}</li>)}
                    </ul>
                    <p className="text-xs text-primary mt-2 cursor-pointer hover:underline">
                      → Vai a Ottimizza profilo dopo l'onboarding
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Tag</label>
                    <div className="flex flex-wrap gap-2">
                      {profile.tags.map(t => <Badge key={t} variant="outline" className="border-border">{t}</Badge>)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleConfirm} className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground">
                    Conferma
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setStep(1)} className="border-border">
                    Rigenera
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-6 text-center">
                <h1 className="text-2xl font-bold">Il tuo profilo LinkedIn in sintesi</h1>
                <p className="text-muted-foreground">Ecco come si posiziona il tuo profilo. Puoi migliorarlo subito o dopo.</p>

                <ScoreBadge score={72} size="lg" className="mx-auto" />

                <div className="text-left space-y-3 mt-6">
                  <h3 className="font-semibold">Top 3 azioni prioritarie:</h3>
                  {['Riscrivi la sezione About con keyword ICP', 'Aggiungi 3 contenuti Featured', 'Ottimizza headline con value proposition'].map((a, i) => (
                    <div key={i} className="flex items-start gap-3 bg-surface p-3 rounded-lg border border-border">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="text-sm">{a}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={() => navigate('/dashboard')} className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground">
                    Vai alla dashboard
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/skill/profile-optimizer')} className="border-border">
                    Vedi audit completo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
