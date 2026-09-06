'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  title: string;
}

export function ShareButtons({ title }: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined' ? window.location.href : '';

  const share = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Link copiato', description: 'Il link dell\u2019articolo è negli appunti' });
    } catch {
      toast({ title: 'Errore', description: 'Impossibile copiare il link', variant: 'destructive' });
    }
  };

  const encoded = encodeURIComponent(`${title} — Nexus News AI`);
  const encUrl = encodeURIComponent(url);

  return (
    <div className="flex items-center gap-1.5">
      <a
        href={`https://twitter.com/intent/tweet?text=${encoded}&url=${encUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Condividi su X"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border hover:bg-muted transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Condividi su LinkedIn"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border hover:bg-muted transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125M7.119 20.452H3.554V9h3.565zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/></svg>
      </a>
      <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full px-3" onClick={share}>
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
        <span className="text-xs">Condividi</span>
      </Button>
    </div>
  );
}

export function CopyLinkButton() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 gap-1 px-2"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast({ title: 'Errore', description: 'Copia non riuscita', variant: 'destructive' });
        }
      }}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Link2 className="h-3 w-3" />}
      <span className="text-[11px]">{copied ? 'Copiato' : 'Copia link'}</span>
    </Button>
  );
}
