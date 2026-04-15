// src/pages/SkillPage.tsx — versione REALE (chiama n8n)
import { useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { SKILLS, canUseSkill } from "@/lib/ember-types";
import { callSkill, emberErrorMessage } from "@/lib/ember-api";
import { useProfile } from "@/hooks/useProfile";
import { useSkillRuns } from "@/hooks/useSkillRuns";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkillIcon } from "@/components/SkillIcon";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Copy, RefreshCw, Loader2, ChevronRight, CheckCircle, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// ============ UTILITY COMPONENTS ============

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiato!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="hover:text-primary transition-colors">
      {copied ? <CheckCircle className="h-3 w-3 mr-1 text-success" /> : <Copy className="h-3 w-3 mr-1" />}
      {copied ? "Copiato" : "Copia"}
    </Button>
  );
}

function CharCounter({ text, limit }: { text: string; limit: number }) {
  const count = text.length;
  const pct = (count / limit) * 100;
  return (
    <span className={`text-xs tabular-nums ${count > limit ? 'text-destructive' : pct > 80 ? 'text-warning' : 'text-muted-foreground'}`}>
      {count}/{limit}
    </span>
  );
}

// ============ BUILD PAYLOAD PER N8N ============

function buildPayload(
  skillId: string,
  values: Record<string, string>,
  businessProfile: Record<string, unknown> | null,
  userId: string,
): Record<string, unknown> {
  const bp = businessProfile || {};

  switch (skillId) {
    case 'auto-profile-setup':
      return { user_id: userId, linkedin_url: values.url };
    case 'profile-optimizer':
      return { profilo_business: bp, obiettivo: values.obiettivo || "attrarre clienti B2B" };
    case 'post-writer':
      return { profilo_business: bp, tema: values.brief, formato: (values.format || "storytelling").toLowerCase() };
    case 'visual-post-builder':
      return { post_text: values.post, formato_visual: (values.style || "carousel").toLowerCase() };
    case 'content-performance':
      return { posts: [], periodo: "30d" };
    case 'icp-builder':
      return { profilo_business: bp, obiettivo_commerciale: values.description };
    case 'prospect-finder':
      return { linkedin_url_target: values.url || "", icp: values.query ? { descrizione: values.query } : {} };
    case 'outreach-drafter':
      return {
        target_context: { nome: values.nome, headline: values.headline, azienda: values.azienda, note: values.note },
        canale: "connection_request",
        tono: "consulenziale",
      };
    case 'reply-suggester':
      return { conversazione: values.message, obiettivo: values.context || "qualificare" };
    case 'network-intelligence':
      return { watchlist_ids: [], periodo_giorni: 14 };
    default:
      return values;
  }
}

// ============ SKILL OUTPUT RENDERERS ============

