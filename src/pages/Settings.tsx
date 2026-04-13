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
import { LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [profile, setProfile] = useState(mockBusinessProfile);
  const plan = mockProfile.plan;
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const limits = PLAN_LIMITS[plan];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold">Impostazioni</h1>

        {/* Profilo Business */}
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Profilo Business</h2>
            <div><label className="text-sm font-medium mb-1 block">Nome</label><Input value={profile.nome} onChange={e => setProfile({...profile, nome: e.target.value})} className="bg-surface border-border" /></div>
            <div><label className="text-sm font-medium mb-1 block">Headline</label><Input value={profile.headline} onChange={e => setProfile({...profile, headline: e.target.value})} className="bg-surface border-border" /></div>
            <div><label className="text-sm font-medium mb-1 block">Value Proposition</label><Textarea value={profile.value_proposition} onChange={e => setProfile({...profile, value_proposition: e.target.value})} className="bg-surface border-border" rows={3} /></div>
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
              <label className="text-sm font-medium mb-1 block">Tag</label>
              <div className="flex flex-wrap gap-2">{profile.tags.map(t => <Badge key={t} variant="outline" className="border-border">{t}</Badge>)}</div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => toast.success("Profilo salvato!")} className="bg-primary hover:bg-primary-hover text-primary-foreground">Salva</Button>
              <Button variant="outline" className="border-border">Rigenera da LinkedIn</Button>
            </div>
          </CardContent>
        </Card>

        {/* Piano e Billing */}
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Piano e Billing</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Piano attuale:</span>
              <Badge className="bg-primary text-primary-foreground">{planLabel}</Badge>
            </div>
            <QuotaBar label="Skill-run" used={mockProfile.skill_runs_used} total={mockProfile.skill_runs_limit} />
            <QuotaBar label="Scraping oggi" used={mockProfile.scrapes_used_today} total={mockProfile.scrapes_daily_limit} />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Watchlist:</span>
              <span>{3}/{limits.watchlist} profili</span>
            </div>
            <Separator className="bg-border" />
            <div className="flex gap-3">
              <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">Cambia piano</Button>
              <Button variant="outline" className="border-border">Gestisci pagamento</Button>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Account</h2>
            <div><label className="text-sm text-muted-foreground">Email</label><p className="text-sm font-medium">marco@example.com</p></div>
            <Separator className="bg-border" />
            <div className="flex gap-3">
              <Button variant="outline" className="border-border">
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> Elimina account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                    <AlertDialogDescription>Tutti i dati verranno eliminati definitivamente.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-border">Annulla</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground">Elimina</AlertDialogAction>
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
