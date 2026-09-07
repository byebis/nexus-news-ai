'use client';

import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useT } from '@/lib/i18n';

/**
 * SummaryBox — "In sintesi" key-points box, magazine style
 * (like NYT "Catch Up Fast" / Corriere's key points).
 * Server computes the text (AI summary or extractive fallback);
 * this client component splits it into bullets and localizes the label.
 */
export default function SummaryBox({ summary }: { summary: string }) {
  const t = useT();

  const points = useMemo(
    () =>
      (summary || '')
        .split(/(?<=[.!?])\s+(?=[A-ZÀÈÉÌÒÙ0-9])/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20)
        .slice(0, 4),
    [summary]
  );

  if (points.length === 0) return null;

  return (
    <aside
      aria-label={t('summaryKicker')}
      className="my-6 rounded-xl border-l-4 border-primary bg-muted/40 px-5 py-4 sm:px-6"
    >
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-primary">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        {t('summaryKicker')}
      </p>
      <ul className="mt-2.5 space-y-2">
        {points.map((p, i) => (
          <li key={i} className="flex gap-2.5 text-[0.95rem] leading-relaxed text-foreground/90">
            <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rotate-45 bg-primary/70" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
