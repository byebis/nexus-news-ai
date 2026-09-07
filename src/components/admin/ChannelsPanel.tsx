'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Send,
  Link2,
  MessageSquare,
  Linkedin,
  Camera,
  ThumbsUp,
  Loader2,
  Save,
  PlugZap,
  CheckCircle2,
  XCircle,
  MinusCircle,
  RefreshCw,
  Power,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useNexusStore, type ChannelConfig } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  blog: <Globe className="h-5 w-5" />,
  telegram: <Send className="h-5 w-5" />,
  webhook: <Link2 className="h-5 w-5" />,
  twitter: <MessageSquare className="h-5 w-5" />,
  linkedin: <Linkedin className="h-5 w-5" />,
  instagram: <Camera className="h-5 w-5" />,
  facebook: <ThumbsUp className="h-5 w-5" />,
};

const CHANNEL_FIELDS: Record<string, { key: string; label: string; placeholder: string; type?: string }[]> = {
  telegram: [
    { key: 'bot_token', label: 'Bot Token (da @BotFather)', placeholder: '123456789:AAF...', type: 'password' },
    { key: 'chat_id', label: 'Chat ID (canale, gruppo o utente)', placeholder: '@miocanale o -1001234567890' },
  ],
  webhook: [
    { key: 'url', label: 'URL Webhook (Make/Zapier/n8n)', placeholder: 'https://hook.eu2.make.com/...' },
    { key: 'secret', label: 'Segreto condiviso (opzionale)', placeholder: 'verrà inviato come X-Nexus-Secret', type: 'password' },
  ],
  twitter: [
    { key: 'handle', label: 'Handle X/Twitter', placeholder: '@nexusnews_ai' },
    { key: 'relay_webhook', label: 'Relay webhook per X (Make/Zapier/n8n)', placeholder: 'https://hook...' },
  ],
  linkedin: [
    { key: 'handle', label: 'Pagina LinkedIn', placeholder: 'Nexus News AI' },
    { key: 'relay_webhook', label: 'Relay webhook per LinkedIn', placeholder: 'https://hook...' },
  ],
  instagram: [
    { key: 'handle', label: 'Account Instagram', placeholder: '@nexusnews.ai' },
    { key: 'relay_webhook', label: 'Relay webhook per Instagram', placeholder: 'https://hook...' },
  ],
  facebook: [
    { key: 'page_url', label: 'Pagina Facebook', placeholder: 'facebook.com/nexusnewsai' },
    { key: 'relay_webhook', label: 'Relay webhook per Facebook', placeholder: 'https://hook...' },
  ],
};

const CHANNEL_HINTS: Record<string, string> = {
  blog: 'Il sito stesso: ogni articolo pubblicato appare nel magazine. Sempre attivo.',
  telegram: 'Pubblicazione diretta e reale tramite Bot API: crea un bot con @BotFather, aggiungilo al canale come amministratore e inserisci token + chat_id.',
  webhook: 'Collega qualsiasi automazione (Make, Zapier, n8n, IFTTT): Nexus invia un JSON con titolo, riassunto, URL e categoria dell\'articolo.',
  twitter: 'X/Twitter richiede API a pagamento: collega qui un relay webhook (es. automazione Make) per pubblicare davvero.',
  linkedin: 'Pubblica tramite relay webhook (Make/Zapier con app LinkedIn collegata).',
  instagram: 'Pubblica tramite relay webhook (Make/Zapier con account business collegato).',
  facebook: 'Pubblica tramite relay webhook (Make/Zapier con pagina collegata).',
};

function TestStatusBadge({ channel }: { channel: ChannelConfig }) {
  if (!channel.lastTestStatus) return null;
  if (channel.lastTestStatus === 'success') {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-xs gap-1">
        <CheckCircle2 className="h-3 w-3" /> Test OK
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-0 text-xs gap-1">
      <XCircle className="h-3 w-3" /> Test fallito
    </Badge>
  );
}

