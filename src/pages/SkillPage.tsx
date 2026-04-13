import { useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { SKILLS } from "@/lib/ember-types";
import { mockProfile } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkillIcon } from "@/components/SkillIcon";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Copy, RefreshCw, Loader2, ChevronRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";

// Mock outputs per skill
const mockOutputs: Record<string, Record<string, unknown>> = {
  'auto-profile-setup': {
    nome: 'Marco Rossi',
    headline: 'Consulente Digital Marketing | Aiuto PMI italiane a crescere su LinkedIn',
    settore: 'Marketing Digitale',
    value_proposition: 'Trasformo la presenza LinkedIn di professionisti e PMI in un motore di lead generation.',
  },
  'profile-optimizer': {
    score: 72,
    sections: [
      { name: 'Headline', score: 85, problem: 'Buona ma mancano keyword ICP', action: 'Aggiungi "B2B" e "PMI" nella headline' },
      { name: 'About', score: 55, problem: 'Troppo generica, manca CTA', action: 'Riscrivi con struttura problem-solution-proof' },
      { name: 'Esperienza', score: 70, problem: 'Descrizioni vaghe', action: 'Aggiungi metriche e risultati concreti' },
      { name: 'Skills', score: 80, problem: 'Ok ma ordine non ottimale', action: 'Sposta le skill più rilevanti in alto' },
      { name: 'Featured', score: 30, problem: 'Sezione vuota', action: 'Aggiungi 3 contenuti: caso studio, articolo, link' },
      { name: 'Foto', score: 90, problem: 'Professionale', action: 'Ottima, nessuna azione' },
    ],
    about_rewrite: 'Aiuto PMI italiane a trasformare LinkedIn in un canale di acquisizione clienti prevedibile.\n\n📊 Negli ultimi 3 anni ho generato +2.4M di impression organiche e +340 lead qualificati per i miei clienti.\n\n🎯 Il mio approccio:\n→ Profilo ottimizzato come landing page\n→ Content strategy data-driven\n→ Outreach personalizzato e non invasivo\n\n💬 Scrivi "AUDIT" nei commenti e ricevi un\'analisi gratuita del tuo profilo.',
    headlines: [
      'Digital Marketing Consultant | +2.4M impression per PMI italiane su LinkedIn',
      'Aiuto PMI B2B a generare lead su LinkedIn | Content + Outreach Strategy',
      'LinkedIn Growth Expert per professionisti e PMI | Da 0 a pipeline in 90 giorni',
    ],
    keywords: ['B2B', 'PMI', 'lead generation', 'LinkedIn marketing', 'content strategy'],
  },
  'post-writer': {
    hook: '🔥 Il 90% dei professionisti usa LinkedIn nel modo sbagliato.\n\nE il problema non è la frequenza di pubblicazione.',
    body: 'Ho analizzato 500+ profili di professionisti italiani.\n\nEcco cosa ho scoperto:\n\n→ L\'80% non ha una headline ottimizzata\n→ Il 65% ha un About generico copia-incolla\n→ Solo il 12% usa i Featured\n→ Il 95% non ha una content strategy\n\nLinkedIn non è un curriculum online.\nÈ il tuo funnel di acquisizione clienti.\n\nMa funziona solo se tratti il profilo come una landing page\ne i contenuti come una strategia.',
    cta: '💬 Commenta "AUDIT" e ti invio un\'analisi gratuita del tuo profilo LinkedIn.\n\n♻️ Ricondividi se pensi che possa aiutare qualcuno.',
    hashtags: ['#LinkedIn', '#PersonalBranding', '#B2B', '#DigitalMarketing', '#PMI'],
    alt_hook: 'Ho smesso di pubblicare su LinkedIn per 3 mesi.\nQuando sono tornato, ho cambiato una sola cosa.\nI risultati sono stati assurdi.',
    best_time: 'Martedì o Mercoledì, ore 8:00-9:00',
  },
  'visual-post-builder': {
    canva_query: 'linkedin post template professional blue minimal',
    slides: ['Slide 1: Hook — testo grande su sfondo scuro', 'Slide 2: Dato chiave — numero grande + breve spiegazione', 'Slide 3: Lista 4 punti con icone', 'Slide 4: CTA con contatto'],
    midjourney_prompt: 'Professional LinkedIn post cover, modern minimal design, blue and amber color scheme, business concept, clean typography, --ar 4:5 --style raw',
    flux_prompt: 'A clean professional business infographic with blue and amber accents, modern minimal style, LinkedIn post format',
    negative_prompt: 'text, watermark, logo, blurry, low quality',
    palette: ['#0F172A', '#D97706', '#F8FAFC'],
    fonts: ['Inter Bold per titoli', 'Inter Regular per corpo'],
    alt_text: 'Infografica professionale con 4 statistiche sull\'uso di LinkedIn tra professionisti italiani',
  },
  'content-performance': {
    score: 68,
    top_performer: { text: 'Il post sui 5 errori di LinkedIn ha avuto 8.4k impression e 234 commenti...', reason: 'Hook polarizzante + formato lista + CTA chiara' },
    positive_patterns: ['Post con numeri nel hook performano 3x', 'Formato storytelling genera più commenti', 'Post del martedì mattina hanno più reach'],
    negative_patterns: ['Post troppo lunghi (>2000 char) perdono engagement', 'Hashtag generici non aiutano', 'Post senza CTA hanno meno salvataggi'],
    best_format: 'Lista + storytelling ibrido',
    optimal_length: '800-1200 caratteri',
    best_time: 'Martedì e Giovedì, 8:00-9:30',
    topics: ['Errori comuni LinkedIn', 'Case study clienti', 'Framework pratici', 'Trend di settore'],
  },
  'icp-builder': {
    icp: { settore: 'Manifatturiero', ruolo: 'CEO / Founder', dimensione: '10-50 dipendenti', area: 'Nord Italia', pain: 'Non riescono a trovare nuovi clienti B2B online', obiezioni: 'LinkedIn non funziona per il nostro settore', trigger: 'Assunzione nuovo commerciale, partecipazione a fiera, investimento in digital' },
    sales_nav_query: '(CEO OR Founder OR "Amministratore Delegato") AND (manifatturiero OR meccanico OR industriale) AND Italy',
    search_combos: ['CEO manifatturiero Lombardia', 'Founder PMI meccanica Veneto', 'Direttore commerciale industria Emilia'],
    value_props: ['Genera lead B2B qualificati dal tuo LinkedIn in 30 giorni', 'Zero automazioni rischiose: tutto manuale e personalizzato', 'ROI misurabile: ogni lead tracciato dal primo contatto'],
  },
  'prospect-finder': {
    prospects: [
      { nome: 'Luca Bianchi', headline: 'CEO @ Meccanica Bianchi S.r.l.', azienda: 'Meccanica Bianchi', fit_score: 92, reason: 'Settore target, ruolo decisionale, area geografica ideale', connection_request: 'Ciao Luca, ho notato il vostro stand alla fiera di Hannover. Il reshoring è un tema caldo — mi piacerebbe scambiare due riflessioni su come LinkedIn può supportare la vostra crescita commerciale.' },
      { nome: 'Anna Colombo', headline: 'Founder @ IndustriaTech', azienda: 'IndustriaTech', fit_score: 85, reason: 'Startup industriale in crescita, cerca visibilità', connection_request: 'Ciao Anna, complimenti per la crescita di IndustriaTech! Lavoro con founder del manifatturiero che vogliono usare LinkedIn come canale B2B. Posso condividere un case study simile al vostro?' },
      { nome: 'Giuseppe Ferrara', headline: 'Direttore Commerciale @ MetalPro', azienda: 'MetalPro S.p.A.', fit_score: 78, reason: 'Ruolo commerciale, settore affine, azienda strutturata', connection_request: 'Ciao Giuseppe, vedo che MetalPro sta espandendo il team vendite. Aiuto aziende come la vostra a generare lead qualificati su LinkedIn. Ti interesserebbe un confronto?' },
    ],
  },
  'outreach-drafter': {
    connection_requests: [
      { variant: 'Diretta', text: 'Ciao {{nome}}, lavoro con professionisti del tuo settore su LinkedIn strategy. Mi piacerebbe collegarci e scambiare due idee.', chars: 142 },
      { variant: 'Curiosità', text: 'Ciao {{nome}}, ho visto il tuo profilo — una domanda: come gestite la lead generation B2B in {{azienda}}? Sono curioso di confrontarmi.', chars: 156 },
      { variant: 'Valore', text: 'Ciao {{nome}}, ho preparato un\'analisi del settore {{settore}} su LinkedIn. Ti interessa riceverla? Nessun impegno, solo insight utili.', chars: 149 },
    ],
    first_messages: [
      { variant: 'Diretta', text: 'Grazie per il collegamento! Ti scrivo perché aiuto professionisti come te a usare LinkedIn per generare lead B2B qualificati.\n\nHo notato che il tuo profilo ha potenziale inespresso — posso condividere 3 azioni concrete che altri nel tuo settore stanno già applicando?\n\nNessuna vendita, solo valore.', chars: 312 },
      { variant: 'Curiosità', text: 'Grazie per aver accettato! Tornando alla mia domanda — come va la lead generation per {{azienda}}?\n\nTe lo chiedo perché lavoro con aziende simili alla tua e ho notato un pattern: chi ottimizza il profilo LinkedIn come "landing page" genera 3x più richieste inbound.\n\nTi mando un esempio?', chars: 305 },
      { variant: 'Valore', text: 'Ecco l\'analisi che ti avevo promesso — in breve:\n\n📊 Il tuo settore su LinkedIn:\n→ 73% dei decision maker è attivo\n→ Solo il 12% dei competitor pubblica regolarmente\n→ Opportunità: posizionarsi come thought leader\n\nSe vuoi, posso mostrarti come applicarlo al tuo caso specifico in 15 minuti.', chars: 318 },
    ],
    followups: [
      { timing: 'Dopo 3 giorni', text: 'Ciao {{nome}}, ti ho mandato un messaggio qualche giorno fa. So che LinkedIn è pieno di messaggi — il mio era per condividerti insight concreti, non per vendere. Se ti interessa, sono qui. In ogni caso, buon lavoro!' },
      { timing: 'Dopo 7 giorni', text: 'Ultimo ping, {{nome}} — nessuna pressione. Se in futuro vuoi esplorare come LinkedIn può diventare un canale di lead gen per {{azienda}}, il mio profilo è qui. Un caro saluto!' },
    ],
  },
  'reply-suggester': {
    classification: { intent: 'Interesse', funnel: 'Considerazione', urgency: 'Media', sentiment: 'Positivo' },
    replies: [
      { approach: 'Consultivo', text: 'Grazie per il messaggio! Capisco perfettamente — il ROI su LinkedIn non è sempre chiaro. Posso proporti un approccio: ti mostro 3 aziende simili alla tua che hanno generato risultati misurabili in 60 giorni. Ti invio il case study?', next_step: 'Invia case study + prenota call' },
      { approach: 'Diretto', text: 'Perfetto, apprezzo l\'interesse! La cosa migliore è una call di 15 minuti dove analizzo il tuo profilo e ti dico esattamente cosa fare. Nessun impegno. Quando ti andrebbe?', next_step: 'Proponi 2-3 slot per call' },
      { approach: 'Valore', text: 'Contento che ti interessi! Ti mando subito una mini-analisi del tuo profilo con 3 azioni che puoi applicare oggi stesso. Poi se vuoi approfondire, ci organizziamo. Dammi 24h!', next_step: 'Prepara e invia micro-audit' },
    ],
  },
  'network-intelligence': {
    last_check: '2026-04-12T08:00:00Z',
    signals: [
      { nome: 'Luca Bianchi', type: 'promozione', detail: 'Promosso a Managing Director @ Meccanica Bianchi', message: 'Congratulazioni Luca per la promozione a Managing Director! Un riconoscimento meritatissimo. Sarebbe bello aggiornarci — il nuovo ruolo apre opportunità interessanti.' },
      { nome: 'Giulia Verdi', type: 'post_virale', detail: 'Post su AI nel marketing: 15k impression, 342 commenti', message: 'Giulia, complimenti per il post! 15k impression sono un ottimo segnale. Mi piacerebbe condividere qualche riflessione sul tema — posso commentare con un insight aggiuntivo?' },
    ],
    no_changes: ['Andrea Ferrari', 'Paolo Neri', 'Sara Martini'],
  },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiato!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy}>
      {copied ? <CheckCircle className="h-3 w-3 mr-1 text-success" /> : <Copy className="h-3 w-3 mr-1" />}
      {copied ? "Copiato" : "Copia"}
    </Button>
  );
}

