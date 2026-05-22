import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkillIcon } from "@/components/SkillIcon";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SKILLS } from "@/lib/ember-types";
import {
  Link as LinkIcon, Zap, PenTool, Copy,
  CheckCircle, ChevronRight, Sparkles, Target, UserCheck,
} from "lucide-react";

// Le skill del layer "profilo" sono assorbite dalla pagina /profilo (non hanno card in SKILLS).
// Per la landing pubblica le rappresentiamo staticamente.
const profiloSkills = [
  { id: "auto-setup", name: "Auto Profile Setup", icon: "UserCheck", description: "Genera un profilo LinkedIn ottimizzato partendo dal tuo URL pubblico." },
  { id: "optimizer", name: "Profile Optimizer", icon: "Award", description: "Audit headline, about, esperienze con raccomandazioni concrete." },
  { id: "brand-voice", name: "Brand Voice", icon: "Sparkles", description: "Definisci tone of voice, temi, do & don't del tuo personal brand." },
  { id: "banner-brief", name: "Brief banner LinkedIn", icon: "Flag", description: "Brief grafico pronto da girare al designer o a un generatore AI." },
];

const layers = [
  { title: "Profilo", icon: "UserCheck", skills: profiloSkills },
  { title: "Content", icon: "PenTool", skills: SKILLS.filter(s => s.layer === 'content') },
  { title: "Prospect", icon: "Target", skills: SKILLS.filter(s => s.layer === 'prospect') },
];

