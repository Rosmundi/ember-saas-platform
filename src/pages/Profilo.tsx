// src/pages/Profilo.tsx — v3.8.5 Unified Profile Page
// Assorbe: /onboarding, /brand, /skill/auto-profile-setup, /skill/profile-optimizer,
// /skill/profile-banner-brief, /skill/regenerate-section.
// Tutti i dialog sono inline qui per ridurre fragmentazione.

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useSkillRuns } from "@/hooks/useSkillRuns";
import { callSkill, callRegenerateSection, emberErrorMessage } from "@/lib/ember-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  UserCheck, Loader2, RotateCcw, RefreshCw, Save, Wand2, Flag, Palette,
  ChevronRight, ChevronDown, AlertTriangle, X, Plus, Copy, CheckCircle,
  ImageIcon, BarChart3, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { BusinessProfile, BrandKit } from "@/lib/ember-types";

// ============================================================================
// Helpers
// ============================================================================
function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";
  if (score >= 60) return "text-amber-400 border-amber-400/30 bg-amber-400/10";
  if (score >= 40) return "text-orange-400 border-orange-400/30 bg-orange-400/10";
  return "text-destructive border-destructive/30 bg-destructive/10";
}
function scoreLevel(score: number): string {
  if (score >= 85) return "Avanzato";
  if (score >= 70) return "Intermedio";
  if (score >= 50) return "Base";
  return "Da migliorare";
}
function isValidHex(v: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v.trim());
}
function CopyBtn({ text, label = "Copia" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="ghost" size="sm" className="h-7 px-2 text-xs"
      onClick={(e) => {
        e.preventDefault(); e.stopPropagation();
        navigator.clipboard.writeText(text);
        setDone(true); toast.success("Copiato!");
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <CheckCircle className="h-3 w-3 mr-1 text-emerald-400" /> : <Copy className="h-3 w-3 mr-1" />}
      {done ? "Copiato" : label}
    </Button>
  );
}

// ============================================================================
// MAIN
// ============================================================================
export default function Profilo() {
  const { profile, loading, onboardingCompleted } = useProfile();

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!profile || !onboardingCompleted) {
    return (
      <AppLayout>
        <OnboardingEmptyState />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <UnifiedProfileContent />
    </AppLayout>
  );
}

// ============================================================================
// Empty state (ex /onboarding)
// ============================================================================
function OnboardingEmptyState() {
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
    if (!result.ok) { const err = (result as { ok: false; error: any }).error; toast.error(emberErrorMessage(err)); return; }
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
    toast.success("Profilo salvato! Carico l'audit…");
    // La pagina si ricaricherà sola perché useProfile rifetcha e onboardingCompleted diventa true.
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}

// ============================================================================
// Unified profile content (existing user)
// ============================================================================
function UnifiedProfileContent() {
  const { user } = useAuth();
  const { profile, updateProfile, updateRawProfileData, fetchProfile, consumeSkillRun } = useProfile();
  const { logRun } = useSkillRuns();
  const [searchParams, setSearchParams] = useSearchParams();

  // Dialog state
  const [auditDialog, setAuditDialog] = useState(false);
  const [rescanDialog, setRescanDialog] = useState(false);
  const [bannerDialog, setBannerDialog] = useState(false);
  const [rewriteDialog, setRewriteDialog] = useState<string | null>(null); // section name

  // Auto-open via query params (redirect compat)
  const action = searchParams.get("action");
  const regenerateSection = searchParams.get("regenerate");
  useEffect(() => {
    if (action === "rescan") setRescanDialog(true);
    if (action === "reaudit") setAuditDialog(true);
    if (regenerateSection) {
      const cap = regenerateSection.charAt(0).toUpperCase() + regenerateSection.slice(1);
      setRewriteDialog(cap);
    }
    if (action || regenerateSection) {
      // Pulisci query per evitare ri-apertura su navigate-back
      const next = new URLSearchParams(searchParams);
      next.delete("action"); next.delete("regenerate");
      setSearchParams(next, { replace: true });
    }
    // Anchor scroll
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!profile) return null;

  const raw = (profile.raw_profile_data || {}) as Record<string, any>;
  const score = raw.score_totale || raw.score_complessivo || 0;
  const breakdown = raw.score_breakdown || {};
  const sezioni: any[] = raw.sezioni || raw.audit || [];
  const priorita: string[] = raw.priorita_top_3 || raw.azioni_prioritarie || [];
  const sintesi: string = raw.sintesi || "";
  const lastAuditAt = raw.last_audit_at;
  const nome = profile.business_profile?.nome || user?.email?.split("@")[0] || "Utente";
  const headline = profile.business_profile?.headline || "";

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* HEADER */}
      <Card className="bg-card border-border/50 sticky top-0 z-20 backdrop-blur">
        <CardContent className="p-6 flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-primary-foreground font-bold text-xl shrink-0">
            {nome.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">{nome}</h1>
            {headline && <p className="text-sm text-muted-foreground">{headline}</p>}
            {score > 0 && (
              <div className="flex items-center gap-3 mt-2">
                <div className={`px-3 py-1 rounded-lg border text-sm font-bold ${scoreColor(score)}`}>
                  {score}/100
                </div>
                <span className="text-xs text-muted-foreground">{scoreLevel(score)}</span>
                {lastAuditAt && (
                  <span className="text-[11px] text-muted-foreground">
                    · Aggiornato {new Date(lastAuditAt).toLocaleDateString("it-IT")}
                  </span>
                )}
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
                <RefreshCw className="h-4 w-4 mr-2" />
                Aggiorna audit
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuItem onClick={() => setAuditDialog(true)}>
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                <div>
                  <div className="font-medium">Veloce</div>
                  <div className="text-xs text-muted-foreground">No scrape · ~15s · gratis</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRescanDialog(true)}>
                <RotateCcw className="h-4 w-4 mr-2 text-primary" />
                <div>
                  <div className="font-medium">Completo (rifai scrape)</div>
                  <div className="text-xs text-muted-foreground">~45s · costa 1 scrape</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      {/* §1 STATO */}
      <section id="stato" className="space-y-4">
        <SectionTitle icon={<BarChart3 className="h-5 w-5" />} title="Stato profilo" />
        {score === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Nessun audit ancora disponibile. Clicca <strong>Aggiorna audit</strong> per generarne uno.
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border/50">
            <CardContent className="p-6 space-y-4">
              {Object.keys(breakdown).length > 0 && (
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  {Object.entries(breakdown).map(([k, v]) => {
                    const val = Number(v) || 0;
                    return (
                      <div key={k}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize">{k.replace(/_/g, " ")}</span>
                          <span className="font-bold tabular-nums">{val}</span>
                        </div>
                        <Progress value={val} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
              {priorita.length > 0 && (
                <div className="pt-3 border-t border-border/30">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Le 3 cose da fare subito
                  </p>
                  <div className="space-y-2">
                    {priorita.slice(0, 3).map((p, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-sm">{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {sintesi && (
                <p className="text-sm text-muted-foreground leading-relaxed pt-3 border-t border-border/30">
                  {sintesi}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {/* §2 CHI SEI */}
      <section id="chi-sei">
        <SectionTitle icon={<UserCheck className="h-5 w-5" />} title="Chi sei" />
        <ChiSeiSection />
      </section>

      {/* §3 BRAND VOICE */}
      <section id="brand-voice">
        <SectionTitle icon={<Palette className="h-5 w-5" />} title="Brand voice" />
        <BrandVoiceSection />
      </section>

      {/* §4 AUDIT */}
      <section id="audit">
        <SectionTitle icon={<Wand2 className="h-5 w-5" />} title="Audit per sezione" />
        {sezioni.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Lancia un audit per vedere il dettaglio delle sezioni.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {sezioni.map((s, i) => (
              <SezioneCard key={i} sezione={s} onRewrite={() => setRewriteDialog(s.nome)} />
            ))}
          </div>
        )}
      </section>

      {/* §5 BANNER */}
      <section id="banner">
        <SectionTitle icon={<Flag className="h-5 w-5" />} title="Banner profilo" />
        <Card className="bg-card border-border/50">
          <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium">Banner LinkedIn 1584×396</p>
              <p className="text-xs text-muted-foreground">Concept + palette + 3 prompt per generatori AI.</p>
            </div>
            <Button onClick={() => setBannerDialog(true)} className="bg-primary hover:bg-primary-hover text-primary-foreground">
              <ImageIcon className="h-4 w-4 mr-2" />
              Genera brief banner
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* §6 DATI LINKEDIN */}
      <section id="dati-linkedin">
        <Collapsible>
          <Card className="bg-card border-border/50">
            <CollapsibleTrigger asChild>
              <button className="w-full p-5 flex items-center justify-between hover:bg-accent/40 transition-colors text-left">
                <div>
                  <p className="text-sm font-medium">Dati LinkedIn</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.linkedin_url || "URL non impostato"}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="p-6 pt-0 space-y-3">
                <div className="text-xs text-muted-foreground space-y-1">
                  {lastAuditAt && <p>Ultimo audit: {new Date(lastAuditAt).toLocaleString("it-IT")}</p>}
                  <p>Scrape quota oggi: {profile.scrapes_used_today}/{profile.scrapes_daily_limit}</p>
                </div>
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Vedi dati grezzi (JSON)
                  </summary>
                  <pre className="mt-2 p-3 bg-surface/50 rounded-lg overflow-auto max-h-80 text-[10px]">
                    {JSON.stringify(profile.raw_profile_data, null, 2)}
                  </pre>
                </details>
                <Button
                  variant="outline" size="sm"
                  onClick={() => setRescanDialog(true)}
                  disabled={profile.scrapes_used_today >= profile.scrapes_daily_limit}
                  className="border-border/50"
                >
                  <RotateCcw className="h-3 w-3 mr-1.5" />
                  Rifai scrape LinkedIn (costa 1 scrape)
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </section>

      {/* DIALOGS */}
      <UpdateAuditDialog
        open={auditDialog} onClose={() => setAuditDialog(false)}
        profile={profile} updateRawProfileData={updateRawProfileData} consumeSkillRun={consumeSkillRun} logRun={logRun}
      />
      <RescanDialog
        open={rescanDialog} onClose={() => setRescanDialog(false)}
        profile={profile} userId={user?.id || ""}
        updateRawProfileData={updateRawProfileData} consumeSkillRun={consumeSkillRun} logRun={logRun}
        fetchProfile={fetchProfile}
      />
      <BannerBriefDialog
        open={bannerDialog} onClose={() => setBannerDialog(false)}
        profile={profile} userId={user?.id || ""} consumeSkillRun={consumeSkillRun} logRun={logRun}
      />
      <RewriteSectionDialog
        sectionName={rewriteDialog} onClose={() => setRewriteDialog(null)}
        sezioni={sezioni} profile={profile} userId={user?.id || ""}
        raw={raw} updateRawProfileData={updateRawProfileData} consumeSkillRun={consumeSkillRun} logRun={logRun}
      />
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

// ============================================================================
// §2 CHI SEI
// ============================================================================
function ChiSeiSection() {
  const { profile, updateProfile, updateRawProfileData } = useProfile();
  const initial = useMemo<BusinessProfile>(() => ({
    nome: "", headline: "", settore: "", chi_e: "", value_proposition: "",
    tone_of_voice: "Diretto e pratico", punti_forza: [], aree_miglioramento: [], tags: [],
    ...(profile?.business_profile || {}),
  }), [profile?.business_profile]);

  const [local, setLocal] = useState<BusinessProfile>(initial);
  const [targetDesc, setTargetDesc] = useState<string>("");
  const [targetPains, setTargetPains] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocal(initial);
    const tb = (profile?.raw_profile_data as any)?.target_buyer || {};
    setTargetDesc(tb.descrizione || "");
    setTargetPains(Array.isArray(tb.pain_points) ? tb.pain_points : []);
  }, [initial, profile?.raw_profile_data]);

  const dirty = useMemo(() => {
    const tbStored = (profile?.raw_profile_data as any)?.target_buyer || {};
    const tbStoredJson = JSON.stringify({ descrizione: tbStored.descrizione || "", pain_points: tbStored.pain_points || [] });
    const tbLocalJson = JSON.stringify({ descrizione: targetDesc, pain_points: targetPains });
    return JSON.stringify(local) !== JSON.stringify(initial) || tbStoredJson !== tbLocalJson;
  }, [local, initial, targetDesc, targetPains, profile?.raw_profile_data]);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ business_profile: local as any });
    const newRaw = {
      ...((profile?.raw_profile_data as any) || {}),
      target_buyer: { descrizione: targetDesc, pain_points: targetPains },
    };
    await updateRawProfileData(newRaw);
    setSaving(false);
    toast.success("Profilo salvato");
  };

  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-6 space-y-4">
        <Field label="Nome / Chi sei">
          <Input value={local.nome} onChange={(e) => setLocal({ ...local, nome: e.target.value })} className="bg-surface border-border/50" />
        </Field>
        <Field label="Headline LinkedIn (max 220)">
          <Input value={local.headline} maxLength={220} onChange={(e) => setLocal({ ...local, headline: e.target.value })} className="bg-surface border-border/50" />
        </Field>
        <Field label="Settore">
          <Input value={local.settore} onChange={(e) => setLocal({ ...local, settore: e.target.value })} className="bg-surface border-border/50" />
        </Field>
        <Field label="Value Proposition">
          <Textarea rows={3} value={local.value_proposition} onChange={(e) => setLocal({ ...local, value_proposition: e.target.value })} className="bg-surface border-border/50" />
        </Field>
        <Field label="Tone of voice">
          <Select value={local.tone_of_voice} onValueChange={(v) => setLocal({ ...local, tone_of_voice: v })}>
            <SelectTrigger className="bg-surface border-border/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Diretto e pratico">Diretto e pratico</SelectItem>
              <SelectItem value="Consultivo e autorevole">Consultivo e autorevole</SelectItem>
              <SelectItem value="Amichevole">Amichevole</SelectItem>
              <SelectItem value="Tecnico">Tecnico</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <TagEditor label="Punti di forza" tags={local.punti_forza || []} onChange={(t) => setLocal({ ...local, punti_forza: t })} />
        <TagEditor label="Aree di miglioramento" tags={local.aree_miglioramento || []} onChange={(t) => setLocal({ ...local, aree_miglioramento: t })} />
        <TagEditor label="Tags" tags={local.tags || []} onChange={(t) => setLocal({ ...local, tags: t })} />

        <div className="pt-4 border-t border-border/30 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target buyer</p>
          <Field label="Descrizione">
            <Textarea rows={2} value={targetDesc} onChange={(e) => setTargetDesc(e.target.value)} className="bg-surface border-border/50" />
          </Field>
          <TagEditor label="Pain points" tags={targetPains} onChange={setTargetPains} />
          <p className="text-xs text-muted-foreground">
            Hai più di un target? <Link to="/icps" className="text-primary hover:underline">Gestisci i tuoi ICP</Link>
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={!dirty || saving} className="bg-primary hover:bg-primary-hover text-primary-foreground">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salva modifiche
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TagEditor({ label, tags, onChange }: { label: string; tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t, i) => (
          <Badge key={i} variant="outline" className="border-border/50 gap-1">
            {t}
            <button onClick={() => onChange(tags.filter((_, j) => j !== i))} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              e.preventDefault();
              onChange([...tags, input.trim()]);
              setInput("");
            }
          }}
          placeholder="Aggiungi e premi Invio"
          className="bg-surface border-border/50 h-9 text-xs"
        />
        <Button
          type="button" variant="outline" size="sm"
          onClick={() => { if (input.trim()) { onChange([...tags, input.trim()]); setInput(""); } }}
          className="border-border/50"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </Field>
  );
}

// ============================================================================
// §3 BRAND VOICE
// ============================================================================
const DEFAULT_BRAND: BrandKit = { color: "#FF6A1C", tone: "corporate" };
const TONE_OPTIONS: Array<{ value: BrandKit["tone"]; label: string; description: string }> = [
  { value: "corporate", label: "Corporate", description: "Professionale, autorevole." },
  { value: "playful", label: "Playful", description: "Caldo, ironico, narrativo." },
  { value: "minimal", label: "Minimal", description: "Asciutto, frasi corte." },
  { value: "bold", label: "Bold", description: "Contrarian, opinionato." },
];

function BrandVoiceSection() {
  const { profile, updateProfile } = useProfile();
  const [color, setColor] = useState<string>(DEFAULT_BRAND.color);
  const [tone, setTone] = useState<BrandKit["tone"]>(DEFAULT_BRAND.tone);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const bk = ((profile as any)?.brand_kit ?? {}) as Partial<BrandKit>;
    setColor(bk.color || DEFAULT_BRAND.color);
    setTone(bk.tone || DEFAULT_BRAND.tone);
    setDirty(false);
  }, [profile]);

  const handleSave = async () => {
    if (!isValidHex(color)) { toast.error("Colore non valido"); return; }
    setSaving(true);
    await updateProfile({ brand_kit: { color: color.toUpperCase(), tone } as any });
    setSaving(false); setDirty(false);
    toast.success("Brand kit salvato");
  };

  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-6 space-y-5">
        <div>
          <p className="text-sm font-medium mb-2">Colore primario</p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-14 h-14 rounded-xl border-2 border-border/30 shrink-0"
              style={{ backgroundColor: isValidHex(color) ? color : "#888" }} />
            <input type="color" value={isValidHex(color) ? color : "#FF6A1C"}
              onChange={(e) => { setColor(e.target.value); setDirty(true); }}
              className="h-10 w-16 rounded-md border border-border/50 cursor-pointer bg-surface" />
            <Input value={color} onChange={(e) => { setColor(e.target.value); setDirty(true); }}
              className="bg-surface border-border/50 max-w-[160px] font-mono uppercase h-10" />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Tone of voice</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TONE_OPTIONS.map((t) => {
              const active = tone === t.value;
              return (
                <button
                  key={t.value} type="button"
                  onClick={() => { setTone(t.value); setDirty(true); }}
                  className={`text-xs px-3 py-2 rounded-lg border transition-colors text-left ${
                    active ? "bg-primary/10 border-primary text-primary" : "bg-surface border-border/50 hover:border-primary/50"
                  }`}
                >
                  <span className="font-medium block">{t.label}</span>
                  <span className="text-[10px] opacity-80 line-clamp-1">{t.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="p-4 rounded-xl border-2 text-sm"
          style={{
            background: `linear-gradient(135deg, ${color}15, ${color}05)`,
            borderColor: `${color}40`,
          }}
        >
          I tuoi post saranno scritti in tone <strong>{tone}</strong>, e i visual brief
          consiglieranno palette coerenti con il tuo colore primario.
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !dirty || !isValidHex(color)}
            className="bg-primary hover:bg-primary-hover text-primary-foreground">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salva brand kit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// §4 SEZIONE CARD
// ============================================================================
const REWRITABLE = new Set(["Headline", "About", "Featured"]);

function SezioneCard({ sezione, onRewrite }: { sezione: any; onRewrite: () => void }) {
  const score = Number(sezione.score) || 0;
  const rewritable = REWRITABLE.has(sezione.nome);
  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-5 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{sezione.nome}</h3>
            <div className={`px-2 py-0.5 rounded text-xs font-bold border ${scoreColor(score)}`}>
              {score}/100
            </div>
          </div>
          {rewritable && (
            <Button size="sm" variant="outline" onClick={onRewrite} className="border-border/50 hover:border-primary/50 hover:text-primary">
              <Wand2 className="h-3 w-3 mr-1.5" />
              Riscrivi
            </Button>
          )}
        </div>
        {sezione.stato_attuale && (
          <p className="text-xs text-muted-foreground"><strong>Stato:</strong> <span className="line-clamp-2">{sezione.stato_attuale}</span></p>
        )}
        {sezione.problema && (
          <p className="text-xs"><strong className="text-destructive">Problema:</strong> {sezione.problema}</p>
        )}
        {sezione.soluzione && (
          <p className="text-xs"><strong className="text-emerald-400">Soluzione:</strong> {sezione.soluzione}</p>
        )}
        {sezione.guida && (
          <p className="text-xs text-muted-foreground"><strong>Guida:</strong> {sezione.guida}</p>
        )}
        {sezione.esempio_riscritto && (
          <div className="bg-surface/50 p-3 rounded-lg mt-2 border border-border/30">
            <div className="flex justify-between items-start gap-2">
              <p className="text-xs whitespace-pre-wrap flex-1">{sezione.esempio_riscritto}</p>
              <CopyBtn text={sezione.esempio_riscritto} />
            </div>
          </div>
        )}
        {sezione.riscrittura && !sezione.esempio_riscritto && (
          <div className="bg-primary/5 p-3 rounded-lg mt-2 border border-primary/20">
            <div className="flex justify-between items-start gap-2">
              <p className="text-xs whitespace-pre-wrap flex-1">{sezione.riscrittura}</p>
              <CopyBtn text={sezione.riscrittura} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// DIALOGS
// ============================================================================
function UpdateAuditDialog({
  open, onClose, profile, updateRawProfileData, consumeSkillRun, logRun,
}: any) {
  const [loading, setLoading] = useState(false);
  const [obiettivo, setObiettivo] = useState("");

  const runAudit = async () => {
    setLoading(true);
    const start = Date.now();
    const result = await callSkill("profile-optimizer", {
      profilo_business: profile.business_profile,
      raw_profile_data: profile.raw_profile_data,
      obiettivo: obiettivo || (profile.business_profile as any)?.value_proposition || "",
      brand_kit: (profile as any).brand_kit || {},
    });
    if (!result.ok) {
      setLoading(false);
      const err = (result as { ok: false; error: any }).error; toast.error(emberErrorMessage(err));
      await logRun({ skill: "profile-optimizer", input: { obiettivo }, output: null, status: "error", is_scrape: false, error_message: err.message });
      return;
    }
    const d = result.data as any;
    const newRaw = {
      ...(profile.raw_profile_data || {}),
      score_totale: d.score_complessivo ?? d.score_totale,
      score_breakdown: d.score_breakdown,
      sezioni: d.audit || d.sezioni,
      priorita_top_3: d.priorita_top_3,
      sintesi: d.sintesi,
      last_audit_at: new Date().toISOString(),
      last_audit_mode: "quick",
    };
    await updateRawProfileData(newRaw);
    await logRun({ skill: "profile-optimizer", input: { obiettivo }, output: d, status: "completed", is_scrape: false, duration_ms: Date.now() - start });
    await consumeSkillRun(false);
    setLoading(false);
    toast.success("Audit aggiornato");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiorna audit (Veloce)</DialogTitle>
          <DialogDescription>
            Ricalcola score e riscritture senza rifare scrape LinkedIn. ~15s. Costa 1 skill-run.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Obiettivo (opzionale)">
            <Textarea rows={2} value={obiettivo} onChange={(e) => setObiettivo(e.target.value)}
              placeholder="Es. trovare 10 clienti enterprise nei prossimi 90 giorni"
              className="bg-surface border-border/50" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Annulla</Button>
          <Button onClick={runAudit} disabled={loading} className="bg-primary hover:bg-primary-hover text-primary-foreground">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Lancia audit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RescanDialog({
  open, onClose, profile, userId, updateRawProfileData, consumeSkillRun, logRun, fetchProfile,
}: any) {
  const [loading, setLoading] = useState(false);
  const noQuota = profile.scrapes_used_today >= profile.scrapes_daily_limit;

  const handleRescan = async () => {
    if (!profile.linkedin_url) { toast.error("URL LinkedIn mancante"); return; }
    setLoading(true);
    const start = Date.now();
    const result = await callSkill("auto-profile-setup", {
      user_id: userId, linkedin_url: profile.linkedin_url,
    });
    if (!result.ok) {
      setLoading(false);
      const err = (result as { ok: false; error: any }).error; toast.error(emberErrorMessage(err));
      await logRun({ skill: "auto-profile-setup", input: { linkedin_url: profile.linkedin_url }, output: null, status: "error", is_scrape: true, error_message: err.message });
      return;
    }
    const d = result.data as any;
    await updateRawProfileData({ ...d, last_audit_at: new Date().toISOString(), last_audit_mode: "full" });
    await logRun({ skill: "auto-profile-setup", input: { linkedin_url: profile.linkedin_url }, output: d, status: "completed", is_scrape: true, duration_ms: Date.now() - start });
    await consumeSkillRun(true);
    await fetchProfile();
    setLoading(false);
    toast.success("Profilo riscansionato");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rifai scrape LinkedIn</DialogTitle>
          <DialogDescription>
            Riscansiona il tuo profilo e ricalcola audit completo. ~45s.
            Costa <strong>1 scrape</strong> ({profile.scrapes_daily_limit - profile.scrapes_used_today} disponibili oggi).
          </DialogDescription>
        </DialogHeader>
        {noQuota && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Quota scrape esaurita. Riprova domani o passa a un piano superiore.</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Annulla</Button>
          <Button onClick={handleRescan} disabled={loading || noQuota}
            className="bg-primary hover:bg-primary-hover text-primary-foreground">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
            Rifai scrape
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BannerBriefDialog({ open, onClose, profile, userId, consumeSkillRun, logRun }: any) {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<any>(null);

  const generate = async () => {
    setLoading(true);
    const start = Date.now();
    const result = await callSkill("profile-banner-brief", {
      user_id: userId,
      profilo_business: profile.business_profile,
      brand_kit: (profile as any).brand_kit || {},
    });
    if (!result.ok) {
      setLoading(false);
      const err = (result as { ok: false; error: any }).error; toast.error(emberErrorMessage(err));
      await logRun({ skill: "profile-banner-brief", input: {}, output: null, status: "error", is_scrape: false, error_message: err.message });
      return;
    }
    setOutput(result.data);
    await logRun({ skill: "profile-banner-brief", input: {}, output: result.data, status: "completed", is_scrape: false, duration_ms: Date.now() - start });
    await consumeSkillRun(false);
    setLoading(false);
  };

  useEffect(() => {
    if (open && !output && !loading) generate();
    if (!open) setOutput(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Brief banner LinkedIn (1584×396)</DialogTitle>
          <DialogDescription>Concept + palette + 3 prompt da incollare su Midjourney/Flux/DALL·E.</DialogDescription>
        </DialogHeader>
        {loading && <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>}
        {output && (
          <div className="space-y-4 text-sm">
            {output.concept && (<div><p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Concept</p><p>{output.concept}</p></div>)}
            {output.palette && (
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Palette</p>
                <div className="flex gap-2">
                  {(Array.isArray(output.palette) ? output.palette : Object.values(output.palette)).map((c: any, i: number) => (
                    <div key={i} className="w-12 h-12 rounded-lg border border-border/30" style={{ backgroundColor: c }} title={c} />
                  ))}
                </div>
              </div>
            )}
            {output.prompts && Array.isArray(output.prompts) && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Prompt</p>
                {output.prompts.map((p: any, i: number) => (
                  <div key={i} className="bg-surface/50 p-3 rounded-lg border border-border/30">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs whitespace-pre-wrap flex-1 font-mono">{typeof p === "string" ? p : p.prompt || JSON.stringify(p)}</p>
                      <CopyBtn text={typeof p === "string" ? p : p.prompt || ""} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {output.safe_zone && (<div className="text-xs text-muted-foreground"><strong>Safe zone:</strong> {output.safe_zone}</div>)}
          </div>
        )}
        <DialogFooter>
          {output && (
            <Button variant="outline" onClick={() => { setOutput(null); generate(); }} disabled={loading} className="border-border/50">
              <RefreshCw className="h-4 w-4 mr-2" /> Rigenera
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Chiudi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RewriteSectionDialog({
  sectionName, onClose, sezioni, profile, userId, raw, updateRawProfileData, consumeSkillRun, logRun,
}: any) {
  const open = sectionName !== null;
  const section = sezioni.find((s: any) => s.nome === sectionName);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [newText, setNewText] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setFeedback(""); setNewText(null); }
  }, [open]);

  const generate = async () => {
    if (!section || !userId) return;
    setLoading(true);
    const start = Date.now();
    const result = await callRegenerateSection({
      user_id: userId,
      section: section.nome,
      stato_attuale: section.stato_attuale || "",
      current_rewrite: section.riscrittura || section.esempio_riscritto || "",
      profile_context: (profile.business_profile || {}) as any,
      user_feedback: feedback || undefined,
    });
    if (!result.ok) {
      setLoading(false);
      const err = (result as { ok: false; error: any }).error; toast.error(emberErrorMessage(err));
      await logRun({ skill: "regenerate-section", input: { section: section.nome }, output: null, status: "error", is_scrape: false, error_message: err.message });
      return;
    }
    setNewText(result.data.new_rewrite);
    await logRun({ skill: "regenerate-section", input: { section: section.nome }, output: result.data, status: "completed", is_scrape: false, duration_ms: Date.now() - start });
    await consumeSkillRun(false);
    setLoading(false);
  };

  const saveToProfile = async () => {
    if (!newText) return;
    const updated = {
      ...raw,
      sezioni: (raw.sezioni || []).map((s: any) =>
        s.nome === sectionName ? { ...s, riscrittura: newText } : s,
      ),
    };
    await updateRawProfileData(updated);
    toast.success("Riscrittura salvata. Copiala su LinkedIn quando vuoi.");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Riscrivi {sectionName}</DialogTitle>
          <DialogDescription>
            Genera una nuova versione di questa sezione. Costa 1 skill-run.
          </DialogDescription>
        </DialogHeader>
        {section && (
          <div className="space-y-3 text-sm">
            {section.stato_attuale && (
              <div className="bg-surface/50 p-3 rounded-lg border border-border/30">
                <p className="text-[10px] uppercase text-muted-foreground mb-1">Attuale</p>
                <p className="text-xs whitespace-pre-wrap line-clamp-4">{section.stato_attuale}</p>
              </div>
            )}
            <Field label="Feedback (opzionale)">
              <Textarea rows={2} value={feedback} onChange={(e) => setFeedback(e.target.value)}
                placeholder="Es. più diretto, più tecnico, includi target..."
                className="bg-surface border-border/50" />
            </Field>
            {newText && (
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <p className="text-[10px] uppercase text-primary">Nuova versione</p>
                  <CopyBtn text={newText} />
                </div>
                <p className="text-xs whitespace-pre-wrap">{newText}</p>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          {newText ? (
            <>
              <Button variant="outline" onClick={generate} disabled={loading} className="border-border/50">
                <RefreshCw className="h-4 w-4 mr-2" /> Rigenera
              </Button>
              <Button onClick={saveToProfile} className="bg-primary hover:bg-primary-hover text-primary-foreground">
                <Save className="h-4 w-4 mr-2" /> Salva nel profilo
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onClose} disabled={loading}>Annulla</Button>
              <Button onClick={generate} disabled={loading} className="bg-primary hover:bg-primary-hover text-primary-foreground">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                Genera
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
