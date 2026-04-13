
# Ember — Piano di Implementazione Fase 1

**Obiettivo:** Costruire l'intero frontend con design system, tutte le pagine, navigazione e logica UI. Il backend (Supabase auth, DB, n8n) verrà collegato nella fase successiva.

---

## Step 1 — Design System & Layout Base
- Configurare il tema dark-only: colori Ember (primary #D97706, background #0F172A, surface #1E293B, ecc.) come variabili CSS
- Font Inter con le scale tipografiche definite
- Componenti base: bottoni (primary, secondary, ghost), card, input, badge/chip, score badge, progress bar quota
- Layout con sidebar 260px responsive (hamburger su mobile)

## Step 2 — Landing Page (/)
- Hero con gradiente, logo EMBER, nav, h1, tagline, CTA
- Sezione "3 layer, 10 skill" con griglia a 3 colonne
- Sezione "Come funziona" in 4 step
- Sezione Pricing con 3 card (Base, Pro, Studio) + trial info
- Footer

## Step 3 — Login (/login)
- Card centrata con input email e bottone "Invia magic link"
- Stato post-invio con feedback visivo
- UI only per ora (auth Supabase nella fase 2)

## Step 4 — Onboarding (/onboarding)
- Wizard 3 step con progress bar
- Step 1: input LinkedIn URL con validazione
- Step 2: form Business Profile editabile (headline, settore, value prop, tone of voice, tag)
- Step 3: score profilo con badge colorato e top 3 azioni
- Dati mock per simulare il flusso

## Step 5 — Dashboard (/dashboard)
- Sidebar completa con menu + 10 skill raggruppate per layer + avatar utente
- Header con saluto + progress bar skill-run e scraping
- Banner trial scaduto
- 3 sezioni card skill per layer con hover, badge "Pro", badge scraping
- Sezione "Ultimi risultati" e "Segnali dalla rete"

## Step 6 — Pagine Skill (/skill/:skillId)
- Template comune: header, form, bottone genera, area output, toolbar (copia/rigenera)
- Form e output specifici per tutte e 10 le skill con dati mock
- Cross-linking tra skill (post-writer → visual, icp → prospect, prospect → outreach)
- Contatore caratteri per outreach, score badge per optimizer/content-performance

## Step 7 — Pagine Secondarie
- **Cronologia (/history):** filtri, lista card paginata, espansione output
- **Watchlist (/watchlist):** lista profili, modale aggiungi, contatore limite
- **Impostazioni (/settings):** profilo business editabile, piano e billing, account

## Step 8 — Logica UI Globale
- Routing con protezione route (simulata senza auth reale)
- Redirect onboarding se profilo mancante
- Modale upgrade quando skill non disponibile nel piano
- Funzioni canUseSkill e callSkill (struttura pronta, mock responses)
- Tutta la copy in italiano come da specifica

---

**Risultato:** App completa navigabile con tutti i flussi, pronta per collegare Lovable Cloud (auth + DB) e le API n8n nella fase 2.
