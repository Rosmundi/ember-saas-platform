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
import { Loader2, ChevronRight, Link as LinkIcon, CheckCircle, Sparkles } from "lucide-react";
import { mockBusinessProfile } from "@/lib/mock-data";

const stepLabels = ['LinkedIn URL', 'Business Profile', 'Risultato'];

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

  const handleConfirm = () => setStep(3);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-6 animate-in">
          <span className="text-primary font-bold text-xl tracking-tight">EMBER</span>
        </div>

        {/* Step indicators */}
        <div className="mb-8 animate-in animate-in-delay-1">
          <div className="flex items-center justify-between mb-4">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                  i + 1 < step ? 'bg-primary text-primary-foreground' :
                  i + 1 === step ? 'bg-primary/20 text-primary border-2 border-primary' :
                  'bg-surface text-muted-foreground border border-border'
                }`}>
                  {i + 1 < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:inline transition-colors ${i + 1 === step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {label}
                </span>
                {i < 2 && <div className={`hidden sm:block w-12 h-px mx-2 transition-colors duration-500 ${i + 1 < step ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>

        <Card className="bg-card/80 border-border/50 backdrop-blur-sm shadow-2xl shadow-background/50 animate-in animate-in-delay-2">
          <CardContent className="p-8">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-in">
                    <LinkIcon className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold">Iniziamo dal tuo profilo LinkedIn</h1>
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    Incolla il link del tuo profilo. Analizzeremo i dati pubblici per creare il tuo Business Profile.
                  </p>
                </div>

                {!loading ? (
                  <div className="space-y-4 animate-in animate-in-delay-1">
                    <Input
                      placeholder="https://www.linkedin.com/in/tuoprofilo"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="bg-surface border-border focus:border-primary h-12 text-base"
                    />
                    {urlError && <p className="text-sm text-destructive animate-in">{urlError}</p>}
                    <Button onClick={handleAnalyze} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground h-12 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                      Analizza profilo
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12 animate-in">
                    <div className="relative inline-block">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <div className="absolute inset-0 h-12 w-12 rounded-full animate-ping bg-primary/10" />
                    </div>
                    <p className="text-foreground font-medium mt-6">Stiamo analizzando il tuo profilo LinkedIn...</p>
                    <p className="text-muted-foreground text-sm mt-1">Tempo stimato: 15-30 secondi</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-6 animate-in">
                <div className="text-center">
                  <h1 className="text-2xl font-bold">Ecco il tuo Business Profile</h1>
                  <p className="text-muted-foreground mt-2">Controlla, modifica se serve, e conferma.</p>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Nome', value: profile.nome, key: 'nome', type: 'input' },
                    { label: 'Headline', value: profile.headline, key: 'headline', type: 'input' },
                  ].map(f => (
                    <div key={f.key} className="group">
                      <label className="text-sm font-medium mb-1.5 block text-muted-foreground group-focus-within:text-primary transition-colors">{f.label}</label>
                      <Input value={f.value} onChange={e => setProfile({ ...profile, [f.key]: e.target.value })} className="bg-surface border-border/50 focus:border-primary transition-colors" />
                    </div>
                  ))}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Settore</label>
                    <Badge className="bg-primary/10 text-primary border-0">{profile.settore}</Badge>
                  </div>
                  <div className="group">
                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground group-focus-within:text-primary transition-colors">Value Proposition</label>
                    <Textarea value={profile.value_proposition} onChange={e => setProfile({ ...profile, value_proposition: e.target.value })} className="bg-surface border-border/50 focus:border-primary transition-colors" rows={3} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Tone of Voice</label>
                    <Select value={profile.tone_of_voice} onValueChange={v => setProfile({ ...profile, tone_of_voice: v })}>
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
                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Punti di forza</label>
                    <div className="flex flex-wrap gap-2">
                      {profile.punti_forza.map(p => <Badge key={p} className="bg-success/10 text-success border-0">{p}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Aree da migliorare</label>
                    <ul className="text-sm text-muted-foreground space-y-1.5">
                      {profile.aree_miglioramento.map(a => <li key={a} className="flex items-start gap-2"><span className="text-warning mt-0.5">→</span> {a}</li>)}
                    </ul>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Tag</label>
                    <div className="flex flex-wrap gap-2">
                      {profile.tags.map(t => <Badge key={t} variant="outline" className="border-border/50">{t}</Badge>)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleConfirm} className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground h-11 shadow-lg shadow-primary/20">
                    Conferma <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setStep(1)} className="border-border/50 hover:bg-surface">
                    Rigenera
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-6 text-center animate-in">
                <div>
                  <Sparkles className="h-6 w-6 text-primary mx-auto mb-3" />
                  <h1 className="text-2xl font-bold">Il tuo profilo LinkedIn in sintesi</h1>
                  <p className="text-muted-foreground mt-2">Ecco come si posiziona il tuo profilo. Puoi migliorarlo subito o dopo.</p>
                </div>

                <div className="py-4">
                  <ScoreBadge score={72} size="lg" className="mx-auto" />
                </div>

                <div className="text-left space-y-3">
                  <h3 className="font-semibold">Top 3 azioni prioritarie:</h3>
                  {['Riscrivi la sezione About con keyword ICP', 'Aggiungi 3 contenuti Featured', 'Ottimizza headline con value proposition'].map((a, i) => (
                    <div key={i} className="flex items-start gap-3 bg-surface/50 p-4 rounded-xl border border-border/30 hover:border-primary/30 transition-colors group"
                      style={{ animationDelay: `${i * 100}ms` }}>
                      <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        {i + 1}
                      </span>
                      <span className="text-sm">{a}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={() => navigate('/dashboard')} className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground h-11 shadow-lg shadow-primary/20">
                    Vai alla dashboard
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/skill/profile-optimizer')} className="border-border/50 hover:bg-surface">
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
