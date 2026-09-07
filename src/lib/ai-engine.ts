// AI Engine - Real AI news pipeline: RSS real sources + OpenRouter rewriting (NO mocks)

import { chatWithFallback, extractJSON, type Phase } from './openrouter';
import { fetchRssItems, type RssItem } from './rss';

// ============================================
// PROMPTS
// ============================================

function getCollectPrompt(
  category: string,
  agentPersonality: string,
  rssItems: RssItem[],
  sourceName: string
): string {
  const list = rssItems
    .map((it, i) => `${i + 1}. Titolo: ${it.title}\n   Estratto: ${it.description.slice(0, 220)}\n   Link: ${it.link}`)
    .join('\n');

  return `Sei un assistente editoriale specializzato in notizie di categoria "${category}".
Ti fornisco le notizie REALI di oggi raccolte dall'agente da ${sourceName}:

${list}

Personalità del giornalista: ${agentPersonality}

Il tuo compito: scegli le 2 notizie PIÙ INTERESSANTI e RILEVANTI per la categoria "${category}" e restituiscile come candidati per articoli.

IMPORTANTE: Devi restituire SOLO un array JSON valido con questa struttura esatta:
[
  {
    "title": "Titolo della notizia originale",
    "summary": "Riassunto di 2-3 frasi con i fatti principali della notizia",
    "score": 85,
    "sourceName": "${sourceName}",
    "sourceUrl": "URL della notizia originale"
  }
]

Requisiti:
- Usa SOLO le notizie fornite sopra (non inventare notizie)
- Riporta i fatti reali con i dettagli presenti negli estratti
- I title e summary possono essere leggermente riformulati in stile giornalistico
- "score" = punteggio di rilevanza editoriale da 0 a 100 per la categoria (escludi le notizie banali: seleziona solo punteggi >= 50)
- Se meno di 2 notizie sono rilevanti, restituisci solo quelle valide
- NON includere commenti o testo fuori dal JSON`;
}

// Evergreen fallback: RSS unreachable -> editorial analysis (no false real-time claims)
function getEvergreenPrompt(category: string, agentPersonality: string): string {
  return `Sei un assistente editoriale specializzato in ${category}.
Il tuo compito è proporre 1 analisi editoriale ORIGINALE su un tema di grande attualità e interesse per "${category}" (un approfondimento di sfondo, non una notizia di ultim'ora).

Personalità del giornalista: ${agentPersonality}

IMPORTANTE: Devi restituire SOLO un array JSON valido con questa struttura esatta:
[
  {
    "title": "Titolo dell'analisi",
    "summary": "Riassunto di 2-3 frasi",
    "sourceName": "Nexus News AI - Analisi editoriale",
    "sourceUrl": "https://nexus-news-ai.pages.dev"
  }
]

NON includere commenti o testo fuori dal JSON`;
}

function getEvaluatePrompt(article: { title: string; summary: string; content?: string }, category: string): string {
  return `Sei un editor capo di una redazione giornalistica specializzata in ${category}.
Valuta questo articolo su una scala da 0 a 100.

Titolo: ${article.title}
Riassunto: ${article.summary}
Contenuto: ${(article.content || article.summary || '').slice(0, 1500)}

Criteri di valutazione:
- Rilevanza per la categoria (30%)
- Qualità e profondità del contenuto (25%)
- Originalità e novità (20%)
- Presenza di dati concreti e fonti (15%)
- Qualità della scrittura (10%)

Restituisci SOLO un numero intero da 0 a 100, nient'altro.`;
}

