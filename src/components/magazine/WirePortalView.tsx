'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Eye,
  FileSearch,
  Loader2,
  Network,
  PenLine,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n';
import { authorHref } from '@/lib/agent-slug';
import { CATEGORY_DEFS } from '@/lib/categories';
import type { WireRunData, WireCommentRow } from '@/lib/wire-store';

interface RunItem {
  id: string;
  status: string;
  createdAt: string;
  data: WireRunData;
}

interface WireAgentCard {
  id: string;
  name: string;
  avatar: string;
  category: string;
  articles: number;
}

interface Props {
  enabled: boolean;
  runs: RunItem[];
  comments: WireCommentRow[];
  articleMap: Record<string, { title: string; status: string }>;
  agents?: WireAgentCard[];
}

function catLabelKey(category: string): string {
  const def = CATEGORY_DEFS.find((c) => c.name === category);
  return def?.labelKey || 'authorKicker';
}

function roleKey(role: string): string {
  const r = (role || '').toLowerCase();
  if (r.includes('ricerca') || r.includes('research')) return 'wireRoleRicercatore';
  if (r.includes('redatt') || r.includes('writ')) return 'wireRoleRedattore';
  if (r.includes('revis')) return 'wireRoleRevisore';
  if (r.includes('edit')) return 'wireRoleEditor';
  if (r.includes('capo')) return 'wireRoleCaposervizio';
  return 'wireRoleSistema';
}

function kindIcon(kind: string) {
  switch (kind) {
    case 'research':
      return <Search className="h-3.5 w-3.5" />;
    case 'draft':
      return <PenLine className="h-3.5 w-3.5" />;
    case 'review':
      return <Eye className="h-3.5 w-3.5" />;
    default:
      return <ShieldCheck className="h-3.5 w-3.5" />;
  }
}

const PIPELINE = [
  { icon: <BookOpenCheck className="h-5 w-5" />, titleKey: 'wireStep1', bodyKey: 'wireStep1Body' },
  { icon: <FileSearch className="h-5 w-5" />, titleKey: 'wireStep2', bodyKey: 'wireStep2Body' },
  { icon: <PenLine className="h-5 w-5" />, titleKey: 'wireStep3', bodyKey: 'wireStep3Body' },
  { icon: <ShieldCheck className="h-5 w-5" />, titleKey: 'wireStep4', bodyKey: 'wireStep4Body' },
];

export default function WirePortalView({ enabled, runs, comments, articleMap, agents = [] }: Props) {
  const t = useT();

  const visibleComments = useMemo(() => comments.slice(0, 24), [comments]);

  if (!enabled) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <Network className="mx-auto h-12 w-12 text-muted-foreground/40" aria-hidden />
        <h1 className="mt-4 text-2xl font-extrabold">{t('wireDisabledTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('wireDisabledBody')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 p-6 sm:p-10">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
          <Network className="h-4 w-4" aria-hidden /> {t('wireKicker')}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{t('wireTitle')}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">{t('wireSubtitle')}</p>

        {/* Pipeline */}
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map((s, i) => (
            <li key={s.titleKey} className="rounded-xl border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                {s.icon}
                <span className="text-xs font-bold uppercase tracking-wide">{t(s.titleKey)}</span>
                <span className="ml-auto text-[10px] font-bold tabular-nums text-muted-foreground">{i + 1}</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t(s.bodyKey)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* La Squadra — sette agenti, una redazione */}
      {agents.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold">{t('wireTeam')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('wireTeamSub')}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {agents.map((a) => (
              <li key={a.id}>
                <Link
                  href={authorHref(a.name)}
                  className="group flex h-full items-center gap-3 rounded-xl border bg-background/60 p-4 transition hover:border-violet-400 hover:shadow-sm"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xl">
                    {a.avatar || a.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold group-hover:text-violet-600 dark:group-hover:text-violet-400">
                      {a.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {t(catLabelKey(a.category))} · {t('wireTeamArticles', { n: a.articles })}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Edizioni */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold">{t('wireEditions')}</h2>
        {runs.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed p-10 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-none text-muted-foreground/40" aria-hidden />
            <h3 className="mt-3 font-semibold">{t('wireEmptyTitle')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('wireEmptyBody')}</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {runs.map((run) => {
              const d = run.data || ({} as WireRunData);
              const article = d.articleId ? articleMap[d.articleId] : undefined;
              const articlePublic = article && (article.status === 'published' || article.status === 'approved');
              const failed = d.status === 'failed';
              const runningNow = d.status === 'running';
              return (
                <li key={run.id} className="rounded-xl border p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {failed ? (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" /> {t('wireStatusFailed')}
                      </Badge>
                    ) : runningNow ? (
                      <Badge variant="outline" className="gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> {t('wireStatusRunning')}
                      </Badge>
                    ) : (
                      <Badge className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> {t('wireStatusCompleted')}
                      </Badge>
                    )}
                    {typeof d.reviewScore === 'number' && !failed && (
                      <Badge variant="outline" className="gap-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" /> {t('wireQuality', { n: d.reviewScore })}
                      </Badge>
                    )}
                    {d.sources?.length ? (
                      <Badge variant="outline">{t('wireSources', { n: d.sources.length })}</Badge>
                    ) : null}
                    <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(run.createdAt).toLocaleString('it-IT', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <h3 className="mt-2 font-bold">{d.topic}</h3>
                  {failed && d.error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{d.error}</p>}
                  {d.agentsInvolved?.length > 0 && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {d.agentsInvolved.map((a, i) => (
                        <span key={a.name + a.role}>
                          {i > 0 && ' — '}
                          <Link
                            href={authorHref(a.name)}
                            className="font-medium hover:text-violet-600 hover:underline dark:hover:text-violet-400"
                          >
                            {a.name}
                          </Link>
                          {' · '}
                          {t(roleKey(a.role))}
                        </span>
                      ))}
                    </p>
                  )}
                  {articlePublic && d.articleId && (
                    <Link
                      href={`/articolo/${d.articleId}`}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:underline dark:text-violet-400"
                    >
                      {t('wireReadArticle')} →
                    </Link>
                  )}
                  {article && !articlePublic && d.articleId && (
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {t('wirePendingApproval')}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Bacheca — commenti tra agenti */}
      {visibleComments.length > 0 && (
        <section className="mt-12 border-t pt-8">
          <h2 className="text-2xl font-bold">{t('wireBoard')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('wireBoardSub')}</p>
          <ul className="mt-5 space-y-3">
            {visibleComments.map((c) => (
              <li key={c.id} className="flex gap-3 rounded-xl border bg-muted/30 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold text-white">
                  {(c.agentName || 'AI').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={authorHref(c.agentName)}
                      className="text-sm font-bold hover:text-violet-600 hover:underline dark:hover:text-violet-400"
                    >
                      {c.agentName}
                    </Link>
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      {kindIcon(c.kind)}
                      {t(roleKey(c.role))}
                    </Badge>
                    {typeof c.score === 'number' && (
                      <Badge variant="outline" className="text-[10px]">
                        {c.score}/100
                      </Badge>
                    )}
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {new Date(c.createdAt).toLocaleString('it-IT', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/85">{c.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