function SkillOutput({ skillId, output }: { skillId: string; output: Record<string, unknown> }) {
  const data = output as any;

  if (skillId === 'profile-optimizer') {
    return (
      <div className="space-y-6 animate-in">
        {data.score != null && (
          <div className="text-center py-2">
            <ScoreBadge score={data.score} size="lg" className="mx-auto" />
          </div>
        )}
        {data.sections && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.sections.map((s: any, i: number) => (
              <Card key={i} className="bg-surface/50 border-border/30 hover:border-border transition-all group">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{s.name}</span>
                    {s.score != null && <ScoreBadge score={s.score} size="sm" />}
                  </div>
                  {s.problem && <p className="text-xs text-muted-foreground mb-1">{s.problem}</p>}
                  {s.action && <p className="text-xs text-primary">→ {s.action}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {(data.about_rewrite || data.about) && (
          <div>
            <h3 className="font-semibold mb-2">About riscritto</h3>
            <div className="bg-surface/50 border border-border/30 rounded-xl p-5 relative">
              <pre className="text-sm whitespace-pre-wrap leading-relaxed">{data.about_rewrite || data.about}</pre>
              <div className="mt-3 pt-3 border-t border-border/20">
                <CopyButton text={data.about_rewrite || data.about} />
              </div>
            </div>
          </div>
        )}
        {(data.headlines || data.headline) && (
          <div>
            <h3 className="font-semibold mb-2">Headline riscritte</h3>
            {(Array.isArray(data.headlines) ? data.headlines : [data.headline]).map((h: string, i: number) => (
              <div key={i} className="flex items-center gap-2 bg-surface/50 border border-border/30 rounded-xl p-4 mb-2 hover:border-primary/30 transition-colors">
                <p className="text-sm flex-1">{h}</p>
                <CopyButton text={h} />
              </div>
            ))}
          </div>
        )}
        {(data.keywords || data.skills_to_add) && (
          <div>
            <h3 className="font-semibold mb-2">Keywords / Skills suggerite</h3>
            <div className="flex flex-wrap gap-2">
              {(data.keywords || data.skills_to_add || []).map((k: string) => (
                <Badge key={k} className="bg-primary/10 text-primary border-0 cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => { navigator.clipboard.writeText(k); toast.success("Copiato!"); }}>{k}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (skillId === 'post-writer') {
    const hook = data.hook || data.post_text?.split('\n')[0] || "";
    const body = data.body || data.post_text || "";
    const cta = data.cta || "";
    const hashtags = data.hashtags || [];
    return (
      <div className="space-y-4 animate-in">
        <div className="border-l-4 border-primary bg-primary/5 p-5 rounded-r-xl">
          <p className="font-bold text-lg whitespace-pre-wrap leading-relaxed">{hook}</p>
        </div>
        <div className="text-sm whitespace-pre-wrap leading-relaxed px-1">{body}</div>
        {cta && (
          <div className="bg-primary/5 border border-primary/20 p-5 rounded-xl">
            <p className="text-sm whitespace-pre-wrap">{cta}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {hashtags.map((h: string) => <Badge key={h} variant="outline" className="border-border/50">{h}</Badge>)}
        </div>
        {data.alt_hook && (
          <details className="text-sm group">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">Hook alternativo</summary>
            <p className="mt-2 whitespace-pre-wrap bg-surface/50 p-4 rounded-xl border border-border/30 animate-in">{data.alt_hook}</p>
          </details>
        )}
        {(data.best_time || data.estimated_read_time_sec) && (
          <p className="text-xs text-muted-foreground">⏰ {data.best_time ? `Orario suggerito: ${data.best_time}` : `Tempo lettura: ~${data.estimated_read_time_sec}s`}</p>
        )}
        <div className="flex gap-2 pt-2">
          <CopyButton text={`${hook}\n\n${body}\n\n${cta}\n\n${hashtags.join(' ')}`} />
          <Link to={`/skill/visual-post-builder?post=${encodeURIComponent(hook + '\n' + body)}`}>
            <Button variant="outline" size="sm" className="border-border/50 hover:border-primary/50 hover:text-primary transition-all">
              Crea visual <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (skillId === 'visual-post-builder') {
    return (
      <div className="space-y-5 animate-in">
        {(data.canva_query || data.cover_slide) && (
          <div>
            <h3 className="font-semibold mb-3">🎨 Struttura Visual</h3>
            {data.cover_slide && (
              <div className="bg-surface/50 border border-border/30 rounded-xl p-4 mb-2">
                <p className="font-medium text-sm">{data.cover_slide.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{data.cover_slide.body}</p>
              </div>
            )}
            {data.slide_content?.map((s: any, i: number) => (
              <div key={i} className="bg-surface/50 border border-border/30 rounded-xl p-4 mb-2">
                <p className="font-medium text-sm">{i + 1}. {s.title || s}</p>
                {s.body && <p className="text-xs text-muted-foreground mt-1">{s.body}</p>}
              </div>
            ))}
            {data.cta_slide && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="font-medium text-sm">{data.cta_slide.title}</p>
                <p className="text-xs text-primary mt-1">{data.cta_slide.cta_text}</p>
              </div>
            )}
          </div>
        )}
        {data.midjourney_prompt && (
          <div>
            <h3 className="font-semibold mb-3">🤖 AI Image Prompt</h3>
            <div className="bg-surface/50 border border-border/30 rounded-xl p-4">
              <p className="text-sm font-mono">{data.midjourney_prompt}</p>
              <div className="mt-2">
                <CopyButton text={data.midjourney_prompt} />
              </div>
            </div>
          </div>
        )}
        {data.palette && (
          <div>
            <h3 className="font-semibold mb-3">Palette</h3>
            <div className="flex gap-3">
              {data.palette.map((c: string) => (
                <div key={c} className="flex items-center gap-2 group">
                  <div className="w-10 h-10 rounded-lg shadow-inner group-hover:scale-110 transition-transform" style={{ background: c }} />
                  <span className="text-xs font-mono text-muted-foreground">{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (skillId === 'content-performance') {
    return (
      <div className="space-y-5 animate-in">
        {data.score != null && <div className="text-center py-2"><ScoreBadge score={data.score} size="lg" className="mx-auto" /></div>}
        {data.patterns && (
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(data.patterns).map(([k, v]) => (
              <div key={k} className="bg-surface/50 border border-border/30 rounded-xl p-4">
                <p className="text-xs text-muted-foreground">{k.replace(/_/g, " ")}</p>
                <p className="text-sm font-medium mt-1">{String(v)}</p>
              </div>
            ))}
          </div>
        )}
        {data.recommendations && (
          <div>
            <h3 className="font-semibold mb-2">Raccomandazioni</h3>
            {data.recommendations.map((r: string, i: number) => <p key={i} className="text-sm text-muted-foreground mb-1">{i + 1}. {typeof r === 'string' ? r : JSON.stringify(r)}</p>)}
          </div>
        )}
        {data.next_30d_plan && (
          <div>
            <h3 className="font-semibold mb-2">Piano prossimi 30 giorni</h3>
            {data.next_30d_plan.map((a: string, i: number) => <p key={i} className="text-sm text-muted-foreground mb-1">→ {typeof a === 'string' ? a : JSON.stringify(a)}</p>)}
          </div>
        )}
      </div>
    );
  }

  if (skillId === 'icp-builder') {
    return (
      <div className="space-y-5 animate-in">
        {data.icp && (
          <div>
            <h3 className="font-semibold mb-3">🎯 ICP Card</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(data.icp).map(([k, v]) => (
                <div key={k} className="bg-surface/50 border border-border/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground">{k.replace(/_/g, " ")}</p>
                  <p className="text-sm font-medium mt-1">{Array.isArray(v) ? (v as string[]).join(", ") : String(v)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.linkedin_search_query && (
          <div>
            <h3 className="font-semibold mb-2">Sales Navigator Query</h3>
            <div className="bg-surface/50 border border-border/30 rounded-xl p-4">
              <p className="text-sm font-mono">{data.linkedin_search_query}</p>
              <div className="mt-2"><CopyButton text={data.linkedin_search_query} /></div>
            </div>
          </div>
        )}
        {data.buyer_personas && (
          <div>
            <h3 className="font-semibold mb-2">Buyer Personas</h3>
            {data.buyer_personas.map((bp: any, i: number) => (
              <div key={i} className="bg-surface/50 border border-border/30 rounded-xl p-4 mb-2">
                <pre className="text-sm whitespace-pre-wrap">{typeof bp === 'string' ? bp : JSON.stringify(bp, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
        <Link to={`/skill/prospect-finder?icp=${encodeURIComponent(data.linkedin_search_query || '')}`}>
          <Button className="w-full bg-primary hover:bg-primary-hover text-primary-foreground">
            Cerca prospect con questo ICP <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  if (skillId === 'prospect-finder') {
    const prospects = data.prospects || (data.fit_score != null ? [data] : []);
    return (
      <div className="space-y-4 animate-in">
        {prospects.map((p: any, i: number) => (
          <Card key={i} className="bg-surface/50 border-border/30 hover:border-border transition-all">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{p.nome || "Prospect"}</h3>
                    {p.fit_score != null && <ScoreBadge score={p.fit_score} size="sm" />}
                  </div>
                  {p.headline && <p className="text-xs text-muted-foreground mt-1">{p.headline}</p>}
                  {(p.reason || p.fit_rationale) && <p className="text-xs text-primary mt-1">{p.reason || p.fit_rationale}</p>}
                </div>
              </div>
              {(p.connection_request || p.opening_hook) && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-sm">{p.connection_request || p.opening_hook}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <CopyButton text={p.connection_request || p.opening_hook} />
                    <Link to={`/skill/outreach-drafter?nome=${encodeURIComponent(p.nome || '')}&headline=${encodeURIComponent(p.headline || '')}&azienda=${encodeURIComponent(p.azienda || '')}`}>
                      <Button variant="outline" size="sm" className="border-border/50 hover:border-primary/50 text-xs">
                        Outreach completo <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (skillId === 'outreach-drafter') {
    const sections = [
      { title: "Messaggio principale", items: [data.messaggio_principale].filter(Boolean), limit: 300 },
      { title: "Varianti", items: [data.variante_A, data.variante_B].filter(Boolean), limit: 300 },
      { title: "Follow-up", items: [data.follow_up_7gg, data.follow_up_14gg].filter(Boolean), limit: 0 },
    ];
    if (data.connection_requests) {
      return (
        <div className="space-y-6 animate-in">
          {[
            { title: 'Connection Request', items: data.connection_requests, limit: 300 },
            { title: 'Primo Messaggio', items: data.first_messages, limit: 500 },
            { title: 'Follow-up', items: data.followups, limit: 0 },
          ].map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-3">{section.title}</h3>
              <div className="space-y-2">
                {section.items?.map((item: any, idx: number) => (
                  <div key={idx} className="bg-surface/50 border border-border/30 rounded-xl p-4">
                    <Badge variant="outline" className="mb-2 text-[10px]">{item.variant || item.timing}</Badge>
                    <p className="text-sm whitespace-pre-wrap">{item.text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {section.limit > 0 ? <CharCounter text={item.text} limit={section.limit} /> : null}
                      <CopyButton text={item.text} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-6 animate-in">
        {sections.map(section => section.items.length > 0 && (
          <div key={section.title}>
            <h3 className="font-semibold mb-3">{section.title}</h3>
            {section.items.map((text: string, i: number) => (
              <div key={i} className="bg-surface/50 border border-border/30 rounded-xl p-4 mb-2">
                <p className="text-sm whitespace-pre-wrap">{text}</p>
                <div className="flex items-center gap-2 mt-2">
                  {section.limit > 0 ? <CharCounter text={text} limit={section.limit} /> : null}
                  <CopyButton text={text} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (skillId === 'reply-suggester') {
    const classification = data.classification || { stato: data.stato_conversazione, intent: data.intent_rilevato };
    const replies = data.replies || data.reply_options || [];
    return (
      <div className="space-y-5 animate-in">
        <div className="flex flex-wrap gap-2">
          {Object.entries(classification).filter(([, v]) => v).map(([k, v]) => (
            <Badge key={k} variant="outline" className="border-border/50">{k}: {String(v)}</Badge>
          ))}
        </div>
        <div className="space-y-3">
          {replies.map((r: any, i: number) => (
            <Card key={i} className="bg-surface/50 border-border/30 hover:border-border transition-all">
              <CardContent className="p-4">
                <Badge className="bg-primary/10 text-primary border-0 mb-2">{r.approach || r.angolo || `Opzione ${i + 1}`}</Badge>
                <p className="text-sm whitespace-pre-wrap">{r.text || r.testo}</p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs text-muted-foreground flex-1">{r.next_step ? `Next step: ${r.next_step}` : ""}</p>
                  <CopyButton text={r.text || r.testo} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {data.next_best_action && <p className="text-sm text-primary">💡 {data.next_best_action}</p>}
      </div>
    );
  }

  if (skillId === 'network-intelligence') {
    const signals = data.signals || data.segnali_da_monitorare || [];
    return (
      <div className="space-y-4 animate-in">
        {data.last_check && <p className="text-xs text-muted-foreground">Ultimo check: {new Date(data.last_check).toLocaleDateString('it-IT')}</p>}
        {signals.map((s: any, i: number) => (
          <Card key={i} className="bg-surface/50 border-border/30 hover:border-border transition-all">
            <CardContent className="p-4">
              {s.nome && <span className="font-medium text-sm mr-2">{s.nome}</span>}
              {s.type && <Badge variant="outline" className="text-[10px] mr-2">{s.type.replace('_', ' ')}</Badge>}
              <p className="text-xs text-muted-foreground mt-1">{s.detail || s.descrizione || (typeof s === 'string' ? s : JSON.stringify(s))}</p>
              {s.message && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mt-2">
                  <p className="text-sm">{s.message}</p>
                  <div className="mt-2">
                    <CopyButton text={s.message} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {data.next_actions_per_segnale && (
          <div>
            <h3 className="font-semibold mb-2">Azioni suggerite</h3>
            {data.next_actions_per_segnale.map((a: any, i: number) => <p key={i} className="text-sm text-muted-foreground mb-1">→ {typeof a === 'string' ? a : JSON.stringify(a)}</p>)}
          </div>
        )}
        <Link to="/watchlist">
          <Button variant="outline" className="w-full border-border/50 hover:border-primary/50">Gestisci watchlist</Button>
        </Link>
      </div>
    );
  }

  // Fallback generico: mostra JSON formattato
  return (
    <div className="space-y-3 animate-in">
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className="bg-surface/50 border border-border/30 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">{k.replace(/_/g, ' ')}</p>
          <pre className="text-sm whitespace-pre-wrap">{typeof v === 'string' ? v : JSON.stringify(v, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
}

// ============ SKILL FORM ============

function SkillForm({ skillId, onSubmit, loading }: { skillId: string; onSubmit: (data: Record<string, string>) => void; loading: boolean }) {
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    if (skillId === 'visual-post-builder') init.post = searchParams.get('post') || '';
    if (skillId === 'prospect-finder') { const icp = searchParams.get('icp'); if (icp) init.query = icp; }
    if (skillId === 'outreach-drafter') {
      init.nome = searchParams.get('nome') || '';
      init.headline = searchParams.get('headline') || '';
      init.azienda = searchParams.get('azienda') || '';
    }
    return init;
  });

  const set = (k: string, v: string) => setValues(prev => ({ ...prev, [k]: v }));

  const submitBtn = (
    <Button onClick={() => onSubmit(values)} disabled={loading} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground h-11 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
      {loading ? "Elaborazione..." : "Genera"}
    </Button>
  );

  if (skillId === 'auto-profile-setup') {
    return (
      <div className="space-y-4">
        <Input placeholder="https://www.linkedin.com/in/..." value={values.url || ''} onChange={e => set('url', e.target.value)} className="bg-surface border-border/50 focus:border-primary h-11" />
        {submitBtn}
      </div>
    );
  }
  if (skillId === 'profile-optimizer') {
    return (
      <div className="space-y-4">
        <Input placeholder="Obiettivo (es: attrarre clienti B2B)" value={values.obiettivo || ''} onChange={e => set('obiettivo', e.target.value)} className="bg-surface border-border/50 focus:border-primary h-11" />
        <Button onClick={() => onSubmit(values)} disabled={loading} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground h-11 shadow-lg shadow-primary/20">
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />} {loading ? "Analisi..." : "Lancia audit"}
        </Button>
      </div>
    );
  }
  if (skillId === 'post-writer') {
    return (
      <div className="space-y-4">
        <Textarea placeholder="Di cosa vuoi parlare? (es: Come ho acquisito 10 clienti in 30 giorni)" value={values.brief || ''} onChange={e => set('brief', e.target.value)} className="bg-surface border-border/50 focus:border-primary transition-colors" rows={4} />
        <Select value={values.format || 'Storytelling'} onValueChange={v => set('format', v)}>
          <SelectTrigger className="bg-surface border-border/50"><SelectValue placeholder="Formato" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Storytelling">Storytelling</SelectItem>
            <SelectItem value="Insight">Insight</SelectItem>
            <SelectItem value="Case Study">Case Study</SelectItem>
            <SelectItem value="Polarizzante">Polarizzante</SelectItem>
          </SelectContent>
        </Select>
        {submitBtn}
      </div>
    );
  }
  if (skillId === 'visual-post-builder') {
    return (
      <div className="space-y-4">
        <Textarea placeholder="Incolla il testo del post..." value={values.post || ''} onChange={e => set('post', e.target.value)} className="bg-surface border-border/50 focus:border-primary transition-colors" rows={4} />
        <Select value={values.style || 'Minimal'} onValueChange={v => set('style', v)}>
          <SelectTrigger className="bg-surface border-border/50"><SelectValue placeholder="Stile" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Minimal">Minimal</SelectItem>
            <SelectItem value="Bold">Bold</SelectItem>
            <SelectItem value="Data Viz">Data Viz</SelectItem>
            <SelectItem value="Storytelling">Storytelling</SelectItem>
          </SelectContent>
        </Select>
        {submitBtn}
      </div>
    );
  }
  if (skillId === 'content-performance') {
    return (
      <Button onClick={() => onSubmit(values)} disabled={loading} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground h-11 shadow-lg shadow-primary/20">
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />} {loading ? "Analisi..." : "Analizza i miei post"}
      </Button>
    );
  }
  if (skillId === 'icp-builder') {
    return (
      <div className="space-y-4">
        <Textarea placeholder="Descrivi il tuo cliente ideale..." value={values.description || ''} onChange={e => set('description', e.target.value)} className="bg-surface border-border/50 focus:border-primary transition-colors" rows={4} />
        {submitBtn}
      </div>
    );
  }
  if (skillId === 'prospect-finder') {
    return (
      <div className="space-y-4">
        <Input placeholder="URL LinkedIn del prospect" value={values.url || ''} onChange={e => set('url', e.target.value)} className="bg-surface border-border/50 focus:border-primary h-11" />
        <Textarea placeholder="Descrizione ICP o contesto (opzionale)" value={values.query || ''} onChange={e => set('query', e.target.value)} className="bg-surface border-border/50 focus:border-primary transition-colors" rows={2} />
        {submitBtn}
      </div>
    );
  }
  if (skillId === 'outreach-drafter') {
    return (
      <div className="space-y-4">
        <Input placeholder="Nome" value={values.nome || ''} onChange={e => set('nome', e.target.value)} className="bg-surface border-border/50 focus:border-primary h-11" />
        <Input placeholder="Headline" value={values.headline || ''} onChange={e => set('headline', e.target.value)} className="bg-surface border-border/50 focus:border-primary h-11" />
        <Input placeholder="Azienda" value={values.azienda || ''} onChange={e => set('azienda', e.target.value)} className="bg-surface border-border/50 focus:border-primary h-11" />
        <Textarea placeholder="Note aggiuntive (opzionale)" value={values.note || ''} onChange={e => set('note', e.target.value)} className="bg-surface border-border/50 focus:border-primary transition-colors" rows={2} />
        {submitBtn}
      </div>
    );
  }
  if (skillId === 'reply-suggester') {
    return (
      <div className="space-y-4">
        <Textarea placeholder="Incolla il messaggio ricevuto..." value={values.message || ''} onChange={e => set('message', e.target.value)} className="bg-surface border-border/50 focus:border-primary transition-colors" rows={4} />
        <Textarea placeholder="Obiettivo (es: fissare call, qualificare)" value={values.context || ''} onChange={e => set('context', e.target.value)} className="bg-surface border-border/50 focus:border-primary transition-colors" rows={2} />
        {submitBtn}
      </div>
    );
  }
  if (skillId === 'network-intelligence') {
    return (
      <Button onClick={() => onSubmit(values)} disabled={loading} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground h-11 shadow-lg shadow-primary/20">
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />} {loading ? "Aggiornamento..." : "Aggiorna ora"}
      </Button>
    );
  }
  return submitBtn;
}

// ============ MAIN COMPONENT ============

export default function SkillPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const { user } = useAuth();
  const skill = SKILLS.find(s => s.id === skillId);
  const { profile, consumeSkillRun } = useProfile();
  const { logRun } = useSkillRuns();
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!skill) return <AppLayout><div className="text-center py-16"><p className="text-muted-foreground">Skill non trovata.</p></div></AppLayout>;

  const handleSubmit = async (formValues: Record<string, string>) => {
    if (!profile || !user) return;

    const check = canUseSkill(profile, skill);
    if (!check.allowed) {
      toast.error(check.reason || "Non puoi usare questa skill.");
      return;
    }

    setLoading(true);
    setOutput(null);
    setError(null);

    const payload = buildPayload(skill.id, formValues, profile.business_profile as unknown as Record<string, unknown> | null, user.id);
    const result = await callSkill(skill.id, payload);

    if (result.ok) {
      setOutput(result.data as Record<string, unknown>);
      await logRun({
        skill: skill.id,
        input: payload,
        output: result.data as Record<string, unknown>,
        status: 'completed',
        is_scrape: skill.usesScraping,
        duration_ms: result.duration_ms,
      });
      await consumeSkillRun(skill.usesScraping);
      toast.success(`${skill.name} completata in ${(result.duration_ms / 1000).toFixed(1)}s`);
    } else {
      const msg = emberErrorMessage(result.error);
      setError(msg);
      toast.error(msg);
      await logRun({
        skill: skill.id,
        input: payload,
        output: null,
        status: 'error',
        is_scrape: false,
        error_message: result.error.message,
      });
    }

    setLoading(false);
  };

  const scrapingRemaining = profile ? profile.scrapes_daily_limit - profile.scrapes_used_today : 0;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4 animate-in">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <SkillIcon name={skill.icon} className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{skill.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">{skill.description}</p>
          </div>
        </div>

        {/* Form */}
        <Card className="bg-card/80 border-border/50 backdrop-blur-sm animate-in">
          <CardContent className="p-6">
            <SkillForm skillId={skill.id} onSubmit={handleSubmit} loading={loading} />
            {skill.usesScraping && (
              <p className="text-xs text-warning mt-3 flex items-center gap-1">
                ⚡ Usa 1 credito scraping <span className="text-muted-foreground">({scrapingRemaining} rimasti oggi)</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Error */}
        {error && !loading && (
          <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl p-4 animate-in">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 animate-in">
            <div className="relative inline-block">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="absolute inset-0 h-10 w-10 rounded-full animate-ping bg-primary/10" />
            </div>
            <p className="text-foreground font-medium mt-6">Ember sta lavorando...</p>
            <p className="text-xs text-muted-foreground mt-1">Tempo stimato: {skill.usesScraping ? "30-60" : "15-30"} secondi</p>
          </div>
        )}

        {/* Output */}
        {output && !loading && (
          <Card className="bg-card/80 border-border/50 backdrop-blur-sm animate-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">Risultato</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleSubmit({})} className="hover:text-primary transition-colors">
                  <RefreshCw className="h-3 w-3 mr-1" /> Rigenera
                </Button>
              </div>
              <SkillOutput skillId={skill.id} output={output} />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
