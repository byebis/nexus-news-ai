'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Network, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n';
import { authorHref } from '@/lib/agent-slug';

interface RunStep {
  agentName: string;
  role: string;
  kind: string;
  score?: number;
}

interface RunData {
  topic: string;
  status: string;
  sources?: { title: string; source: string; url: string }[];
  steps?: RunStep[];
  agentsInvolved?: { name: string; role: string }[];
  reviewScore?: number;
}

/**
 * WireProvenance — mostra sull'articolo che è nato dalla Redazione Collettiva:
 * fonti lette, agenti coinvolti, qualità media, link al portale.
 */
export default function WireProvenance({ articleId }: { articleId: string }) {
  const t = useT();
  const [data, setData] = useState<RunData | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/wire/runs?articleId=${encodeURIComponent(articleId)}`, {
          signal: ac.signal,
        });
        const json = await res.json();
        if (json?.enabled && json?.run?.data?.status === 'completed') {
          setData(json.run.data as RunData);
        }
      } catch {
        // silent — nessuna provenienza
      }
    })();
    return () => ac.abort();
  }, [articleId]);

  if (!data) return null;

  const uniqueAgents = data.agentsInvolved?.length
    ? data.agentsInvolved
    : (data.steps || []).filter((s) => s.agentName !== 'Sistema' && s.agentName !== 'Nexus Wire').map((s) => ({ name: s.agentName, role: s.role }));

  return (
    <aside
      aria-label={t('wireProvenanceTitle')}
      className="my-6 rounded-xl border-l-4 border-violet-500 bg-violet-500/5 px-5 py-4 sm:px-6"
    >
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
        <Network className="h-3.5 w-3.5" aria-hidden /> {t('wireProvenanceTitle')}
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground">{t('wireProvenanceSub')}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {data.sources?.length ? (
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            {t('wireSources', { n: data.sources.length })}
          </Badge>
        ) : null}
        {typeof data.reviewScore === 'number' && (
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            {t('wireQuality', { n: data.reviewScore })}
          </Badge>
        )}
        {uniqueAgents.slice(0, 6).map((a) => (
          <Link key={a.name + a.role} href={authorHref(a.name)}>
            <Badge variant="secondary" className="text-[10px] transition-colors hover:bg-violet-100 dark:hover:bg-violet-900/40">
              {a.name}
            </Badge>
          </Link>
        ))}
      </div>
      <Link
        href="/wire"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:underline dark:text-violet-400"
      >
        {t('wireSeePortal')} →
      </Link>
    </aside>
  );
}
