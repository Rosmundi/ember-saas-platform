// src/components/profile/OnboardingEmptyState.tsx — v3.8.7
// Estratto da Profilo.tsx v3.8.5. Identico, solo extract.
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserCheck, Loader2, Sparkles, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { callSkill, emberErrorMessage } from "@/lib/ember-api";
import type { BusinessProfile } from "@/lib/ember-types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}

export function OnboardingEmptyState() {
  const { user } = useAuth();
  const { saveOnboardingProfile } = useProfile();
  const [step, setStep] = useState<1 | 2>(1);
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
      user_id: user.id, linkedin_url: linkedinUrl,
    });
    setLoading(false);
    if (!result.ok) {
      const err = (result as { ok: false; error: any }).error;
      toast.error(emberErrorMessage(err));
      return;
    }
    const d = result.data as Record<string, unknown>;
    const pb = (d.profilo_business as Record<string, string>) || {};
    const hooks = (d.hook_editoriali || []) as string[];
    setBp({
      nome: pb.nome || pb.chi_e || "",
      headline: pb.chi_e || "",
      settore: pb.settore || "",
      value_proposition: [pb.offerta, pb.unique_value].filter(Boolean).join(". "),
      tone_of_voice: "Diretto e pratico",
      punti_forza: hooks.length > 0 ? hooks : ["Da definire"],
      aree_miglioramento: [],
      tags: (pb.settore || "").split(/[,\/\s]+/).filter((t: string) => t.length > 2),
    });
    setRawData(d);
    setStep(2);
    toast.success("Profilo analizzato!");
  };

  const handleConfirm = async () => {
    setLoading(true);
    await saveOnboardingProfile(linkedinUrl, bp, rawData || {});
    setLoading(false);
    toast.success("Profilo salvato!");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <UserCheck className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Il mio profilo</h1>
        <p className="text-muted-foreground text-sm">
          Iniziamo dal tuo profilo LinkedIn. Lo analizziamo e creiamo audit + brand kit.
        </p>
      </div>
      <div className="flex items-center justify-center gap-2">
        {[1, 2].map((s) => (
          <div key={s} className={`h-1.5 w-20 rounded-full ${s <= step ? "bg-primary" : "bg-border"}`} />
        ))}
      </div>

      {step === 1 && (
        <Card className="bg-card border-border/50">
          <CardContent className="p-6 space-y-4">
            <Input
              placeholder="https://www.linkedin.com/in/tuoprofilo"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="bg-surface border-border/50 h-11"
            />
            {linkedinUrl && !isValidUrl && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>L'URL deve iniziare con https://www.linkedin.com/in/</AlertDescription>
              </Alert>
            )}
            <Button
              onClick={handleAnalyze} disabled={loading || !isValidUrl}
              className="w-full bg-primary hover:bg-primary-hover text-primary-foreground h-11"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {loading ? "Analisi in corso (30-60s)…" : "Analizza profilo"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="bg-card border-border/50">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">Controlla e conferma il tuo business profile.</p>
            <Field label="Nome / Chi sei">
              <Input value={bp.nome} onChange={(e) => setBp({ ...bp, nome: e.target.value })} className="bg-surface border-border/50" />
            </Field>
            <Field label="Headline">
              <Input value={bp.headline} onChange={(e) => setBp({ ...bp, headline: e.target.value })} className="bg-surface border-border/50" />
            </Field>
            <Field label="Settore">
              <Input value={bp.settore} onChange={(e) => setBp({ ...bp, settore: e.target.value })} className="bg-surface border-border/50" />
            </Field>
            <Field label="Value proposition">
              <Textarea rows={3} value={bp.value_proposition} onChange={(e) => setBp({ ...bp, value_proposition: e.target.value })} className="bg-surface border-border/50" />
            </Field>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">Indietro</Button>
              <Button onClick={handleConfirm} disabled={loading} className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Conferma
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
