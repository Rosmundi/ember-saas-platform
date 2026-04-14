import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { QuotaBar } from "@/components/QuotaBar";
import { mockProfile, mockBusinessProfile } from "@/lib/mock-data";
import { PLAN_LIMITS } from "@/lib/ember-types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LogOut, Trash2, Settings as SettingsIcon, CreditCard, User } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [profile, setProfile] = useState(mockBusinessProfile);
  const plan = mockProfile.plan;
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const limits = PLAN_LIMITS[plan];

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
              { label: 'Nome', value: profile.nome, key: 'nome', type: 'input' },
              { label: 'Headline', value: profile.headline, key: 'headline', type: 'input' },
            ].map(f => (
              <div key={f.key} className="group">
                <label className="text-sm font-medium mb-1.5 block text-muted-foreground group-focus-within:text-primary transition-colors">{f.label}</label>
                <Input value={f.value} onChange={e => setProfile({ ...profile, [f.key]: e.target.value })} className="bg-surface border-border/50 focus:border-primary transition-colors" />
              </div>
            ))}
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
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Tag</label>
              <div className="flex flex-wrap gap-2">{profile.tags.map(t => <Badge key={t} variant="outline" className="border-border/50 hover:border-primary/50 transition-colors cursor-default">{t}</Badge>)}</div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button onClick={() => toast.success("Profilo salvato!")} className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/20">Salva modifiche</Button>
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
            <QuotaBar label="Skill-run" used={mockProfile.skill_runs_used} total={mockProfile.skill_runs_limit} />
            <QuotaBar label="Scraping oggi" used={mockProfile.scrapes_used_today} total={mockProfile.scrapes_daily_limit} />
            <div className="flex items-center gap-2 text-sm p-3 bg-surface/50 rounded-xl border border-border/30">
              <span className="text-muted-foreground">Watchlist:</span>
              <span className="font-medium">{3}<span className="text-muted-foreground font-normal">/{limits.watchlist}</span> profili</span>
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
              <p className="text-sm font-medium mt-0.5">marco@example.com</p>
            </div>
            <Separator className="bg-border/30" />
            <div className="flex gap-3">
              <Button variant="outline" className="border-border/50 hover:bg-surface">
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