function ChannelCard({ channel, onChanged }: { channel: ChannelConfig; onChanged: () => void }) {
  const [enabled, setEnabled] = useState(channel.enabled);
  const [config, setConfig] = useState<Record<string, string>>(channel.config || {});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const fields = CHANNEL_FIELDS[channel.channel] || [];
  const isBlog = channel.channel === 'blog';

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/channels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: channel.channel, enabled, config }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Errore', description: data.error || 'Salvataggio fallito', variant: 'destructive' });
        return;
      }
      toast({
        title: 'Canale salvato',
        description: `${channel.label}: ${enabled ? 'attivo' : 'disattivo'}`,
      });
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/channels/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: channel.channel }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Errore', description: data.error || 'Test fallito', variant: 'destructive' });
        return;
      }
      if (data.status === 'success') {
        toast({ title: '✅ Connessione OK', description: data.detail });
      } else {
        toast({ title: '❌ Test fallito', description: data.detail, variant: 'destructive' });
      }
      onChanged();
    } finally {
      setTesting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border bg-card p-4 sm:p-5 space-y-3 ${enabled ? 'ring-1 ring-emerald-500/30' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${enabled ? 'bg-gradient-to-br from-cyan-500 to-violet-600 text-white' : 'bg-muted text-muted-foreground'}`}>
            {CHANNEL_ICONS[channel.channel] || <Globe className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-tight">{channel.label}</h3>
            <p className="text-xs text-muted-foreground">{channel.channel}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {!isBlog && (
            <div className="flex items-center gap-1.5">
              <Power className={`h-3.5 w-3.5 ${enabled ? 'text-emerald-500' : 'text-muted-foreground'}`} />
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                aria-label={`Attiva ${channel.label}`}
              />
            </div>
          )}
          {isBlog && (
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" /> Sempre attivo
            </Badge>
          )}
          <TestStatusBadge channel={channel} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{CHANNEL_HINTS[channel.channel]}</p>

      <div className="space-y-2.5">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label htmlFor={`ch-${channel.channel}-${f.key}`} className="text-xs">
              {f.label}
            </Label>
            <Input
              id={`ch-${channel.channel}-${f.key}`}
              type={f.type || 'text'}
              placeholder={f.placeholder}
              value={config[f.key] ?? ''}
              onChange={(e) => setConfig((c) => ({ ...c, [f.key]: e.target.value }))}
              className="text-sm"
            />
          </div>
        ))}
        {channel.lastTestDetail && (
          <p className={`text-xs rounded-lg px-2.5 py-1.5 ${channel.lastTestStatus === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
            {channel.lastTestDetail}
          </p>
        )}
      </div>

      {!isBlog && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 flex-1">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Salva
          </Button>
          <Button size="sm" variant="outline" onClick={handleTest} disabled={testing} className="gap-1.5 flex-1">
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />}
            Test connessione
          </Button>
        </div>
      )}
    </motion.div>
  );
}

export default function ChannelsPanel() {
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChannels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/channels');
      const data = await res.json();
      if (res.ok) setChannels(data.channels || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Caricamento canali…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Canali di Pubblicazione</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configura dove la redazione può distribuire gli articoli. Telegram e webhook funzionano in diretta reale;
            gli altri social si collegano tramite automazioni.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadChannels} className="gap-1.5 self-start">
          <RefreshCw className="h-3.5 w-3.5" /> Ricarica
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {channels.map((ch) => (
          <ChannelCard key={ch.id} channel={ch} onChanged={loadChannels} />
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-900 p-3.5 text-xs text-amber-800 dark:text-amber-200">
        <MinusCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Nota: i canali disattivati o non configurati <strong>non bloccano</strong> la pubblicazione — vengono
          semplicemente segnalati come &quot;non configurato&quot; nel risultato. Il blog resta sempre attivo.
        </p>
      </div>
    </div>
  );
}