function CharCounter({ text, limit }: { text: string; limit: number }) {
  const count = text.length;
  return (
    <span className={`text-xs ${count > limit ? 'text-destructive' : 'text-muted-foreground'}`}>
      {count}/{limit} caratteri
    </span>
  );
}

// Render output per ogni skill
function SkillOutput({ skillId, output }: { skillId: string; output: Record<string, unknown> }) {
  const data = output as any;

  if (skillId === 'profile-optimizer') {
    return (
      <div className="space-y-6">
        <div className="text-center"><ScoreBadge score={data.score} size="lg" className="mx-auto" /></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.sections?.map((s: any) => (
            <Card key={s.name} className="bg-surface border-border">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2"><span className="font-medium text-sm">{s.name}</span><ScoreBadge score={s.score} size="sm" /></div>
                <p className="text-xs text-muted-foreground mb-1">{s.problem}</p>
                <p className="text-xs text-primary">→ {s.action}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div>
          <h3 className="font-semibold mb-2">About riscritto</h3>
          <div className="bg-surface border border-border rounded-lg p-4 relative">
            <pre className="text-sm whitespace-pre-wrap">{data.about_rewrite}</pre>
            <CopyButton text={data.about_rewrite} />
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Headline riscritte</h3>
          {data.headlines?.map((h: string, i: number) => (
            <div key={i} className="flex items-center gap-2 bg-surface border border-border rounded-lg p-3 mb-2">
              <p className="text-sm flex-1">{h}</p>
              <CopyButton text={h} />
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-semibold mb-2">Keywords ICP</h3>
          <div className="flex flex-wrap gap-2">
            {data.keywords?.map((k: string) => <Badge key={k} className="bg-primary-light text-primary border-0 cursor-pointer" onClick={() => { navigator.clipboard.writeText(k); toast.success("Copiato!"); }}>{k}</Badge>)}
          </div>
        </div>
      </div>
    );
  }

  if (skillId === 'post-writer') {
    return (
      <div className="space-y-4">
        <div className="border-l-4 border-primary bg-surface p-4 rounded-r-lg">
          <p className="font-bold text-lg whitespace-pre-wrap">{data.hook}</p>
        </div>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{data.body}</div>
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
          <p className="text-sm whitespace-pre-wrap">{data.cta}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.hashtags?.map((h: string) => <Badge key={h} variant="outline" className="border-border">{h}</Badge>)}
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Hook alternativo</summary>
          <p className="mt-2 whitespace-pre-wrap bg-surface p-3 rounded-lg border border-border">{data.alt_hook}</p>
        </details>
        <p className="text-xs text-muted-foreground">⏰ Orario suggerito: {data.best_time}</p>
        <div className="flex gap-2">
          <CopyButton text={`${data.hook}\n\n${data.body}\n\n${data.cta}\n\n${data.hashtags?.join(' ')}`} />
          <Link to={`/skill/visual-post-builder?post=${encodeURIComponent(data.hook + '\n' + data.body)}`}>
            <Button variant="outline" size="sm" className="border-border">
              Crea visual per questo post <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (skillId === 'visual-post-builder') {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">🎨 Canva</h3>
          <a href={`https://www.canva.com/templates/?query=${encodeURIComponent(data.canva_query)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{data.canva_query}</a>
          <ul className="mt-2 space-y-1">{data.slides?.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {s}</li>)}</ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">🤖 AI Image Prompt</h3>
          <div className="bg-surface border border-border rounded-lg p-3"><p className="text-sm font-mono">{data.midjourney_prompt}</p><CopyButton text={data.midjourney_prompt} /></div>
          <div className="bg-surface border border-border rounded-lg p-3 mt-2"><p className="text-sm font-mono">{data.flux_prompt}</p><CopyButton text={data.flux_prompt} /></div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Palette</h3>
          <div className="flex gap-3">{data.palette?.map((c: string) => <div key={c} className="flex items-center gap-2"><div className="w-8 h-8 rounded" style={{ background: c }} /><span className="text-xs font-mono">{c}</span></div>)}</div>
        </div>
        <p className="text-xs text-muted-foreground">Font: {data.fonts?.join(', ')}</p>
        <p className="text-xs text-muted-foreground">Alt text: {data.alt_text}</p>
      </div>
    );
  }

  if (skillId === 'content-performance') {
    return (
      <div className="space-y-4">
        <div className="text-center"><ScoreBadge score={data.score} size="lg" className="mx-auto" /></div>
        <Card className="bg-surface border-border"><CardContent className="p-4"><h3 className="font-semibold text-sm mb-1">🏆 Top Performer</h3><p className="text-sm text-muted-foreground">{data.top_performer?.reason}</p></CardContent></Card>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><h3 className="font-semibold text-sm mb-2 text-success">✅ Pattern positivi</h3>{data.positive_patterns?.map((p: string, i: number) => <p key={i} className="text-sm text-muted-foreground mb-1">• {p}</p>)}</div>
          <div><h3 className="font-semibold text-sm mb-2 text-destructive">❌ Pattern negativi</h3>{data.negative_patterns?.map((p: string, i: number) => <p key={i} className="text-sm text-muted-foreground mb-1">• {p}</p>)}</div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Card className="bg-surface border-border"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Formato migliore</p><p className="text-sm font-medium">{data.best_format}</p></CardContent></Card>
          <Card className="bg-surface border-border"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Lunghezza ottimale</p><p className="text-sm font-medium">{data.optimal_length}</p></CardContent></Card>
          <Card className="bg-surface border-border"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Orario migliore</p><p className="text-sm font-medium">{data.best_time}</p></CardContent></Card>
        </div>
        <div><h3 className="font-semibold text-sm mb-2">Topic suggeriti</h3><div className="flex flex-wrap gap-2">{data.topics?.map((t: string) => <Badge key={t} className="bg-primary-light text-primary border-0">{t}</Badge>)}</div></div>
      </div>
    );
  }

  if (skillId === 'icp-builder') {
    return (
      <div className="space-y-4">
        <Card className="bg-surface border-border"><CardContent className="p-4">
          <h3 className="font-semibold mb-3">🎯 ICP Card</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(data.icp || {}).map(([k, v]) => (
              <div key={k}><span className="text-muted-foreground capitalize">{k}:</span> <span className="font-medium">{v as string}</span></div>
            ))}
          </div>
        </CardContent></Card>
        <div><h3 className="font-semibold mb-2">Sales Navigator Query</h3><div className="bg-surface border border-border rounded-lg p-3 font-mono text-sm">{data.sales_nav_query}<CopyButton text={data.sales_nav_query} /></div></div>
        <div><h3 className="font-semibold mb-2">Search Combos</h3>{data.search_combos?.map((s: string, i: number) => <div key={i} className="flex items-center gap-2 mb-1"><p className="text-sm">{s}</p><CopyButton text={s} /></div>)}</div>
        <div><h3 className="font-semibold mb-2">Messaggi chiave</h3>{data.value_props?.map((v: string, i: number) => <p key={i} className="text-sm text-muted-foreground mb-1">• {v}</p>)}</div>
        <Link to={`/skill/prospect-finder?icp=${encodeURIComponent(JSON.stringify(data.icp))}`}><Button className="bg-primary hover:bg-primary-hover text-primary-foreground">Cerca prospect con questo ICP <ChevronRight className="ml-1 h-4 w-4" /></Button></Link>
      </div>
    );
  }

  if (skillId === 'prospect-finder') {
    return (
      <div className="space-y-3">
        {data.prospects?.map((p: any, i: number) => (
          <Card key={i} className="bg-surface border-border"><CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2"><h3 className="font-semibold text-sm">{p.nome}</h3><ScoreBadge score={p.fit_score} size="sm" /></div>
                <p className="text-xs text-muted-foreground">{p.headline}</p>
                <p className="text-xs text-primary mt-1">{p.reason}</p>
              </div>
            </div>
            <div className="mt-3 bg-background/50 rounded-lg p-3 border border-border">
              <p className="text-sm">{p.connection_request}</p>
              <div className="flex justify-between items-center mt-2">
                <CharCounter text={p.connection_request} limit={300} />
                <div className="flex gap-1">
                  <CopyButton text={p.connection_request} />
                  <Link to={`/skill/outreach-drafter?nome=${encodeURIComponent(p.nome)}&headline=${encodeURIComponent(p.headline)}&azienda=${encodeURIComponent(p.azienda)}`}>
                    <Button variant="ghost" size="sm">Outreach completo <ChevronRight className="h-3 w-3 ml-1" /></Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>
    );
  }

  if (skillId === 'outreach-drafter') {
    return (
      <div className="space-y-6">
        <div><h3 className="font-semibold mb-3">Connection Request</h3><div className="space-y-2">{data.connection_requests?.map((cr: any) => (
          <Card key={cr.variant} className="bg-surface border-border"><CardContent className="p-4">
            <Badge variant="outline" className="mb-2 border-border">{cr.variant}</Badge>
            <p className="text-sm">{cr.text}</p>
            <div className="flex justify-between items-center mt-2"><CharCounter text={cr.text} limit={300} /><CopyButton text={cr.text} /></div>
          </CardContent></Card>
        ))}</div></div>
        <div><h3 className="font-semibold mb-3">Primo Messaggio</h3><div className="space-y-2">{data.first_messages?.map((m: any) => (
          <Card key={m.variant} className="bg-surface border-border"><CardContent className="p-4">
            <Badge variant="outline" className="mb-2 border-border">{m.variant}</Badge>
            <p className="text-sm whitespace-pre-wrap">{m.text}</p>
            <div className="flex justify-between items-center mt-2"><CharCounter text={m.text} limit={500} /><CopyButton text={m.text} /></div>
          </CardContent></Card>
        ))}</div></div>
        <div><h3 className="font-semibold mb-3">Follow-up</h3><div className="space-y-2">{data.followups?.map((f: any) => (
          <Card key={f.timing} className="bg-surface border-border"><CardContent className="p-4">
            <Badge variant="outline" className="mb-2 border-border">{f.timing}</Badge>
            <p className="text-sm">{f.text}</p>
            <CopyButton text={f.text} />
          </CardContent></Card>
        ))}</div></div>
      </div>
    );
  }

  if (skillId === 'reply-suggester') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.classification || {}).map(([k, v]) => (
            <Badge key={k} className="bg-primary/10 text-primary border-0">{k}: {v as string}</Badge>
          ))}
        </div>
        <div className="space-y-3">{data.replies?.map((r: any) => (
          <Card key={r.approach} className="bg-surface border-border"><CardContent className="p-4">
            <Badge className="mb-2 bg-primary-light text-primary border-0">{r.approach}</Badge>
            <p className="text-sm">{r.text}</p>
            <p className="text-xs text-primary mt-2">Next step: {r.next_step}</p>
            <CopyButton text={r.text} />
          </CardContent></Card>
        ))}</div>
      </div>
    );
  }

  if (skillId === 'network-intelligence') {
    const signalColors: Record<string, string> = {
      promozione: 'bg-layer-profilo/20 text-layer-profilo',
      post_virale: 'bg-primary/20 text-primary',
      nuovo_ruolo: 'bg-success/20 text-success',
    };
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Ultimo check: {new Date(data.last_check).toLocaleDateString('it-IT')}</p>
        {data.signals?.map((s: any, i: number) => (
          <Card key={i} className="bg-surface border-border"><CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-sm">{s.nome}</span>
              <Badge className={signalColors[s.type] || 'bg-muted'}>{s.type.replace('_', ' ')}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{s.detail}</p>
            <div className="bg-background/50 rounded-lg p-3 border border-border">
              <p className="text-sm">{s.message}</p>
              <CopyButton text={s.message} />
            </div>
          </CardContent></Card>
        ))}
        {data.no_changes?.length > 0 && (
          <details><summary className="text-sm text-muted-foreground cursor-pointer">Nessun cambiamento ({data.no_changes.length} profili)</summary>
            <ul className="mt-2 space-y-1">{data.no_changes.map((n: string) => <li key={n} className="text-sm text-muted-foreground">• {n}</li>)}</ul>
          </details>
        )}
        <Link to="/watchlist"><Button variant="outline" className="border-border">Gestisci watchlist</Button></Link>
      </div>
    );
  }

  // Fallback: auto-profile-setup
  return (
    <div className="space-y-3">
      {Object.entries(data).map(([k, v]) => (
        <div key={k}><span className="text-sm text-muted-foreground capitalize">{k.replace(/_/g, ' ')}:</span> <span className="text-sm font-medium">{String(v)}</span></div>
      ))}
    </div>
  );
}

// Skill form per ogni skill
function SkillForm({ skillId, onSubmit }: { skillId: string; onSubmit: (data: Record<string, string>) => void }) {
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    if (skillId === 'visual-post-builder') init.post = searchParams.get('post') || '';
    if (skillId === 'prospect-finder') {
      const icp = searchParams.get('icp');
      if (icp) init.query = icp;
    }
    if (skillId === 'outreach-drafter') {
      init.nome = searchParams.get('nome') || '';
      init.headline = searchParams.get('headline') || '';
      init.azienda = searchParams.get('azienda') || '';
    }
    return init;
  });

  const set = (k: string, v: string) => setValues(prev => ({ ...prev, [k]: v }));

  if (skillId === 'auto-profile-setup') {
    return (
      <div className="space-y-4">
        <Input placeholder="https://www.linkedin.com/in/tuoprofilo" value={values.url || ''} onChange={e => set('url', e.target.value)} className="bg-surface border-border" />
        <Button onClick={() => onSubmit(values)} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground">Genera</Button>
      </div>
    );
  }

  if (skillId === 'profile-optimizer') {
    return <Button onClick={() => onSubmit(values)} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground">Lancia audit</Button>;
  }

  if (skillId === 'post-writer') {
    return (
      <div className="space-y-4">
        <Textarea placeholder="Descrivi il post che vuoi scrivere..." value={values.brief || ''} onChange={e => set('brief', e.target.value)} className="bg-surface border-border" rows={4} />
        <Select value={values.format || 'Storytelling'} onValueChange={v => set('format', v)}>
          <SelectTrigger className="bg-surface border-border"><SelectValue placeholder="Formato" /></SelectTrigger>
          <SelectContent><SelectItem value="Storytelling">Storytelling</SelectItem><SelectItem value="Insight">Insight</SelectItem><SelectItem value="Case Study">Case Study</SelectItem><SelectItem value="Polarizzante">Polarizzante</SelectItem></SelectContent>
        </Select>
        <Button onClick={() => onSubmit(values)} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground">Genera</Button>
      </div>
    );
  }

  if (skillId === 'visual-post-builder') {
    return (
      <div className="space-y-4">
        <Textarea placeholder="Incolla il testo del post..." value={values.post || ''} onChange={e => set('post', e.target.value)} className="bg-surface border-border" rows={4} />
        <Select value={values.style || 'Minimal'} onValueChange={v => set('style', v)}>
          <SelectTrigger className="bg-surface border-border"><SelectValue placeholder="Stile" /></SelectTrigger>
          <SelectContent><SelectItem value="Minimal">Minimal</SelectItem><SelectItem value="Bold">Bold</SelectItem><SelectItem value="Data Viz">Data Viz</SelectItem><SelectItem value="Storytelling">Storytelling</SelectItem></SelectContent>
        </Select>
        <Input placeholder="Colori brand (es. #D97706, #0F172A)" value={values.colors || ''} onChange={e => set('colors', e.target.value)} className="bg-surface border-border" />
        <Button onClick={() => onSubmit(values)} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground">Genera</Button>
      </div>
    );
  }

  if (skillId === 'content-performance') {
    return <Button onClick={() => onSubmit(values)} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground">Analizza i miei post</Button>;
  }

  if (skillId === 'icp-builder') {
    return (
      <div className="space-y-4">
        <Textarea placeholder="Descrivi il tuo cliente ideale..." value={values.description || ''} onChange={e => set('description', e.target.value)} className="bg-surface border-border" rows={4} />
        <Button onClick={() => onSubmit(values)} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground">Genera</Button>
      </div>
    );
  }

  if (skillId === 'prospect-finder') {
    return (
      <div className="space-y-4">
        <Textarea placeholder="Chi cerchi? Descrivi il profilo ideale..." value={values.query || ''} onChange={e => set('query', e.target.value)} className="bg-surface border-border" rows={3} />
        <Button onClick={() => onSubmit(values)} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground">Genera</Button>
      </div>
    );
  }

  if (skillId === 'outreach-drafter') {
    return (
      <div className="space-y-4">
        <Input placeholder="Nome" value={values.nome || ''} onChange={e => set('nome', e.target.value)} className="bg-surface border-border" />
        <Input placeholder="Headline" value={values.headline || ''} onChange={e => set('headline', e.target.value)} className="bg-surface border-border" />
        <Input placeholder="Azienda" value={values.azienda || ''} onChange={e => set('azienda', e.target.value)} className="bg-surface border-border" />
        <Textarea placeholder="Note aggiuntive (opzionale)" value={values.note || ''} onChange={e => set('note', e.target.value)} className="bg-surface border-border" rows={2} />
        <Button onClick={() => onSubmit(values)} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground">Genera</Button>
      </div>
    );
  }

  if (skillId === 'reply-suggester') {
    return (
      <div className="space-y-4">
        <Textarea placeholder="Incolla il messaggio ricevuto..." value={values.message || ''} onChange={e => set('message', e.target.value)} className="bg-surface border-border" rows={4} />
        <Textarea placeholder="Contesto (opzionale)" value={values.context || ''} onChange={e => set('context', e.target.value)} className="bg-surface border-border" rows={2} />
        <Button onClick={() => onSubmit(values)} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground">Genera</Button>
      </div>
    );
  }

  if (skillId === 'network-intelligence') {
    return <Button onClick={() => onSubmit(values)} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground">Aggiorna ora</Button>;
  }

  return <Button onClick={() => onSubmit(values)} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground">Genera</Button>;
}

export default function SkillPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const skill = SKILLS.find(s => s.id === skillId);
  const profile = mockProfile;
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  if (!skill) return <AppLayout><p>Skill non trovata.</p></AppLayout>;

  const handleSubmit = async () => {
    setLoading(true);
    setOutput(null);
    await new Promise(r => setTimeout(r, 2000));
    setOutput(mockOutputs[skill.id] || { result: 'Output mock generato.' });
    setLoading(false);
  };

  const scrapingRemaining = profile.scrapes_daily_limit - profile.scrapes_used_today;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <SkillIcon name={skill.icon} className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{skill.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">{skill.description}</p>
          </div>
        </div>

        {/* Form */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <SkillForm skillId={skill.id} onSubmit={handleSubmit} />
            {skill.usesScraping && (
              <p className="text-xs text-warning mt-3">
                ⚡ Usa 1 credito scraping ({scrapingRemaining} rimasti oggi)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Ember sta lavorando...</p>
            <p className="text-xs text-muted mt-1">Tempo stimato: 15-30 secondi</p>
          </div>
        )}

        {/* Output */}
        {output && !loading && (
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Risultato</h2>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleSubmit}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Rigenera
                  </Button>
                </div>
              </div>
              <SkillOutput skillId={skill.id} output={output} />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
