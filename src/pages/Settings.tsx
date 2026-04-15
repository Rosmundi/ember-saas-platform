import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { QuotaBar } from "@/components/QuotaBar";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_LIMITS } from "@/lib/ember-types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LogOut, Trash2, Settings as SettingsIcon, CreditCard, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { BusinessProfile } from "@/lib/ember-types";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile } = useProfile();

  const bp = (profile?.business_profile || {}) as BusinessProfile;
  const [form, setForm] = useState<BusinessProfile>(bp);

  useEffect(() => {
    if (profile?.business_profile) {
      setForm(profile.business_profile as BusinessProfile);
    }
  }, [profile?.business_profile]);

  const plan = profile?.plan || 'trial';
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.trial;

  const handleSave = async () => {
    await updateProfile({ business_profile: form as any });
    toast.success("Profilo salvato!");
  };

  if (loading) {
    return <AppLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="animate-in">
          <div className="flex items-center gap-2 mb-1">
            <SettingsIcon className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">Impostazioni</span>
          </div>
          <h1 className="text-2xl font-bold">Configura il tuo account</h1>
        </div>

        {/* Profilo Business */}
        <Card className="bg-card/80 border-border/50 backdrop-blur-sm animate-in animate-in-delay-1">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-semibold text-lg">Profilo Business</h2>
            </div>
            {[
              { label: 'Nome', value: form.nome, key: 'nome', type: 'input' },
              { label: 'Headline', value: form.headline, key: 'headline', type: 'input' },
            ].map(f => (
              <div key={f.key} className="group">
                <label className="text-sm font-medium mb-1.5 block text-muted-foreground group-focus-within:text-primary transition-colors">{f.label}</label>
                <Input value={f.value} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="bg-surface border-border/50 focus:border-primary transition-colors" />
              </div>
            ))}
            <div className="group">
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground group-focus-within:text-primary transition-colors">Value Proposition</label>
              <Textarea value={form.value_proposition} onChange={e => setForm({ ...form, value_proposition: e.target.value })} className="bg-surface border-border/50 focus:border-primary transition-colors" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Tone of Voice</label>
              <Select value={form.tone_of_voice} onValueChange={v => setForm({ ...form, tone_of_voice: v })}>
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
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Tag</label>
              <div className="flex flex-wrap gap-2">{(form.tags || []).map(t => <Badge key={t} variant="outline" className="border-border/50 hover:border-primary/50 transition-colors cursor-default">{t}</Badge>)}</div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button onClick={handleSave} className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/20">Salva modifiche</Button>
              <Button variant="outline" className="border-border/50 hover:bg-surface">Rigenera da LinkedIn</Button>
            </div>
          </CardContent>
        </Card>

        {/* Piano e Billing */}
        <Card className="bg-card/80 border-border/50 backdrop-blur-sm animate-in animate-in-delay-2">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-semibold text-lg">Piano e Billing</h2>
            </div>
            <div className="flex items-center gap-3 p-3 bg-surface/50 rounded-xl border border-border/30">
              <span className="text-sm text-muted-foreground">Piano attuale:</span>
              <Badge className="bg-primary/15 text-primary border-0 font-semibold">{planLabel}</Badge>
            </div>
            <QuotaBar label="Skill-run" used={profile?.skill_runs_used || 0} total={profile?.skill_runs_limit || 20} />
            <QuotaBar label="Scraping oggi" used={profile?.scrapes_used_today || 0} total={profile?.scrapes_daily_limit || 0} />
            <div className="flex items-center gap-2 text-sm p-3 bg-surface/50 rounded-xl border border-border/30">
              <span className="text-muted-foreground">Watchlist:</span>
              <span className="font-medium">—<span className="text-muted-foreground font-normal">/{limits.watchlist}</span> profili</span>
            </div>
            <Separator className="bg-border/30" />
            <div className="flex gap-3">
              <Button className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/20">Cambia piano</Button>
              <Button variant="outline" className="border-border/50 hover:bg-surface">Gestisci pagamento</Button>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="bg-card/80 border-border/50 backdrop-blur-sm animate-in animate-in-delay-3">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center">
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </div>
              <h2 className="font-semibold text-lg">Account</h2>
            </div>
            <div className="p-3 bg-surface/50 rounded-xl border border-border/30">
              <label className="text-xs text-muted-foreground">Email</label>
              <p className="text-sm font-medium mt-0.5">{user?.email || '—'}</p>
            </div>
            <Separator className="bg-border/30" />
            <div className="flex gap-3">
              <Button variant="outline" className="border-border/50 hover:bg-surface" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-2" /> Elimina account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border/50 backdrop-blur-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                    <AlertDialogDescription>Tutti i dati verranno eliminati definitivamente. Questa azione non è reversibile.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-border/50">Annulla</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Elimina</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}