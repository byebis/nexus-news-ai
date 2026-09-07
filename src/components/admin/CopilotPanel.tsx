'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Loader2, Trash2, FileEdit, CheckCircle2, UserCog, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNexusStore } from '@/lib/store';
import { Textarea } from '@/components/ui/textarea';

/**
 * Tab "Copilot" — Nexus Copilot: studio AI della redazione.
 * Chat con contesto live della redazione + bozze articoli inviabili alla coda.
 */

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

interface Draft {
  title: string;
  subtitle: string;
  summary: string;
  content: string;
  category: string;
}

interface AgentLite {
  id: string;
  name: string;
  category: string;
}

const QUICK_PROMPTS = [
  { label: 'Cosa coprire oggi?', prompt: 'Analizza gli articoli degli ultimi giorni: quali argomenti o angoli mancano e cosa dovremmo coprire oggi? Dammi 3 idee concrete.' },
  { label: 'Analisi performance', prompt: 'Analizza le performance degli articoli recenti (letture, qualit\u00e0): cosa sta funzionando meglio e perch\u00e9?' },
  { label: '5 titoli virali', prompt: 'Proponi 5 titoli ad alto impatto per i temi pi\u00f9 caldi della settimana, senza scrivere bozze.' },
  { label: 'Bozza: IA e futuro', prompt: 'Scrivi una bozza di articolo sull\u2019evoluzione dell\u2019intelligenza artificiale nelle imprese italiane.' },
];

const CATEGORIES = ['Tecnologia', 'Politica', 'Economia', 'Scienza', 'Sport', 'Cultura', 'Salute'];

export default function CopilotPanel() {
  const { toast } = useToast();
  const { setPendingArticles } = useNexusStore();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftKey, setDraftKey] = useState(0);
  const [agents, setAgents] = useState<AgentLite[]>([]);
  const [agentId, setAgentId] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/agents')
      .then((r) => (r.ok ? r.json() : null))
      .then((list) => {
        if (cancelled || !Array.isArray(list)) return;
        const lite = list.map((a: any) => ({
          id: a.id,
          name: a.name,
          category: a.category,
        }));
        setAgents(lite);
        if (lite.length > 0) setAgentId(lite[0].id);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    const nextMessages: ChatMsg[] = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setLoading(true);
    setDraft(null);
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
        signal: AbortSignal.timeout(65_000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: 'Copilot in errore', description: data.error || 'Errore inatteso', variant: 'destructive' });
        return;
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: data.note || '(risposta vuota)' }]);
      if (data.draft) {
        setDraft(data.draft);
        setDraftKey((k) => k + 1);
        toast({ title: 'Bozza pronta \u270d', description: "Controlla l'anteprima e inviala alla coda." });
      }
    } catch {
      toast({ title: 'Copilot in errore', description: 'Timeout o errore di rete, riprova.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([]);
    setDraft(null);
    setInput('');
  };

  const sendToQueue = async () => {
    if (!draft) return;
    setSending(true);
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          subtitle: draft.subtitle,
          summary: draft.summary,
          content: draft.content,
          category: draft.category,
          agentId: agentId || undefined,
          sourceName: 'Nexus Copilot',
          status: 'pending_approval',
          qualityScore: 70,
          readTime: Math.max(2, Math.round(draft.content.split(/\s+/).length / 200)),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: 'Invio fallito', description: data.error || 'Errore inatteso', variant: 'destructive' });
        return;
      }
      toast({ title: 'Bozza in coda \u2713', description: 'La trovi nel tab Coda Approvazione.' });
      setDraft(null);
      // Aggiorna la coda nello store (il pannello la ricaricera')
      fetch('/api/articles?status=pending_approval&limit=50')
        .then((r) => (r.ok ? r.json() : null))
        .then((list) => {
          if (Array.isArray(list)) setPendingArticles(list);
        })
        .catch(() => undefined);
    } catch {
      toast({ title: 'Invio fallito', description: 'Errore di rete, riprova.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* Chat */}
      <div className="flex flex-col rounded-xl border overflow-hidden" style={{ minHeight: 480 }}>
        <div className="flex items-center justify-between gap-2 border-b bg-gradient-to-r from-violet-500/10 via-rose-500/10 to-orange-500/10 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #f43f5e)' }}
            >
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight">Nexus Copilot</p>
              <p className="text-[11px] text-muted-foreground truncate">
                L’assistente AI della redazione — conosce gli articoli e gli agenti
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={reset} aria-label="Azzera chat" className="shrink-0">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ maxHeight: 480 }}>
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Chiedi analisi, idee di copertura, titoli o una <b>bozza completa</b> da mandare in coda.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => send(qp.prompt)}
                    className="rounded-lg border bg-muted/30 px-3 py-2.5 text-left text-xs transition-colors hover:bg-muted hover:border-violet-400"
                  >
                    <span className="block font-semibold">{qp.label}</span>
                    <span className="mt-0.5 block text-muted-foreground line-clamp-1">{qp.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  m.role === 'user'
                    ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-violet-500/10 border border-violet-500/20 px-3 py-2 text-sm whitespace-pre-wrap break-words'
                    : 'max-w-[92%] rounded-2xl rounded-bl-sm border bg-muted/40 px-3 py-2 text-sm whitespace-pre-wrap break-words'
                }
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                <span className="animate-pulse">Copilot sta lavorando…</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-2"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Es. “Scrivi una bozza sull’adozione AI nello sport”…"
              rows={1}
              className="min-h-[42px] resize-none"
              maxLength={4000}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || loading}
              aria-label="Invia"
              className="h-[42px] w-[42px] shrink-0 rounded-full"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #f43f5e)' }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Anteprima bozza */}
      <div className="rounded-xl border overflow-hidden flex flex-col" style={{ minHeight: 480 }}>
        <div className="border-b bg-muted/40 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-bold">
            <FileEdit className="h-4 w-4 text-orange-500" />
            Anteprima bozza
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Controlla, assegna un agente e invia alla coda di approvazione.
          </p>
        </div>

        {!draft ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
            <FileEdit className="h-8 w-8 opacity-30" />
            <p className="text-xs">Nessuna bozza in attesa. Chiedine una al Copilot: apparirà qui.</p>
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto p-4" key={draftKey}>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Titolo</p>
              <p className="text-sm font-bold leading-snug">{draft.title}</p>
              {draft.subtitle && <p className="text-xs text-muted-foreground">{draft.subtitle}</p>}
            </div>
            {draft.summary && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Riassunto</p>
                <p className="text-xs leading-relaxed">{draft.summary}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Categoria</p>
              <Badge variant="secondary">{draft.category}</Badge>
              {!CATEGORIES.includes(draft.category) && (
                <p className="text-[11px] text-destructive">
                  Categoria non standard, verrà impostata a Tecnologia.
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Testo ({draft.content.split(/\s+/).length} parole)
              </p>
              <div className="max-h-40 overflow-y-auto rounded-lg border bg-muted/20 p-2.5 text-xs leading-relaxed whitespace-pre-wrap">
                {draft.content}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <UserCog className="h-3.5 w-3.5" /> Firma come agente
              </p>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full rounded-md border bg-background px-2.5 py-2 text-sm outline-none focus:border-violet-400"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.category})
                  </option>
                ))}
                {agents.length === 0 && <option value="">Nessun agente disponibile</option>}
              </select>
            </div>
            <Button
              onClick={sendToQueue}
              disabled={sending}
              className="w-full gap-2"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #f43f5e)' }}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {sending ? 'Invio…' : 'Invia alla coda di approvazione'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