function getRewritePrompt(
  article: { title: string; summary: string; content?: string },
  category: string,
  agentName: string,
  agentPersonality: string
): string {
  const styles: Record<string, string> = {
    Tecnologia: 'analitico e orientato all\'impatto pratico per lettori tech-savvy',
    Politica: 'equilibrato e oggettivo con contesto storico e geopolitico',
    Economia: 'rigoroso ma accessibile con dati concreti e implicazioni per investitori',
    Scienza: 'divulgativo ma preciso, con spiegazioni chiare per un pubblico colto',
    Sport: 'emozionante e narrativo con statistiche e analisi tattiche',
    Cultura: 'elegante e riflessivo con riferimenti storici e artistici',
    Salute: 'rassicurante e basato su evidenze scientifiche con consigli pratici',
  };
  const style = styles[category] || 'professionale e oggettivo';

  return `Sei ${agentName}, un giornalista AI con personalità: "${agentPersonality}".
Il tuo stile editoriale è ${style}.

Scrivi un articolo ORIGINALE per la rivista Nexus News AI basato su questa notizia reale, riportandone i fatti e arricchendolo con contesto, analisi e implicazioni.

Notizia di partenza:
- Titolo: ${article.title}
- Fatti principali: ${article.summary}
- Estratto: ${(article.content || '').slice(0, 800)}

Restituisci SOLO un JSON con questa struttura esatta:
{
  "title": "Nuovo titolo creativo e accattivante",
  "subtitle": "Sottotitolo di 1 frase che cattura l'essenza",
  "content": "Articolo completo, minimo 400 parole, con intro editoriale, corpo dettagliato e conclusione",
  "summary": "Riassunto di 2-3 frasi"
}

NON includere markdown, commenti o testo fuori dal JSON.`;
}

// ============================================
// JSON REPAIR (models often return broken/truncated JSON)
// ============================================

export function repairParse(text: string): unknown | null {
  const jsonStr = extractJSON(text);

  // 1. Direct parse
  try { return JSON.parse(jsonStr); } catch { /* continue */ }

  let s = jsonStr;

  // 2. Remove trailing commas
  const noTrailing = s.replace(/,\s*([\]}])/g, '$1');
  try { return JSON.parse(noTrailing); } catch { /* continue */ }

  // 3. Escape raw control characters (newlines/tabs) inside JSON strings
  let out = '';
  let inStr = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (ch === '\\') { out += ch + (s[i + 1] ?? ''); i++; continue; }
      if (ch === '"') { inStr = false; out += ch; continue; }
      if (ch === '\n') { out += '\\n'; continue; }
      if (ch === '\r') { continue; }
      if (ch === '\t') { out += '\\t'; continue; }
      out += ch;
    } else {
      if (ch === '"') inStr = true;
      out += ch;
    }
  }
  try { return JSON.parse(out); } catch { /* continue */ }

  // 3b. Same but also strip trailing commas after escaping
  try { return JSON.parse(out.replace(/,\s*([\]}])/g, '$1')); } catch { /* continue */ }

  // 4. Truncated array: keep only complete objects, close the array
  if (s.trim().startsWith('[')) {
    const lastObj = s.lastIndexOf('}');
    if (lastObj > 0) {
      const candidate = s.slice(0, lastObj + 1) + ']';
      try { return JSON.parse(candidate); } catch { /* continue */ }
      try { return JSON.parse(candidate.replace(/,\s*([\]}])/g, '$1')); } catch { /* continue */ }
    }
  }

  // 5. Truncated single object
  const firstObj = s.indexOf('{');
  const lastObj = s.lastIndexOf('}');
  if (firstObj !== -1 && lastObj > firstObj) {
    try { return JSON.parse(s.slice(firstObj, lastObj + 1)); } catch { /* continue */ }
  }

  return null;
}

// ============================================
// MAIN PIPELINE
// ============================================

interface CollectedArticle {
  title: string;
  summary: string;
  content?: string;
  sourceName: string;
  sourceUrl: string;
}

export interface ProcessedArticle {
  title: string;
  subtitle: string;
  content: string;
  summary: string;
  category: string;
  sourceName: string;
  sourceUrl: string;
  qualityScore: number;
  readTime: number;
  modelUsed: string;
}

export interface RealAIResult {
  success: boolean;
  collected: number;
  evaluated: number;
  rewritten: number;
  articles: ProcessedArticle[];
  modelsUsed: { phase: Phase; model: string }[];
  errors: string[];
}

