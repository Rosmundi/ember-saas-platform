import { Link, useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, FileText, LogOut, Sparkles, Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_LIMITS, PlanType } from "@/lib/ember-types";
import { supabase } from "@/integrations/supabase/client";

const UPSELL_NEXT: Record<PlanType, PlanType | null> = {
  trial: "pro",
  base: "pro",
  pro: "studio",
  studio: null,
};

const PLAN_PRICE: Record<PlanType, string> = {
  trial: "—",
  base: "39€/mese",
  pro: "89€/mese",
  studio: "199€/mese",
};

function daysLeft(trialEndsAt?: string | null): number | null {
  if (!trialEndsAt) return null;
  const diffMs = new Date(trialEndsAt).getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function AccountMenuContent() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!profile || !user) return null;

  const plan = profile.plan;
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const upsellTo = UPSELL_NEXT[plan];

  const skillPct = (profile.skill_runs_used / Math.max(1, profile.skill_runs_limit)) * 100;
  const scrapePct = (profile.scrapes_used_today / Math.max(1, profile.scrapes_daily_limit || 1)) * 100;

  const nome = (profile.business_profile as any)?.nome || "Utente";
  const trialDays = plan === "trial" ? daysLeft(profile.trial_ends_at) : null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-border/30">
        <p className="text-sm font-semibold truncate">{nome}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>

      <div className="px-4 py-3 space-y-2 border-b border-border/30">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Piano</span>
          <span className="text-sm font-semibold text-primary">
            {planLabel}
            {trialDays !== null && (
              <span className="text-muted-foreground font-normal ml-1">
                · {trialDays}g rimasti
              </span>
            )}
          </span>
        </div>
        <div className="space-y-1.5">
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
              <span>Skill-run (mese)</span>
              <span>{profile.skill_runs_used}/{profile.skill_runs_limit}</span>
            </div>
            <Progress value={skillPct} className="h-1.5" />
          </div>
          {profile.scrapes_daily_limit > 0 && (
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                <span>Scrape (oggi)</span>
                <span>{profile.scrapes_used_today}/{profile.scrapes_daily_limit}</span>
              </div>
              <Progress value={scrapePct} className="h-1.5" />
            </div>
          )}
        </div>
      </div>

      {upsellTo && (
        <div className="px-4 py-3 border-b border-border/30">
          <div className="relative rounded-xl p-4 overflow-hidden border border-primary/40 bg-gradient-to-br from-primary/15 via-primary/5 to-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/30 blur-2xl -z-10" />
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/30 rounded-full blur-3xl" />

            <div className="relative space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm font-bold text-primary">
                  Sblocca {upsellTo.charAt(0).toUpperCase() + upsellTo.slice(1)}
                </span>
              </div>
              <ul className="space-y-1 text-xs text-foreground/80">
                <li className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-primary shrink-0" />
                  <span>{PLAN_LIMITS[upsellTo].skillRuns} skill-run / mese</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-primary shrink-0" />
                  <span>{PLAN_LIMITS[upsellTo].scraping} scrape / giorno</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-primary shrink-0" />
                  <span>Watchlist fino a {PLAN_LIMITS[upsellTo].watchlist} profili</span>
                </li>
              </ul>
              <Button
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary text-primary-foreground shadow-lg shadow-primary/40 hover:shadow-primary/60 transition-all"
                size="sm"
                disabled
                title="Disponibile a breve"
              >
                Aggiorna a {upsellTo.charAt(0).toUpperCase() + upsellTo.slice(1)} · {PLAN_PRICE[upsellTo]}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                Stripe in arrivo
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="py-1">
        <Link
          to="/settings"
          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
        >
          <SettingsIcon className="h-4 w-4 text-muted-foreground" />
          Impostazioni
        </Link>
        <Link
          to="/settings#billing"
          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
        >
          <FileText className="h-4 w-4 text-muted-foreground" />
          Fatture e abbonamento
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors text-left"
        >
          <LogOut className="h-4 w-4 text-muted-foreground" />
          Esci
        </button>
      </div>
    </div>
  );
}
