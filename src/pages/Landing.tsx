import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkillIcon } from "@/components/SkillIcon";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SKILLS } from "@/lib/ember-types";
import {
  Link as LinkIcon, Zap, PenTool, Copy,
  CheckCircle, ChevronRight, Sparkles,
} from "lucide-react";

const layers = [
  { title: "Profilo", icon: "UserCheck", color: "from-blue-500/20 to-blue-600/5", border: "hover:border-blue-500/50", skills: SKILLS.filter(s => s.layer === 'profilo') },
  { title: "Content", icon: "PenTool", color: "from-amber-500/20 to-amber-600/5", border: "hover:border-amber-500/50", skills: SKILLS.filter(s => s.layer === 'content') },
  { title: "Prospect", icon: "Target", color: "from-emerald-500/20 to-emerald-600/5", border: "hover:border-emerald-500/50", skills: SKILLS.filter(s => s.layer === 'prospect') },
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-primary font-bold text-2xl tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            EMBER
          </span>
          <Link to="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground transition-colors">Accedi</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(38_92%_44%/0.15),transparent)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,hsl(38_92%_44%/0.08),transparent_60%)] blur-3xl pointer-events-none" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(215_25%_27%/0.15)_1px,transparent_1px),linear-gradient(90deg,hsl(215_25%_27%/0.15)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent)]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <ScrollReveal>
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors px-4 py-1.5 text-sm font-medium">
              🚀 14 giorni di trial gratuito
            </Badge>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6 bg-gradient-to-b from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
              Trasforma LinkedIn nel tuo canale di crescita.
              <span className="block text-3xl md:text-4xl lg:text-5xl font-bold mt-4 text-muted-foreground">
                Ember è il copilot dei professionisti che non hanno tempo da perdere.
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Genera post, trova prospect, scrivi outreach personalizzato.
              <br className="hidden sm:block" />
              Tutto in italiano, senza rischiare il ban.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <Link to="/login">
              <Button
                size="lg"
                className="text-lg px-10 py-7 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl font-semibold shadow-[0_0_40px_hsl(38_92%_44%/0.3)] hover:shadow-[0_0_60px_hsl(38_92%_44%/0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                Inizia gratis — 14 giorni di trial
              </Button>
            </Link>
            <p className="mt-5 text-sm text-muted-foreground/70">
              Nessuna carta richiesta · 20 skill-run inclusi
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 3 Layer, 10 Skill */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-transparent to-card/20" />
        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs">
                3 Layer · 10 Skill
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                Tutto quello che serve per crescere su LinkedIn
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {layers.map((layer, layerIdx) => (
              <ScrollReveal key={layer.title} delay={layerIdx * 150} direction="up">
                <div>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${layer.color}`}>
                      <SkillIcon name={layer.icon} className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">{layer.title}</h3>
                    <span className="text-xs text-muted-foreground ml-auto">{layer.skills.length} skill</span>
                  </div>
                  <div className="space-y-3">
                    {layer.skills.map((skill, i) => (
                      <Card
                        key={skill.id}
                        className={`group bg-card/80 backdrop-blur-sm border-border/50 ${layer.border} hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-default`}
                      >
                        <CardContent className="p-4 flex items-start gap-3">
                          <div className="mt-0.5 shrink-0 p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <SkillIcon name={skill.icon} className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm group-hover:text-primary transition-colors">{skill.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{skill.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,hsl(38_92%_44%/0.05),transparent)]" />
        <div className="max-w-5xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs">
                Semplicissimo
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">Come funziona</h2>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <ScrollReveal key={i} delay={i * 120} direction="scale">
                <div className="group text-center relative">
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-gradient-to-r from-border to-transparent" />
                  )}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:from-primary/30 group-hover:to-primary/10 group-hover:border-primary/20 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all duration-300">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
                    {i + 1}
                  </div>
                  <h3 className="font-semibold text-sm mb-2 leading-snug">{step.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={500}>
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 text-success text-sm">
                <CheckCircle className="h-4 w-4" />
                Zero automazioni · Tu controlli ogni azione · Nessun rischio ban
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/20 to-background" />
        <div className="max-w-5xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs">
                Pricing
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Scegli il tuo piano</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Trial gratuito: 14 giorni, 20 skill-run, tutte le skill sbloccate.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan, i) => (
              <ScrollReveal key={plan.name} delay={i * 150} direction="up">
                <Card
                  className={`group relative bg-card/80 backdrop-blur-sm border-border/50 hover:border-border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    plan.popular ? 'border-primary/50 ring-1 ring-primary/20 shadow-lg shadow-primary/10' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                  )}
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                      Più popolare
                    </Badge>
                  )}
                  <CardContent className="p-6">
                    <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-extrabold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">€{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/login">
                      <Button
                        className={`w-full transition-all duration-300 group-hover:shadow-lg ${
                          plan.popular
                            ? 'bg-primary hover:bg-primary-hover text-primary-foreground shadow-md shadow-primary/20 group-hover:shadow-primary/30'
                            : 'hover:border-primary/50'
                        }`}
                        variant={plan.popular ? "default" : "outline"}
                      >
                        {plan.cta}
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 px-6 bg-card/20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">© 2026 Ember. Fatto in Italia con AI.</p>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Termini</a>
            <a href="#" className="hover:text-foreground transition-colors">Contatti</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
