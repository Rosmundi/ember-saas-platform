import { AppLayout } from "@/components/layout/AppLayout";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { PlanType } from "@/lib/ember-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const PLAN_PRICE: Record<PlanType, string> = {
  trial: "Gratis 14 giorni",
  base: "39€/mese",
  pro: "89€/mese",
  studio: "199€/mese",
};

const PLAN_FEATURES: Record<PlanType, string[]> = {
  trial: ["20 skill-run", "0 scrape/giorno", "No watchlist"],
  base: ["60 skill-run", "1 scrape/giorno", "No watchlist"],
  pro: ["250 skill-run", "5 scrape/giorno", "Watchlist 15 profili"],
  studio: ["1000 skill-run", "20 scrape/giorno", "Watchlist 50 profili"],
};

export default function Settings() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [location.hash]);

  if (!profile || !user) return <AppLayout><div /></AppLayout>;

  const plans: PlanType[] = ["base", "pro", "studio"];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-2xl font-bold">Impostazioni</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Abbonamento, preferenze e account. Le info del tuo profilo LinkedIn vivono in{" "}
            <a href="/profilo" className="text-primary hover:underline">Il mio profilo</a>.
          </p>
        </div>

        <section id="billing" className="space-y-4 scroll-mt-6">
          <h2 className="text-lg font-semibold">Piano e abbonamento</h2>

          <Card className="bg-surface/50 border-border/30">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Piano attuale</p>
                  <p className="text-xl font-bold mt-1">
                    {profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)}
                    <Badge className="ml-2 bg-primary/15 text-primary border-0">{PLAN_PRICE[profile.plan]}</Badge>
                  </p>
                </div>
                <Button variant="outline" className="border-border/50" disabled title="Stripe in arrivo">
                  Annulla abbonamento
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/20">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Skill-run/mese</p>
                  <p className="text-sm font-medium mt-0.5">
                    {profile.skill_runs_used}/{profile.skill_runs_limit}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Scrape/giorno</p>
                  <p className="text-sm font-medium mt-0.5">
                    {profile.scrapes_used_today}/{profile.scrapes_daily_limit}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ricerche/giorno</p>
                  <p className="text-sm font-medium mt-0.5">
                    {profile.searches_used_today}/{profile.searches_daily_limit}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Cambia piano</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {plans.map((p) => {
                const isCurrent = profile.plan === p;
                return (
                  <Card
                    key={p}
                    className={`bg-surface/50 transition-all ${
                      isCurrent ? "border-primary/60 shadow-lg shadow-primary/10" : "border-border/30"
                    }`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="font-bold text-base">{p.charAt(0).toUpperCase() + p.slice(1)}</p>
                        <p className="text-sm text-muted-foreground">{PLAN_PRICE[p]}</p>
                      </div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {PLAN_FEATURES[p].map((f, i) => (
                          <li key={i}>· {f}</li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        size="sm"
                        variant={isCurrent ? "outline" : "default"}
                        disabled
                        title={isCurrent ? "Già attivo" : "Stripe in arrivo"}
                      >
                        {isCurrent ? "Piano attivo" : "Aggiorna"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Il sistema di pagamento (Stripe) verrà attivato a breve. Nel frattempo i bottoni sono disabilitati.
            </p>
          </div>

          <Card className="bg-surface/30 border-dashed border-border/40">
            <CardContent className="p-5 text-center text-sm text-muted-foreground">
              Lo storico fatture sarà disponibile dopo l'attivazione di Stripe.
            </CardContent>
          </Card>
        </section>

        <section id="preferenze" className="space-y-4 scroll-mt-6">
          <h2 className="text-lg font-semibold">Preferenze</h2>
          <Card className="bg-surface/50 border-border/30">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Avvisi via email</p>
                  <p className="text-xs text-muted-foreground">
                    Quote in esaurimento, digest settimanale dei tuoi prospect.
                  </p>
                </div>
                <Switch disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Tema scuro</p>
                  <p className="text-xs text-muted-foreground">Per ora fisso.</p>
                </div>
                <Switch defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Lingua interfaccia</p>
                  <p className="text-xs text-muted-foreground">Italiano (fisso).</p>
                </div>
                <Badge variant="outline" className="border-border/50">IT</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="account" className="space-y-4 scroll-mt-6">
          <h2 className="text-lg font-semibold">Account</h2>
          <Card className="bg-surface/50 border-border/30">
            <CardContent className="p-5 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">
                  Email
                </label>
                <Input value={user.email || ""} readOnly className="bg-background/50 border-border/30" />
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled>
                  Elimina account
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
