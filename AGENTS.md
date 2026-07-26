# AGENTS.md - Nexus News AI

Documento di riferimento per agenti AI che lavorano su questo progetto.

## Panoramica Progetto

Nexus News AI e un magazine giornalistico con 7 agenti AI autonomi. L'app e una SPA Next.js 16 con backend API serverless su Cloudflare Pages e database Supabase (PostgreSQL).

## Stack Tecnico

| Componente | Tecnologia | Note |
|-----------|-----------|------|
| Framework | Next.js 16 (App Router) | Non usare `output: "standalone"` in next.config.ts |
| Runtime React | React 19 | Server Components dove possibile |
| Linguaggio | TypeScript (strict) | `ignoreBuildErrors: true` in next.config per velocita |
| Styling | Tailwind CSS 4 + shadcn/ui | Non usare CSS modules |
| Stato | Zustand (store.ts) | Unico store globale, nessun Context API |
| Database | Supabase PostgreSQL | Accesso via `@supabase/supabase-js` client |
| ORM | NESSUN ORM | Query dirette Supabase, niente Prisma |
| Hosting | Cloudflare Pages | Build via `@opennextjs/cloudflare` |
| Animazioni | Framer Motion | Per transizioni UI |
| Edge Runtime | Cloudflare Workers | Le API routes girano sull'edge |

## Struttura File Critica

```
src/
  lib/
    supabase.ts    # Client Supabase + helper toCamelCase, transformRows, generateId
    api.ts          # TUTTE le funzioni database (fetchAgents, fetchArticles, etc.)
    ai-engine.ts    # Motore simulazione AI (collectNews, evaluateNews, rewriteArticle)
    store.ts        # Store Zustand con tipi TypeScript
    utils.ts        # cn() helper per Tailwind
  app/
    api/
      agents/route.ts       # GET (fetchAgents), PUT (updateAgent)
      articles/route.ts     # GET (fetchArticles), POST (create article)
      articles/[id]/route.ts # GET, PUT, DELETE singolo articolo
      approve/route.ts      # POST (approveArticle)
      publish/route.ts      # POST (publishArticle)
      collect/route.ts      # POST (collectNews - trigger AI pipeline)
      settings/route.ts     # GET, PUT (fetchSettings, updateSettings)
      activity/route.ts     # GET, POST (fetchActivityLogs, createActivityLog)
  components/
    admin/     # AdminPanel, AgentManager, ApprovalQueue, PublishingPanel, ActivityFeed, SettingsPanel
    magazine/  # HeroSection, CategoryBar, ArticleCard, ArticleGrid, ArticleModal
    shared/    # Header, Footer
    ui/        # shadcn/ui components (non modificare direttamente)
```

## Convenzioni Database

### Naming
- Tabelle: **snake_case** (`agents`, `publish_logs`, `activity_logs`)
- Colonne: **snake_case** (`agent_id`, `created_at`, `quality_score`)
- Il codice TypeScript usa **camelCase**
- La conversione snake_case <-> camelCase e gestita da `toCamelCase()` in `supabase.ts`

### Tabelle

| Tabella | Relazioni | Note |
|---------|-----------|------|
| `agents` | has_many articles, activity_logs | campo `category` UNIQUE |
| `articles` | belongs_to agent, has_many publish_logs, has_one approval_log | status: draft/pending_approval/approved/published/rejected |
| `publish_logs` | belongs_to article | platform: blog/twitter/facebook/linkedin/instagram |
| `approval_logs` | belongs_to article | article_id UNIQUE |
| `activity_logs` | belongs_to agent | Solo insert, mai update |
| `settings` | standalone | Solo una riga nel database |

### API Routes Pattern

Tutte le API routes importano da `@/lib/api.ts` (NON da `@/lib/db` che non esiste piu):

```typescript
import { fetchAgents, updateAgent } from '@/lib/api';
```

Le funzioni in `api.ts` restituiscono tipi camelCase. I nomi delle colonne snake_case vengono convertiti automaticamente.

### Quando scrivi nuove API routes:
1. Aggiungi la funzione in `src/lib/api.ts` usando `supabase.from('table_name')`
2. La route in `src/app/api/` chiama la funzione da `api.ts`
3. Usa `generateId()` da `supabase.ts` per nuovi ID
4. Gestisci errori con try/catch e console.error
5. Restituisci `Response.json()` con status appropriato

## Categorie Editoriali (valori esatti)

I nomi categoria devono essere **esattamente** questi (case-sensitive):

```
Tecnologia, Politica, Economia, Scienza, Sport, Cultura, Salute
```

NON usare minuscolo. NON tradurre. Sono usati come chiavi in `NEWS_TEMPLATES` e `REWRITING_STYLES` in `ai-engine.ts`.

## Stato Globale (Zustand)

Il store e in `src/lib/store.ts`. Tipi principali:

- `ViewMode`: `'magazine' | 'admin'`
- `AdminTab`: `'agents' | 'approval' | 'publishing' | 'activity' | 'settings'`
- `Agent`, `Article`, `ActivityLog`, `Settings`, `PublishLog`, `ApprovalLog`

Tutte le interfacce usano camelCase. I componenti React accedono allo stato tramite `useNexusStore()`.

## Regole di Sviluppo

1. **Niente Prisma** - il progetto ha migrato a Supabase diretto. Se trovi riferimenti a `@/lib/db` o `prisma`, rimuovili.
2. **Niente `output: "standalone"`** - Cloudflare Pages usa il proprio sistema di build.
3. **Environment variables** - solo `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Nessun secret lato server.
4. **Nessun filesystem** - l'app gira su Cloudflare Workers (edge runtime). Non usare `fs`, `path`, o qualsiasi Node.js-only API.
5. **SQL files** - lo schema e il seed sono in `download/supabase-schema.sql` e `download/supabase-seed.sql` (non committati, in .gitignore).
6. **Categorie esatte** - quando filtri per categoria, usa i nomi esatti ("Tecnologia" non "tecnologia").
7. **Componenti UI** - i file in `src/components/ui/` sono generati da shadcn/ui, non modificarli direttamente.
8. **Stile** - usa `cn()` da `@/lib/utils` per classi condizionali Tailwind.

## Deploy

```bash
# Build per Cloudflare Pages
npx @opennextjs/cloudflare

# Deploy diretto
npx wrangler pages deploy .open-next --project-name=nexus-news-ai
```

Su Cloudflare Pages dashboard:
- Build command: `npx @opennextjs/cloudflare`
- Output directory: `.open-next`
- Node.js: 20+
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## AI Engine

Il file `src/lib/ai-engine.ts` simula la pipeline editoriale:

1. **collectNews(category)** - pesca 1-2 template dalla categoria
2. **evaluateNews(articles)** - assegna score 60-98 basato su lunghezza
3. **rewriteArticle(news, category)** - aggiunge prefisso titolo, sottotitolo editoriale, intro
4. **processCategoryForAgent(category)** - esegue l'intera pipeline

In produzione, `collectNews` dovrebbe chiamare API esterne (news APIs, RSS) e usare un LLM vero per la riscrittura.

## Pipeline Editoriale

```
Raccolta (collect) → Valutazione (evaluate) → Riscrittura (rewrite) → Approvazione (approve) → Pubblicazione (publish)
```

- **Semi-autonomo**: gli articoli vanno in `pending_approval` e richiedono approvazione manuale
- **Completamente autonomo**: gli articoli vengono auto-approvati e vanno direttamente in `approved`