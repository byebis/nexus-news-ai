// AI Engine - Real AI news pipeline via OpenRouter (NO mocks)

import { chatWithFallback, extractJSON, type Phase } from './openrouter';

// ============================================
// PROMPTS
// ============================================

function getCollectPrompt(category: string, agentPersonality: string): string {
  return `Sei un assistente editoriale specializzato in notizie di categoria "${category}".
Il tuo compito è trovare 2-3 notizie vere e recenti (ultimi 7 giorni) in questa categoria.

Personalità del giornalista: ${agentPersonality}

IMPORTANTE: Devi restituire SOLO un array JSON valido con questa struttura esatta:
[
  {
    "title": "Titolo della notizia",
    "summary": "Riassunto di 1-2 frasi",
    "content": "Testo completo dell'articolo di almeno 300 parole, con dettagli, contesto e implicazioni",
    "sourceName": "Nome della fonte",
    "sourceUrl": "URL della fonte originale"
  }
]

Requisiti:
- Le notizie devono essere REALI e attuali
- Il contenuto deve essere dettagliato (minimo 300 parole per articolo)
- Includi dati specifici, nomi, cifre dove possibile
- Varia le fonti e le prospettive
- NON includere commenti o testo fuori dal JSON`;
}

function getEvaluatePrompt(article: { title: string; summary: string; content: string }, category: string): string {
  return `Sei un editor capo di una redazione giornalistica specializzata in ${category}.
Valuta questo articolo su una scala da 0 a 100.

Titolo: ${article.title}
Riassunto: ${article.summary}
Contenuto: ${article.content.slice(0, 1500)}

Criteri di valutazione:
- Rilevanza per la categoria (30%)
- Qualità e profondità del contenuto (25%)
- Originalità e novità (20%)
- Presenza di dati concreti e fonti (15%)
- Qualità della scrittura (10%)

Restituisci SOLO un numero intero da 0 a 100, nient'altro.`;
}

function getRewritePrompt(
  article: { title: string; summary: string; content: string },
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

Riscrivi il seguente articolo per la rivista Nexus News AI, mantenendo tutti i fatti ma adattando il tono e lo stile.

Titolo originale: ${article.title}
Contenuto originale: ${article.content}

Restituisci SOLO un JSON con questa struttura esatta:
{
  "title": "Nuovo titolo creativo e accattivante",
  "subtitle": "Sottotitolo di 1 frase che cattura l'essenza",
  "content": "Articolo riscritto completo, minimo 400 parole, con intro editoriale, corpo dettagliato e conclusione",
  "summary": "Riassunto di 2-3 frasi"
}

NON includere markdown, commenti o testo fuori dal JSON.`;
}

// ============================================
// MAIN PIPELINE
// ============================================

interface CollectedArticle {
  title: string;
  summary: string;
  content: string;
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

  // ---- PHASE 1: COLLECT ----
  const collectResult = await chatWithFallback(
    [{ role: 'user', content: getCollectPrompt(category, agentPersonality) }],
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
  try {
    const jsonStr = extractJSON(collectResult.response.content);
    collected = JSON.parse(jsonStr);
    if (!Array.isArray(collected)) collected = [collected];
  } catch {
    throw new Error('Impossibile parsare la risposta Collect dal modello ' + collectResult.response.model);
  }

  // ---- PHASE 2: EVALUATE ----
  const evaluated: Array<{ article: CollectedArticle; score: number }> = [];

  for (const article of collected) {
    const evalResult = await chatWithFallback(
      [{ role: 'user', content: getEvaluatePrompt(article, category) }],
      'evaluate',
      apiKey
    );

    if (evalResult.success && evalResult.response) {
      modelsUsed.push({ phase: 'evaluate', model: evalResult.response.model });
      const scoreText = evalResult.response.content.trim();
      const score = parseInt(scoreText, 10);
      evaluated.push({
        article,
        score: isNaN(score) ? 70 : Math.min(Math.max(score, 0), 100),
      });
    } else {
      errors.push(`Evaluate fallito per "${article.title.slice(0, 40)}": ${evalResult.errors.map(e => e.error).join(', ')}`);
      evaluated.push({ article, score: 70 });
    }
  }

  const passing = evaluated.filter(e => e.score >= 50);

  // ---- PHASE 3: REWRITE ----
  const finalArticles: ProcessedArticle[] = [];

  for (const { article, score } of passing) {
    const rewriteResult = await chatWithFallback(
      [{ role: 'user', content: getRewritePrompt(article, category, agentName, agentPersonality) }],
      'rewrite',
      apiKey
    );

    if (rewriteResult.success && rewriteResult.response) {
      modelsUsed.push({ phase: 'rewrite', model: rewriteResult.response.model });
      try {
        const jsonStr = extractJSON(rewriteResult.response.content);
        const rewritten = JSON.parse(jsonStr);
        const readTime = Math.max(2, Math.ceil((rewritten.content || '').split(/\s+/).length / 200));
        finalArticles.push({
          title: rewritten.title || article.title,
          subtitle: rewritten.subtitle || '',
          content: rewritten.content || article.content,
          summary: rewritten.summary || article.summary,
          category,
          sourceName: article.sourceName,
          sourceUrl: article.sourceUrl,
          qualityScore: score,
          readTime,
          modelUsed: rewriteResult.response.model,
        });
      } catch {
        errors.push(`Rewrite parse fallito per "${article.title.slice(0, 40)}"`);
        finalArticles.push({
          title: article.title,
          subtitle: '',
          content: article.content,
          summary: article.summary,
          category,
          sourceName: article.sourceName,
          sourceUrl: article.sourceUrl,
          qualityScore: score,
          readTime: Math.max(2, Math.ceil(article.content.split(/\s+/).length / 200)),
          modelUsed: rewriteResult.response.model + ' (raw)',
        });
      }
    } else {
      errors.push(`Rewrite fallito per "${article.title.slice(0, 40)}"`);
      finalArticles.push({
        title: article.title,
        subtitle: '',
        content: article.content,
        summary: article.summary,
        category,
        sourceName: article.sourceName,
        sourceUrl: article.sourceUrl,
        qualityScore: score,
        readTime: Math.max(2, Math.ceil(article.content.split(/\s+/).length / 200)),
        modelUsed: 'rewrite-failed',
      });
    }
  }

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