const steps = [
  { icon: LinkIcon, title: "Incolla il tuo LinkedIn URL", desc: "Basta il link del tuo profilo pubblico." },
  { icon: Zap, title: "Ember analizza profilo e mercato", desc: "AI e scraping intelligente fanno il lavoro pesante." },
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
    <div className="min-h-screen bg-background overflow-x-hidden cosmic-bg">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-primary font-bold text-2xl tracking-tight flex items-center gap-2">
            <span className="inline-flex w-8 h-8 rounded-lg bg-primary/15 items-center justify-center text-primary font-extrabold text-sm shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
              E
            </span>
            EMBER
          </span>
          <Link to="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground transition-colors">Accedi</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-32 px-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="neon-arc neon-arc-magenta animate-float" style={{ width: 1400, height: 1400, top: -200, left: -700 }} />
          <div className="neon-arc neon-arc-cyan animate-float" style={{ width: 1600, height: 1600, top: -300, right: -800, animationDelay: '2.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle,hsl(var(--primary)/0.10),transparent_60%)] blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <ScrollReveal>
            <Badge className="mb-8 bg-primary/10 text-primary border-primary/30 hover:bg-primary/15 transition-colors px-4 py-1.5 text-xs font-medium tracking-widest uppercase shadow-[0_0_24px_hsl(var(--primary)/0.25)]">
              <Sparkles className="h-3 w-3 mr-1.5" /> Linkedin copilot · 14 giorni gratis
            </Badge>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="text-5xl md:text-7xl lg:text-[88px] font-extrabold leading-[1.02] mb-8 tracking-tight">
              <span className="text-gradient-primary">Trasforma LinkedIn</span>
              <span className="block text-gradient-ember text-glow-primary mt-2">nel tuo canale</span>
              <span className="block text-gradient-primary">di crescita.</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="text-lg md:text-xl text-muted-foreground/90 mb-12 max-w-2xl mx-auto leading-relaxed">
              Ember è il copilot dei professionisti che non hanno tempo da perdere.
              Genera post, trova prospect, scrivi outreach personalizzato — tutto in italiano, senza rischiare il ban.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <Link to="/login">
              <Button
                size="lg"
                className="text-base px-10 py-7 bg-primary hover:bg-primary-hover text-primary-foreground rounded-full font-semibold btn-glow transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                Inizia gratis — 14 giorni di trial
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <p className="mt-5 text-sm text-muted-foreground/70">
              Nessuna carta richiesta · 20 skill-run inclusi
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 3 Layer, 10 Skill */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="neon-arc neon-arc-cyan animate-float" style={{ width: 1200, height: 1200, top: -400, left: -600, animationDelay: '1s' }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,hsl(var(--primary)/0.06),transparent_70%)]" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/30 px-3 py-1 text-xs tracking-widest uppercase">
                3 Layer · 10 Skill
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                <span className="text-gradient-primary">Tutto quello che serve per </span>
                <span className="text-gradient-ember">crescere su LinkedIn</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {layers.map((layer, layerIdx) => (
              <ScrollReveal key={layer.title} delay={layerIdx * 150} direction="up">
                <div>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
                      <SkillIcon name={layer.icon} className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">{layer.title}</h3>
                    <span className="text-xs text-muted-foreground ml-auto">{layer.skills.length} skill</span>
                  </div>
                  <div className="space-y-3">
                    {layer.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="cosmic-card group p-4 flex items-start gap-3 transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <div className="mt-0.5 shrink-0 p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <SkillIcon name={skill.icon} className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm group-hover:text-primary transition-colors">{skill.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{skill.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="neon-arc neon-arc-magenta animate-float" style={{ width: 1300, height: 1300, top: -300, right: -700, animationDelay: '3s' }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,hsl(var(--primary)/0.05),transparent)]" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/30 px-3 py-1 text-xs tracking-widest uppercase">
                Semplicissimo
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                <span className="text-gradient-primary">Come </span>
                <span className="text-gradient-ember">funziona</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <ScrollReveal key={i} delay={i * 120} direction="scale">
                <div className="cosmic-card group text-center relative p-6 h-full">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.35)] transition-all duration-300">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold mb-3 border border-primary/30">
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/30 text-success text-sm shadow-[0_0_24px_hsl(var(--success)/0.15)]">
                <CheckCircle className="h-4 w-4" />
                Zero automazioni · Tu controlli ogni azione · Nessun rischio ban
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="neon-arc neon-arc-cyan animate-float" style={{ width: 1100, height: 1100, bottom: -400, left: -500, animationDelay: '1.5s' }} />
          <div className="neon-arc neon-arc-magenta animate-float" style={{ width: 1100, height: 1100, bottom: -400, right: -500, animationDelay: '4s' }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,hsl(var(--primary)/0.06),transparent_70%)]" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/30 px-3 py-1 text-xs tracking-widest uppercase">
                Pricing
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                <span className="text-gradient-primary">Scegli il tuo </span>
                <span className="text-gradient-ember">piano</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Trial gratuito: 14 giorni, 20 skill-run, tutte le skill sbloccate.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan, i) => (
              <ScrollReveal key={plan.name} delay={i * 150} direction="up">
                <div
                  className={`cosmic-card group relative p-6 h-full transition-all duration-300 hover:-translate-y-1 ${
                    plan.popular ? 'ring-1 ring-primary/40 shadow-[0_0_50px_hsl(var(--primary)/0.2)]' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                  )}
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.5)]">
                      Più popolare
                    </Badge>
                  )}
                  <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-5xl font-extrabold text-gradient-ember">€{plan.price}</span>
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
                      className={`w-full rounded-full transition-all duration-300 ${
                        plan.popular
                          ? 'bg-primary hover:bg-primary-hover text-primary-foreground btn-glow'
                          : 'bg-transparent border border-border hover:border-primary/50 hover:bg-primary/5'
                      }`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                      <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,hsl(var(--primary)/0.15),transparent_60%)] blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <ScrollReveal>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              <span className="text-gradient-ember text-glow-primary">Pronto a accendere</span>
              <span className="block text-gradient-primary mt-2">il tuo LinkedIn?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
              14 giorni gratis, nessuna carta. Solo skill, contenuti e prospect.
            </p>
            <Link to="/login">
              <Button
                size="lg"
                className="text-base px-10 py-7 bg-primary hover:bg-primary-hover text-primary-foreground rounded-full font-semibold btn-glow transition-all duration-300 hover:scale-[1.03]"
              >
                Inizia il trial gratuito
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10 px-6 bg-background/40 backdrop-blur-sm relative z-10">
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
