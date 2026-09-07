import { supabase } from '@/lib/supabase';

export const maxDuration = 60;

/**
 * POST /api/ask — "Chiedi a Nexus" (pubblico)
 * Body: { question: string, lang?: 'it' | 'en' }
 *
 * RAG pipeline a costo zero:
 *  1. estrazione parole chiave dalla domanda (stopword IT/EN filtrate)
 *  2. ricerca full-text sugli articoli PUBLISHED (title/summary/content ilike)
 *  3. contesto numerato [1..n] per l'LLM
 *  4. risposta con citazioni [1], [2]... + lista fonti ritornata al client
 */

interface SourceArticle {
  id: string;
  title: string;
  category: string;
  date: string | null;
  summary: string;
  contentSlice: string;
}

const STOPWORDS = new Set([
  // IT
  'come','cosa','quale','quali','quando','dove','perche','perché','chi','che','cosa','sono','essere','stato','stata','stati','state','ha','hanno','aveva','hanno','nel','nella','nello','negli','sulla','sullo','sulle','della','delle','dallo','dalla','dagli','dalla','per','con','tra','fra','una','uno','gli','del','dalla','questa','questo','questi','queste','si','non','piu','più','anche','molto','trovo','sapere','informazioni','dimmi','parlami','spiega','spiegami','esiste','ultime','notizie','articoli','giornale','nexus',
  // EN
  'the','and','for','with','what','when','where','why','who','which','how','does','did','are','was','were','has','have','had','from','that','this','these','those','there','their','about','into','over','after','before','between','tell','give','show','explain','find','any','some','about','news','articles','paper','nexus','latest','more',
]);

function extractKeywords(question: string): string[] {
  const words = question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
  // dedup + max 4 keyword
  return [...new Set(words)].slice(0, 4);
}

async function retrieveArticles(question: string): Promise<{ sources: SourceArticle[]; usedKeywords: string[] }> {
  const keywords = extractKeywords(question);

  const buildOr = (words: string[]) =>
    words
      .flatMap((w) => [
        `title.ilike.*${w}*`,
        `summary.ilike.*${w}*`,
        `content.ilike.*${w}*`,
      ])
      .join(',');

  let rows: any[] | null = null;

  if (keywords.length > 0) {
    const { data } = await supabase
      .from('articles')
      .select('id, title, category, published_at, created_at, summary, content')
      .eq('status', 'published')
      .or(buildOr(keywords))
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(8);
    rows = data;
  }

  // Fallback: intera domanda come frase
  if (!rows || rows.length === 0) {
    const safe = question.replace(/[(),*%]/g, ' ').trim();
    if (safe) {
      const pattern = `*${safe}*`;
      const { data } = await supabase
        .from('articles')
        .select('id, title, category, published_at, created_at, summary, content')
        .eq('status', 'published')
        .or(`title.ilike.${pattern},summary.ilike.${pattern},content.ilike.${pattern}`)
        .order('created_at', { ascending: false })
        .limit(8);
      rows = data;
    }
  }

  const sources: SourceArticle[] = (rows || []).map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    date: r.published_at || r.created_at,
    summary: r.summary || '',
    contentSlice: (r.content || '').slice(0, 900),
  }));

  return { sources, usedKeywords: keywords };
}

function buildContext(sources: SourceArticle[]): string {
  return sources
    .map((s, i) => {
      const date = s.date ? new Date(s.date).toLocaleDateString('it-IT') : 'data n/d';
      return `[${i + 1}] TITOLO: ${s.title}\n    CATEGORIA: ${s.category} | DATA: ${date}\n    RIASSUNTO: ${s.summary}\n    CONTENUTO: ${s.contentSlice}`;
    })
    .join('\n\n---\n\n');
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const question = String(body?.question ?? '').trim().slice(0, 500);
    const lang = body?.lang === 'en' ? 'en' : 'it';

    if (question.length < 3) {
      return Response.json({ error: 'Domanda troppo corta' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.length < 10) {
      return Response.json(
        { error: 'Motore AI non configurato (OPENROUTER_API_KEY)' },
        { status: 503 }
      );
    }

    const { sources, usedKeywords } = await retrieveArticles(question);

    if (sources.length === 0) {
      return Response.json({
        answer:
          lang === 'en'
            ? "I couldn't find published articles matching your question. Try rephrasing it or browse the categories — our AI newsroom publishes every day."
            : 'Non ho trovato articoli pubblicati che corrispondano alla tua domanda. Prova a riformularla o sfoglia le categorie: la nostra redazione AI pubblica ogni giorno.',
        sources: [],
        model: null,
      });
    }

    const context = buildContext(sources);
    const langRule =
      lang === 'en'
        ? 'Answer in ENGLISH.'
        : 'Rispondi in ITALIANO.';

    const systemPrompt = `Sei "Nexus", l'intelligenza artificiale del giornale online Nexus News AI, scritto da agenti giornalisti AI.
Il tuo compito: rispondere alle domande dei lettori basandoti ESCLUSIVAMENTE sugli articoli del giornale forniti come CONTESTO.

REGOLE:
1. Usa SOLO le informazioni presenti nel contesto. Non inventare fatti, numeri o nomi.
2. Cita le fonti con la notazione [1], [2]... riferita ai numeri degli articoli nel contesto.
3. ${langRule}
4. Tono giornalistico, chiaro e diretto. Massimo ~220 parole. Non usare markdown pesante: testo fluido con al massimo qualche punto elenco "- ".
5. Se il contesto non basta per rispondere, dillo onestamente e suggeri una domanda più pertinente agli articoli disponibili.
6. Non menzionare mai "il contesto", "il prompt" o "gli articoli forniti": parla come giornalista del giornale ("come riportato da...", "secondo la nostra redazione...").`;

    const userPrompt = `CONTESTO (articoli di Nexus News AI):

${context}

DOMANDA DEL LETTORE: "${question}"

Rispondi ora, rispettando le regole.`;

    const { chatWithFallback } = await import('@/lib/openrouter');
    const result = await chatWithFallback(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      'ask',
      apiKey
    );

    if (!result.success || !result.response) {
      console.error('/api/ask all models failed:', result.errors);
      return Response.json(
        { error: 'Il motore AI non risponde al momento, riprova tra poco.' },
        { status: 502 }
      );
    }

    // Pulizia dei think-block residue
    const clean = result.response.content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    return Response.json({
      answer: clean,
      sources: sources.map((s, i) => ({
        n: i + 1,
        id: s.id,
        title: s.title,
        category: s.category,
        date: s.date,
      })),
      model: result.response.model,
      keywords: usedKeywords,
    });
  } catch (err) {
    console.error('POST /api/ask error:', err);
    return Response.json({ error: 'Errore durante la risposta AI' }, { status: 500 });
  }
}
