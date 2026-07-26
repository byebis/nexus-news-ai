# Nexus News AI

> Il giornale di nuova generazione, scritto da intelligenze artificiali.

Un magazine news AI-powered con 7 agenti giornalisti autonomi che raccolgono, valutano, riscrivono e pubblicano notizie in 7 categorie editoriali.

## Stack

| Layer | Tecnologia |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui, Framer Motion |
| Database | Supabase (PostgreSQL) |
| Hosting | Cloudflare Pages |
| State | Zustand |

## Architettura

```
Cloudflare Pages (Edge)
    |
    +-- Frontend (React SPA)
    |
    +-- API Routes (Next.js App Router)
          |
          +-- Supabase Client (PostgreSQL)
          |
          +-- AI Engine (simulazione locale)
```

## Funzionalita

- **7 Agenti Giornalisti AI** con personalita distinte per categoria
- **Pipeline editoriale automatizzata**: raccolta > valutazione > riscrittura > approvazione > pubblicazione
- **Modalita semi-autonoma**: gli articoli richiedono approvazione umana prima della pubblicazione
- **Modalita completamente autonoma**: l'intera pipeline gira senza intervento umano
- **Pubblicazione multi-piattaforma**: Blog, Twitter/X, Facebook, LinkedIn, Instagram (simulata)
- **Admin Panel completo**: gestione agenti, coda approvazioni, feed attivita, impostazioni
- **UI Magazine moderna**: hero section, category bar, griglia articoli, modal dettaglio

## Categorie Editoriali

| Agente | Categoria | Personalita |
|--------|-----------|-------------|
| TechBot | Tecnologia | Analitico e orientato all'impatto pratico |
| PolicyWatch | Politica | Equilibrato con contesto geopolitico |
| MarketPulse | Economia | Rigoroso ma accessibile |
| SciExplorer | Scienza | Divulgativo ma preciso |
| SportArena | Sport | Emozionante e narrativo |
| CultureHub | Cultura | Elegante e riflessivo |
| HealthDesk | Salute | Rassicurante e basato su evidenze |

## Setup Locale

### Prerequisiti
- Node.js 20+
- Un progetto Supabase con le tabelle create

### 1. Installa dipendenze

```bash
npm install
```

### 2. Configura Supabase

Crea il file `.env.local` nella root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tuo-progetto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tua-anon-key
```

### 3. Crea tabelle su Supabase

Esegui nello SQL Editor di Supabase (in ordine):
1. `download/supabase-schema.sql` - crea tutte le tabelle
2. `download/supabase-seed.sql` - inserisce dati demo

### 4. Avvia in sviluppo

```bash
npm run dev
```

App disponibile su `http://localhost:3000`

## Deploy su Cloudflare Pages

### Setup iniziale

1. Collega il repo GitHub a Cloudflare Pages
2. Configura:
   - **Build command**: `npx @opennextjs/cloudflare`
   - **Build output directory**: `.open-next`
   - **Node.js version**: `20`
3. Aggiungi le Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Deploy manuale via CLI

```bash
npm run pages:build
npm run pages:deploy
```

## Struttura Progetto

```
src/
  app/
    api/            # API Routes (agents, articles, approve, publish, settings, collect, activity)
    globals.css     # Stili globali Tailwind
    layout.tsx       # Root layout
    page.tsx         # Pagina principale
  components/
    admin/           # AdminPanel, AgentManager, ApprovalQueue, PublishingPanel, ActivityFeed, SettingsPanel
    magazine/        # HeroSection, CategoryBar, ArticleCard, ArticleGrid, ArticleModal
    shared/          # Header, Footer
    ui/              # Componenti shadcn/ui
  hooks/             # Custom React hooks
  lib/
    ai-engine.ts     # Motore AI di simulazione editoriale
    api.ts           # Funzioni API (Supabase)
    store.ts         # Stato globale Zustand
    supabase.ts      # Client Supabase + helpers
    utils.ts         # Utility generali
```

## Schema Database

6 tabelle su PostgreSQL (Supabase):
- `agents` - I 7 agenti giornalisti
- `articles` - Articoli prodotti (draft, pending, approved, published, rejected)
- `publish_logs` - Log pubblicazione multi-piattaforma
- `approval_logs` - Log approvazione/rifiuto
- `activity_logs` - Feed attivita agenti
- `settings` - Configurazione sistema (modalita, intervalli, piattaforme)

## Licenza

MIT
