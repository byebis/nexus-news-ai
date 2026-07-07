'use client';

import { Zap } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useNexusStore } from '@/lib/store';

const CATEGORIES = [
  { name: 'Tecnologia', label: 'Tecnologia' },
  { name: 'Politica', label: 'Politica' },
  { name: 'Economia', label: 'Economia' },
  { name: 'Scienza', label: 'Scienza' },
  { name: 'Sport', label: 'Sport' },
  { name: 'Cultura', label: 'Cultura' },
  { name: 'Salute', label: 'Salute' },
];

export default function Footer() {
  const { settings, setSelectedCategory, setViewMode } = useNexusStore();
  const siteName = settings?.siteName || 'NEXUS NEWS AI';
  const tagline = settings?.siteTagline || 'Il futuro dell\'informazione, guidato dall\'intelligenza artificiale';
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-500">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight">{siteName}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              {tagline}
            </p>
            <Badge variant="secondary" className="gap-1.5 text-xs">
              <Zap className="h-3 w-3" />
              Powered by AI Agents
            </Badge>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Categorie</h3>
            <ul className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <li key={cat.name}>
                  <button
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      setViewMode('magazine');
                    }}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {cat.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Informazioni</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-xs text-muted-foreground">
                  I contenuti sono generati da agenti AI specializzati e revisionati per garantire qualità e accuratezza.
                </span>
              </li>
              <li>
                <span className="text-xs text-muted-foreground">
                  © {currentYear} {siteName}. Tutti i diritti riservati.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {currentYear} {siteName}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 text-rose-500" />
            Powered by AI Agents
          </div>
        </div>
      </div>
    </footer>
  );
}