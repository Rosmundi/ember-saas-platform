
# Hero copy update — Opzione C

## Modifiche

### 1. `src/pages/Landing.tsx` riga 78

Sostituisco l'H1 attuale:
> Il copilot LinkedIn per professionisti e PMI italiane

Con:
> Trasforma LinkedIn nel tuo canale di crescita.
> Ember è il copilot dei professionisti che non hanno tempo da perdere.

Implementazione: due righe distinte con `<br />` (mantengo classi tipografiche esistenti del gradient text). La seconda riga sarà visivamente più leggera per gerarchia — uso un `<span>` con opacità ridotta o tono `muted-foreground`, da valutare in preview.

### 2. `mem://index.md` — Core memory

Aggiorno la prima riga:

Da:
> Ember SaaS — LinkedIn copilot per PMI italiane. Dark-only theme, primary #D97706, bg #0F172A.

A:
> Ember SaaS — LinkedIn copilot per professionisti che vogliono trasformare LinkedIn in canale di crescita. Dark-only theme, primary #D97706, bg #0F172A.

Resto della Core memory invariato.

## Cosa NON cambia

- Sottotitolo hero, CTA, badge trial → restano (già coerenti).
- Tutto il resto della landing → già neutro.
- `index.html` meta tag → da sistemare in un pezzo SEO dedicato (non ora).

## Dopo questo

Torniamo alla scelta lasciata in sospeso da v3.7.4:
- **D1+D2** (Modifica filtri & Suggerisci espansione) — chiude perfetto la sezione ricerca prospect
- oppure **Pezzo 3** (Outreach drafter semplificato + fix BUG #3 prefill ProspectCard)
