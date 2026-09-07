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
      <a
        href={`https://wa.me/?text=${encoded}%20${encUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Condividi su WhatsApp"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border hover:bg-emerald-500/10 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-emerald-500"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
      </a>
      <a
        href={`https://t.me/share/url?url=${encUrl}&text=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Condividi su Telegram"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border hover:bg-sky-500/10 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-sky-500"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
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
