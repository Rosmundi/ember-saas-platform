import { Profile, SkillRun, WatchlistItem, BusinessProfile } from './ember-types';

export const mockBusinessProfile: BusinessProfile = {
  nome: 'Marco Rossi',
  headline: 'Consulente Digital Marketing | Aiuto PMI italiane a crescere su LinkedIn',
  settore: 'Marketing Digitale',
  value_proposition: 'Trasformo la presenza LinkedIn di professionisti e PMI in un motore di lead generation, con strategie data-driven e contenuti che convertono.',
  tone_of_voice: 'Diretto e pratico',
  punti_forza: ['Content marketing', 'Lead generation B2B', 'LinkedIn strategy', 'Personal branding'],
  aree_miglioramento: ['Sezione About troppo generica', 'Mancano contenuti Featured', 'Esperienza non ottimizzata con keyword'],
  tags: ['digital marketing', 'B2B', 'LinkedIn', 'lead generation', 'PMI'],
};

export const mockProfile: Profile = {
  id: 'mock-user-id',
  linkedin_url: 'https://www.linkedin.com/in/marcorossi',
  business_profile: mockBusinessProfile,
  raw_profile_data: null,
  plan: 'pro',
  skill_runs_used: 47,
  skill_runs_limit: 250,
  scrapes_used_today: 2,
  scrapes_daily_limit: 5,
  trial_ends_at: '2026-04-27T00:00:00Z',
  created_at: '2026-04-01T00:00:00Z',
};

export const mockSkillRuns: SkillRun[] = [
  {
    id: '1', user_id: 'mock-user-id', skill: 'post-writer',
    input: { brief: 'Post su come usare LinkedIn per generare lead B2B' },
    output: { hook: '🔥 Il 90% dei professionisti usa LinkedIn nel modo sbagliato.', body: 'Ecco cosa ho imparato dopo 3 anni di content strategy...', cta: 'Commenta con "GUIDA" e ti invio il framework completo.' },
    status: 'completed', is_scrape: false, created_at: '2026-04-12T14:30:00Z',
  },
  {
    id: '2', user_id: 'mock-user-id', skill: 'profile-optimizer',
    input: {},
    output: { score: 72, top_actions: ['Riscrivi la sezione About', 'Aggiungi 3 contenuti Featured', 'Ottimizza headline con keyword ICP'] },
    status: 'completed', is_scrape: false, created_at: '2026-04-11T10:00:00Z',
  },
  {
    id: '3', user_id: 'mock-user-id', skill: 'prospect-finder',
    input: { query: 'CEO PMI settore manifatturiero Lombardia' },
    output: { prospects: [{ nome: 'Luca Bianchi', fit_score: 92 }] },
    status: 'completed', is_scrape: true, created_at: '2026-04-10T16:45:00Z',
  },
  {
    id: '4', user_id: 'mock-user-id', skill: 'icp-builder',
    input: { description: 'CEO di PMI manifatturiere in Nord Italia' },
    output: { icp: { settore: 'Manifatturiero', ruolo: 'CEO/Founder', dimensione: '10-50 dipendenti' } },
    status: 'completed', is_scrape: false, created_at: '2026-04-09T09:15:00Z',
  },
  {
    id: '5', user_id: 'mock-user-id', skill: 'outreach-drafter',
    input: { nome: 'Luca Bianchi', headline: 'CEO @ Meccanica Bianchi', azienda: 'Meccanica Bianchi' },
    output: { connection_request: 'Ciao Luca, ho visto il tuo intervento sul reshoring...' },
    status: 'completed', is_scrape: false, created_at: '2026-04-08T11:30:00Z',
  },
];

export const mockWatchlist: WatchlistItem[] = [
  { id: '1', linkedin_url: 'https://linkedin.com/in/lucabianchi', nome: 'Luca Bianchi', headline: 'CEO @ Meccanica Bianchi', azienda: 'Meccanica Bianchi', last_scraped_at: '2026-04-12T08:00:00Z', last_signal: { type: 'promozione', detail: 'Promosso a Managing Director', date: '2026-04-11' } },
  { id: '2', linkedin_url: 'https://linkedin.com/in/giuliaverdi', nome: 'Giulia Verdi', headline: 'Head of Marketing @ TechItalia', azienda: 'TechItalia', last_scraped_at: '2026-04-12T08:00:00Z', last_signal: { type: 'post_virale', detail: 'Post su AI nel marketing con 15k impression', date: '2026-04-10' } },
  { id: '3', linkedin_url: 'https://linkedin.com/in/andreaferrari', nome: 'Andrea Ferrari', headline: 'Founder @ StartupMilano', azienda: 'StartupMilano', last_scraped_at: '2026-04-11T08:00:00Z' },
];

export const mockSignals = [
  { nome: 'Luca Bianchi', type: 'promozione', detail: 'Promosso a Managing Director', action: 'Invia un messaggio di congratulazioni', date: '2026-04-11' },
  { nome: 'Giulia Verdi', type: 'post_virale', detail: 'Post su AI nel marketing con 15k impression', action: 'Commenta il post e avvia conversazione', date: '2026-04-10' },
  { nome: 'Paolo Neri', type: 'nuovo_ruolo', detail: 'Nuovo ruolo: VP Sales @ IndustriaPlus', action: 'Connection request con riferimento al nuovo ruolo', date: '2026-04-09' },
];
