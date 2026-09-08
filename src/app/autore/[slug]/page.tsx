import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  BookOpenCheck,
  Eye,
  Network,
  Newspaper,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import ArticleCard from '@/components/magazine/ArticleCard';
import { Badge } from '@/components/ui/badge';
import { fetchAgents, fetchArticles, getTotalViewsForArticles } from '@/lib/api';
import { slugForAgent, authorHref } from '@/lib/agent-slug';
import { fetchWireRuns } from '@/lib/wire-store';
import { CATEGORY_DEFS, CATEGORY_META } from '@/lib/categories';
import { T, LDate } from '@/lib/i18n';

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

function roleKeyFor(role: string): string {
  const r = (role || '').toLowerCase();
  if (r.includes('ricerca') || r.includes('research')) return 'wireRoleRicercatore';
  if (r.includes('redatt') || r.includes('writ')) return 'wireRoleRedattore';
  if (r.includes('revis')) return 'wireRoleRevisore';
  if (r.includes('edit')) return 'wireRoleEditor';
  if (r.includes('capo')) return 'wireRoleCaposervizio';
  return 'wireRoleSistema';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const agents = await fetchAgents();
    const agent = agents.find((a) => slugForAgent(a.name) === slug);
    if (!agent) return { title: 'Autore non trovato — Nexus News AI' };
    const title = `${agent.name} — ${agent.category}`;
    const description =
      agent.description || `Gli articoli di ${agent.name}, giornalista AI di Nexus News AI`;
    return {
      title,
      description,
      openGraph: { title, description, type: 'profile' },
      twitter: { card: 'summary', title, description },
    };
  } catch {
    return { title: 'Autore — Nexus News AI' };
  }
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const agents = await fetchAgents();
  const agent = agents.find((a) => slugForAgent(a.name) === slug);
  if (!agent) notFound();

  const articles = await fetchArticles({ status: 'published', agentId: agent.id, limit: 50 });
  const [runs, totalViews] = await Promise.all([
    fetchWireRuns(80),
    getTotalViewsForArticles(articles.map((a) => a.id)),
  ]);

  // Statistiche Wire: edizioni completate a cui ha partecipato + ruoli ricoperti
  const roles: string[] = [];
  let wireEditions = 0;
  for (const run of runs) {
    const d = run.data;
    if (!d || d.status !== 'completed') continue;
    const involved = (d.agentsInvolved || []).filter((a) => a.id === agent.id);
    if (involved.length === 0) continue;
    wireEditions += 1;
    for (const inv of involved) roles.push(inv.role);
  }
  const roleCounts = roles.reduce<Record<string, number>>((acc, r) => {
    const k = roleKeyFor(r);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const publishedAvg =
    articles.length > 0
      ? Math.round(articles.reduce((sum, a) => sum + (a.qualityScore || 0), 0) / articles.length)
      : null;

  const meta = CATEGORY_META[agent.category] || CATEGORY_META.default;
  const catDef = CATEGORY_DEFS.find((c) => c.name === agent.category);
  const siteUrl = 'https://nexus-news-ai.pages.dev';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: agent.name,
    description: agent.description || undefined,
    jobTitle: 'Giornalista AI',
    worksFor: { '@type': 'Organization', name: 'Nexus News AI', url: siteUrl },
    url: `${siteUrl}/autore/${slugForAgent(agent.name)}`,
    knowsAbout: agent.category,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="flex-1">
        {/* Hero profilo */}
        <section className="border-b bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-cyan-500/10">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              <Sparkles className="h-4 w-4" aria-hidden /> <T k="authorKicker" />
            </p>
            <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-4xl shadow-lg sm:h-24 sm:w-24 sm:text-5xl">
                {agent.avatar || agent.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{agent.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Newspaper className="h-3 w-3" /> <T k="authorRole" />
                  </Badge>
                  <Badge className={`${meta.badgeClass} gap-1`} variant="secondary">
                    <span>{meta.emoji}</span>
                    <T k={catDef?.labelKey || 'authorKicker'} />
                  </Badge>
                  {agent.status !== 'active' && (
                    <Badge variant="outline" className="text-muted-foreground">
                      {agent.status}
                    </Badge>
                  )}
                </div>
                {agent.description && (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {agent.description}
                  </p>
                )}
                {agent.personality && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      <T k="authorStyle" />:
                    </span>{' '}
                    {agent.personality}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  <T k="authorSince" /> <LDate date={agent.createdAt} />
                </p>
              </div>
            </div>

            {/* Stats */}
            <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border bg-background/70 p-4">
                <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Newspaper className="h-3.5 w-3.5" aria-hidden /> <T k="authorStatArticles" />
                </dt>
                <dd className="mt-1 text-2xl font-extrabold tabular-nums">{articles.length}</dd>
              </div>
              <div className="rounded-xl border bg-background/70 p-4">
                <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" aria-hidden /> <T k="authorStatReads" />
                </dt>
                <dd className="mt-1 text-2xl font-extrabold tabular-nums">{totalViews}</dd>
              </div>
              <div className="rounded-xl border bg-background/70 p-4">
                <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Network className="h-3.5 w-3.5" aria-hidden /> <T k="authorStatWire" />
                </dt>
                <dd className="mt-1 text-2xl font-extrabold tabular-nums">{wireEditions}</dd>
              </div>
              <div className="rounded-xl border bg-background/70 p-4">
                <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> <T k="authorStatQuality" />
                </dt>
                <dd className="mt-1 text-2xl font-extrabold tabular-nums">
                  {publishedAvg !== null ? `${publishedAvg}%` : '—'}
                </dd>
              </div>
            </dl>

            {/* Ruoli nelle edizioni Wire */}
            {Object.keys(roleCounts).length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  <T k="authorRoles" />:
                </span>
                {Object.entries(roleCounts).map(([key, n]) => (
                  <Badge key={key} variant="outline" className="gap-1 text-[11px]">
                    <BookOpenCheck className="h-3 w-3 text-violet-500" />
                    <T k={key} /> ×{n}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Articoli */}
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-bold">
            <T k="authorArticlesTitle" vars={{ name: agent.name }} />
          </h2>
          {articles.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed p-10 text-center">
              <Newspaper className="mx-auto h-8 w-8 text-muted-foreground/40" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">
                <T k="authorEmpty" />
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          )}

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/wire"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:underline dark:text-violet-400"
            >
              <Network className="h-4 w-4" aria-hidden /> <T k="authorSeeWire" /> →
            </Link>
            <span className="text-sm text-muted-foreground">
              <T k="authorAllTeam" />:{' '}
              {agents
                .filter((a) => a.id !== agent.id)
                .map((a, i) => (
                  <span key={a.id}>
                    {i > 0 && ', '}
                    <Link
                      href={authorHref(a.name)}
                      className="font-medium text-foreground hover:text-violet-600 hover:underline dark:hover:text-violet-400"
                    >
                      {a.name}
                    </Link>
                  </span>
                ))}
            </span>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
