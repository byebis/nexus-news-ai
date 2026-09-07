import { supabase } from '@/lib/supabase';
import { getSessionUser } from '@/lib/auth';
import { extractJSON } from '@/lib/openrouter';

export const maxDuration = 60;

/**
 * POST /api/copilot — "Nexus Copilot" (admin + editor)
 * Body: { messages: Array<{ role: 'user' | 'assistant', content: string }> }
 *
 * Studio AI della redazione:
 *  - il system prompt include il contesto live della redazione (articoli recenti, categorie, agenti)
 *  - quando l'utente chiede una bozza, l'LLM emette un blocco BOZZA_JSON strutturato
 *    che il client mostra con preview + "invia alla coda di approvazione"
 */

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface CopilotDraft {
  title: string;
  subtitle: string;
  summary: string;
  content: string;
  category: string;
}

async function buildRedazioneContext(): Promise<string> {
  try {
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const [{ data: recent }, { data: agents }, { data: counts }] = await Promise.all([
      supabase
        .from('articles')
        .select('title, category, status, quality_score, created_at, views')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(15),
      supabase.from('agents').select('name, category, role').limit(12),
      supabase.from('articles').select('status'),
    ]);

    const byStatus = (s: string) => (counts || []).filter((r: any) => r.status === s).length;
    const total = (counts || []).length;

    const recentLines = (recent || [])
      .map(
        (r: any) =>
          `- [${r.status}] ${r.title} (${r.category}, qualita' ${r.quality_score ?? '?'}%, ${r.views ?? 0} letture, ${new Date(r.created_at).toLocaleDateString('it-IT')})`
      )
      .join('\n');

    const agentLines = (agents || [])
      .map((a: any) => `- ${a.name} (${a.category})`)
      .join('\n');

    return `STATO DELLA REDAZIONE (aggiornato a ${new Date().toLocaleDateString('it-IT')}):
- Articoli totali: ${total} (pending: ${byStatus('pending_approval')}, approvati: ${byStatus('approved')}, pubblicati: ${byStatus('published')})
- Agenti attivi:
${agentLines || ' (nessuno)'}
- Articoli degli ultimi 7 giorni (piu' recenti prima):
${recentLines || ' (nessuno)'}`;
  } catch {
    return 'STATO DELLA REDAZIONE: (non disponibile)';
  }
}

function parseDraft(reply: string): CopilotDraft | null {
  // Il blocco puo' arrivare come ```BOZZA_JSON ... ``` o ```json ... ```
  const blockMatch = reply.match(/```(?:BOZZA_)?JSON\s*([\s\S]*?)```/i);
  let raw = blockMatch?.[1];
  if (!raw) {
    // Fallback: oggetto JSON con "title" e "content" nel testo
    if (!/"title"\s*:/.test(reply)) return null;
    raw = extractJSON(reply);
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.title && parsed?.content) {
      return {
        title: String(parsed.title).slice(0, 220),
        subtitle: String(parsed.subtitle || '').slice(0, 300),
        summary: String(parsed.summary || '').slice(0, 500),
        content: String(parsed.content),
        category: String(parsed.category || 'Tecnologia'),
      };
    }
  } catch {
    return null;
  }
  return null;
}

const VALID_CATEGORIES = [
  'Tecnologia', 'Politica', 'Economia', 'Scienza', 'Sport', 'Cultura', 'Salute',
];

export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return Response.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const messages: ChatTurn[] = Array.isArray(body?.messages) ? body.messages : [];
    if (messages.length === 0) {
      return Response.json({ error: 'Nessun messaggio' }, { status: 400 });
    }
    // Sanitize: solo ultimi 12 turni, max 4000 caratteri l'uno
    const safeMessages = messages
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.length < 10) {
      return Response.json({ error: 'Motore AI non configurato (OPENROUTER_API_KEY)' }, { status: 503 });
    }

    const context = await buildRedazioneContext();

    const systemPrompt = `Sei "Nexus Copilot", l'assistente AI della redazione del giornale online Nexus News AI. Stai parlando con un membro dello staff (${session.role}: ${session.name}).

${context}

IL TUO COMPITO:
- Aiuti lo staff a decidere cosa coprire, analizzare le performance, generare titoli e scrivere BOZZE DI ARTICOLI completi.
- Le bozze devono essere in ITALIANO, stile giornalistico professionale, 350-600 parole, paragraph separati da \\n\\n, con titolo d'impatto e sottotitolo.
- Le categorie valide sono: ${VALID_CATEGORIES.join(', ')}.

QUANDO LO STAFF CHIEDE UNA BOZZA (es. "scrivi una bozza su..."):
1. Scrivi una breve nota introduttiva (2-3 frasi) su come hai impostato la bozza.
2. POI aggiungi un blocco di codice con il formato BOZZA_JSON, esattamente cosi':

\`\`\`BOZZA_JSON
{
  "title": "Titolo dell'articolo",
  "subtitle": "Sottotitolo ( OGGETTO: frase di 1 riga )",
  "summary": "Riassunto in 2 frasi per le card",
  "content": "Testo completo con paragrafi separati da \\n\\n",
  "category": "una delle categorie valide"
}
\`\`\`

REGOLE:
- NON scrivere il blocco BOZZA_JSON se non ti viene chiesta una bozza.
- Rispondi sempre in ITALIANO, conciso e operativo (sei uno strumento di lavoro).
- Se chiedono analisi, usa i dati reali del contesto (titoli, letture, qualita').`;

    const { chatWithFallback } = await import('@/lib/openrouter');
    const result = await chatWithFallback(
      [{ role: 'system', content: systemPrompt }, ...safeMessages],
      'copilot',
      apiKey
    );

    if (!result.success || !result.response) {
      console.error('/api/copilot all models failed:', result.errors);
      return Response.json(
        { error: 'Il motore AI non risponde al momento, riprova tra poco.' },
        { status: 502 }
      );
    }

    const raw = result.response.content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    // La nota e' la risposta senza il blocco BOZZA_JSON
    const note = raw.replace(/```(?:BOZZA_)?JSON[\s\S]*?```/gi, '').trim();
    const draft = parseDraft(raw);

    if (draft && !VALID_CATEGORIES.includes(draft.category)) {
      draft.category = 'Tecnologia';
    }

    return Response.json({ note, draft, model: result.response.model });
  } catch (err) {
    console.error('POST /api/copilot error:', err);
    return Response.json({ error: 'Errore del Copilot' }, { status: 500 });
  }
}