export async function processWithAI(
  category: string,
  agentName: string,
  agentPersonality: string,
  apiKey: string
): Promise<RealAIResult> {
  const errors: string[] = [];
  const modelsUsed: { phase: Phase; model: string }[] = [];

  // ---- PHASE 0: RSS COLLECTION (real news from real sources) ----
  const rss = await fetchRssItems(category);
  if (rss.items.length === 0) {
    errors.push(`RSS non disponibili: ${rss.errors.join('; ')}`);
  }

  // ---- PHASE 1: COLLECT (select the best candidates) ----
  const collectPrompt = rss.items.length > 0
    ? getCollectPrompt(category, agentPersonality, rss.items, rss.sourceName)
    : getEvergreenPrompt(category, agentPersonality);

  const collectResult = await chatWithFallback(
    [{ role: 'user', content: collectPrompt }],
    'collect',
    apiKey
  );

  if (!collectResult.success || !collectResult.response) {
    throw new Error(
      `Impossibile raccogliere notizie: tutti i modelli hanno fallito.\n` +
      collectResult.errors.map(e => `- ${e.model}: ${e.error}`).join('\n')
    );
  }

  modelsUsed.push({ phase: 'collect', model: collectResult.response.model });

  let collected: CollectedArticle[];
  const parsedCollect = repairParse(collectResult.response.content);
  if (parsedCollect === null) {
    const snippet = collectResult.response.content.replace(/\s+/g, ' ').slice(0, 220);
    throw new Error(
      'Impossibile parsare la risposta Collect dal modello ' + collectResult.response.model +
      '. Risposta: "' + snippet + '..."'
    );
  }
  collected = Array.isArray(parsedCollect) ? (parsedCollect as CollectedArticle[]) : [parsedCollect as CollectedArticle];
  // Enrich with RSS content (real facts) for the rewrite phase + normalize scores
  for (const c of collected) {
    if (!c.content) {
      const match = rss.items.find(r => r.title === c.title || r.link === c.sourceUrl);
      c.content = match ? match.description : '';
    }
  }

  // ---- PHASE 2: SCORE (from collect response, no extra LLM call) ----
  const evaluated = collected
    .map((article) => {
      const raw = (article as CollectedArticle & { score?: number }).score;
      const score = typeof raw === 'number' && !isNaN(raw) ? Math.min(Math.max(Math.round(raw), 0), 100) : 70;
      return { article, score };
    })
    .filter((e) => e.score >= 50);

  // ---- PHASE 3: REWRITE (parallel) ----
  const rewriteResults = await Promise.all(
    evaluated.map(async ({ article, score }): Promise<ProcessedArticle> => {
      const rewriteResult = await chatWithFallback(
        [{ role: 'user', content: getRewritePrompt(article, category, agentName, agentPersonality) }],
        'rewrite',
        apiKey
      );

      const fallbackReadTime = Math.max(2, Math.ceil((article.content || article.summary || 'x').split(/\s+/).length / 200));

      if (rewriteResult.success && rewriteResult.response) {
        modelsUsed.push({ phase: 'rewrite', model: rewriteResult.response.model });
        const parsedRewrite = repairParse(rewriteResult.response.content) as Record<string, string> | null;
        if (parsedRewrite) {
          const rewritten = parsedRewrite;
          const readTime = Math.max(2, Math.ceil((rewritten.content || '').split(/\s+/).length / 200));
          return {
            title: rewritten.title || article.title,
            subtitle: rewritten.subtitle || '',
            content: rewritten.content || article.content || article.summary,
            summary: rewritten.summary || article.summary,
            category,
            sourceName: article.sourceName,
            sourceUrl: article.sourceUrl,
            qualityScore: score,
            readTime,
            modelUsed: rewriteResult.response.model,
          };
        }
        errors.push(`Rewrite parse fallito per "${article.title.slice(0, 40)}"`);
        return {
          title: article.title,
          subtitle: '',
          content: article.content || article.summary,
          summary: article.summary,
          category,
          sourceName: article.sourceName,
          sourceUrl: article.sourceUrl,
          qualityScore: score,
          readTime: fallbackReadTime,
          modelUsed: rewriteResult.response.model + ' (raw)',
        };
      }

      errors.push(`Rewrite fallito per "${article.title.slice(0, 40)}"`);
      return {
        title: article.title,
        subtitle: '',
        content: article.content || article.summary,
        summary: article.summary,
        category,
        sourceName: article.sourceName,
        sourceUrl: article.sourceUrl,
        qualityScore: score,
        readTime: fallbackReadTime,
        modelUsed: 'rewrite-failed',
      };
    })
  );

  const finalArticles: ProcessedArticle[] = rewriteResults;

  return {
    success: true,
    collected: collected.length,
    evaluated: evaluated.length,
    rewritten: finalArticles.length,
    articles: finalArticles,
    modelsUsed,
    errors,
  };
}
