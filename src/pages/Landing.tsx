import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkillIcon } from "@/components/SkillIcon";
import { SKILLS } from "@/lib/ember-types";
import {
  Link as LinkIcon, Zap, PenTool, Copy,
  CheckCircle, ChevronRight,
} from "lucide-react";

const layers = [
  { title: "Profilo", icon: "UserCheck", skills: SKILLS.filter(s => s.layer === 'profilo') },
  { title: "Content", icon: "PenTool", skills: SKILLS.filter(s => s.layer === 'content') },
  { title: "Prospect", icon: "Target", skills: SKILLS.filter(s => s.layer === 'prospect') },
];

const steps = [
  { icon: LinkIcon, title: "Incolla il tuo LinkedIn URL", desc: "Basta il link del tuo profilo pubblico." },
  { icon: Zap, title: "Ember analizza il tuo profilo e il tuo mercato", desc: "AI e scraping intelligente fanno il lavoro pesante." },
  { icon: PenTool, title: "Scegli una skill e compila il brief", desc: "10 skill per ogni fase del tuo funnel." },
  { icon: Copy, title: "Copia il risultato e pubblica", desc: "Contenuti pronti, outreach calibrato, zero rischi." },
];

const pricing = [
  {
    name: "Base", price: "39", period: "/mese", popular: false,
    features: ["60 skill-run/mese", "1 scraping/giorno", "Layer 1 + Layer 2 + Outreach, Reply", "Supporto email 48h"],
    cta: "Inizia gratis",
  },
  {
    name: "Pro", price: "89", period: "/mese", popular: true,
    features: ["250 skill-run/mese", "5 scraping/giorno", "Tutte le 10 skill", "15 profili watchlist", "Content Performance settimanale", "Supporto email 24h + chat"],
    cta: "Inizia gratis",
  },
  {
    name: "Studio", price: "199", period: "/mese", popular: false,
    features: ["1.000 skill-run/mese", "20 scraping/giorno", "Tutte + multi-profilo (5)", "50 profili watchlist", "Content Performance giornaliero", "Chat + onboarding call"],
    cta: "Contattaci",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-primary font-bold text-2xl tracking-tight">EMBER</span>
          <Link to="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Accedi</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6" style={{ background: 'linear-gradient(180deg, hsl(222 47% 11%) 0%, hsl(222 47% 5%) 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Il copilot LinkedIn per professionisti e PMI italiane
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Genera post, trova prospect, scrivi outreach personalizzato. Tutto in italiano, senza rischiare il ban.
          </p>
          <Link to="/login">
            <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg font-semibold">
              Inizia gratis — 14 giorni di trial
            </Button>
          </Link>
          <p className="mt-4 text-sm text-muted">
            Nessuna carta richiesta. 20 skill-run inclusi.
          </p>
        </div>
      </section>

      {/* 3 Layer, 10 Skill */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tutto quello che serve per crescere su LinkedIn
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {layers.map((layer) => (
              <div key={layer.title}>
                <div className="flex items-center gap-2 mb-4">
                  <SkillIcon name={layer.icon} className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-lg">{layer.title}</h3>
                </div>
                <div className="space-y-3">
                  {layer.skills.map((skill) => (
                    <Card key={skill.id} className="bg-card border-border hover:border-primary transition-colors">
                      <CardContent className="p-4 flex items-start gap-3">
                        <SkillIcon name={skill.icon} className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{skill.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Come funziona</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="text-xs text-primary font-semibold mb-1">Step {i + 1}</div>
                <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            Zero automazioni. Tu controlli ogni azione. Nessun rischio ban.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Scegli il tuo piano</h2>
          <p className="text-center text-muted-foreground mb-12">
            Trial gratuito: 14 giorni, 20 skill-run, tutte le skill sbloccate.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan) => (
              <Card
                key={plan.name}
                className={`bg-card border-border relative ${plan.popular ? 'border-primary ring-1 ring-primary' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Più popolare
                  </Badge>
                )}
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-extrabold">€{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/login">
                    <Button
                      className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary-hover text-primary-foreground' : ''}`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© 2026 Ember. Fatto in Italia con AI.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Termini</a>
            <a href="#" className="hover:text-foreground">Contatti</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
