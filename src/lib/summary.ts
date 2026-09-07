// ============================================
// Extractive summary distiller — zero-cost, zero-dependency
// Used as fallback when an article has no AI-generated summary:
// scores sentences by keyword frequency + position and returns
// the 2-3 most representative ones, in original order.
// Works for Italian and English content.
// ============================================

const STOPWORDS_IT = `il lo la i gli le un uno una di a da in con su per tra fra e o ma dunque cioe però pero mentre come dove quando perché perche se anche ancora già gia sempre mai molto più piu poco meno tutto tutti questa questo questi queste quello quella sono è e essere stato stata stati state ha hanno avere aveva avevano fatto fare dice detto secondo dopo prima durante oltre tra fra nel della delle dei degli dal dalla dai dagli al allo alla ai agli ad ed nel nell sul sulla più piu meno meno suo sua loro nostro vostro altro altri stessa stessi via verso senza entro quindi inoltre infatti ben mal molto tanta tante tanti tanto oggi ieri domani anno anni mese mesi giorno giorni settimana settimane new york city`.split(/\s+/);

const STOPWORDS_EN = `the a an and or but of to in on for with by at from as is are was were be been being this that these those it its their his her our your my not no yes if then than so such can could will would should may might must have has had do does did about into over under after before during between more most less least very much many few also just only even still ever never always often here there when where why how what who whom which whose all any some each other another both few own same too s t don now new york city said says according`.split(/\s+/);

const STOP = new Set([...STOPWORDS_IT, ...STOPWORDS_EN].map((w) => w.toLowerCase()));

/** Strip markdown, HTML and URLs — plain text safe for display and TTS */
export function plainSpokenText(raw: string): string {
  return (raw || '')
    .replace(/<[^>]+>/g, ' ')                      // html tags
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')       // [text](url) -> text
    .replace(/https?:\/\/\S+/g, '')                // bare urls
    .replace(/[#*_>`~|]/g, ' ')                    // markdown symbols
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text: string): string[] {
  const clean = plainSpokenText(text);
  if (!clean) return [];
  const parts = clean.match(/[^.!?]+[.!?]+["”']?|[^.!?]+$/g) || [clean];
  return parts.map((s) => s.trim()).filter((s) => s.length > 0);
}

function tokenize(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[^a-zàèéìòùáéíóúñü\s']/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

/**
 * Distill a summary from raw article content.
 * Returns 2-3 key sentences (max ~340 chars), '' if content too short to be worth it.
 */
export function distillSummary(content: string, maxSentences = 3, maxChars = 340): string {
  const clean = plainSpokenText(content);
  if (clean.length < 220) return clean; // too short: the body IS the summary

  const sentences = splitSentences(clean).filter((s) => s.length >= 30);
  if (sentences.length <= maxSentences) return clean.slice(0, maxChars + 60);

  // Word frequency table
  const freq = new Map<string, number>();
  for (const s of sentences) {
    for (const w of tokenize(s)) freq.set(w, (freq.get(w) || 0) + 1);
  }

  // Score sentences: keyword density + position bonus (leads matter in news)
  const scored = sentences.map((s, i) => {
    const tokens = tokenize(s);
    if (tokens.length === 0) return { i, s, score: 0 };
    const density = tokens.reduce((acc, w) => acc + (freq.get(w) || 0), 0) / Math.sqrt(tokens.length);
    const positionBonus = i === 0 ? 0.9 : i === 1 ? 0.5 : i === 2 ? 0.25 : 0;
    const lengthPenalty = s.length > 300 ? 0.35 : 0;
    return { i, s, score: density + positionBonus - lengthPenalty };
  });

  const top = scored
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.i - b.i);

  let out = '';
  for (const { s } of top) {
    if ((out + ' ' + s).trim().length > maxChars && out) break;
    out = (out + ' ' + s).trim();
  }
  return out || clean.slice(0, maxChars);
}

/** Best available summary: AI summary if present, else extractive distillation */
export function bestSummary(article: { summary?: string | null; content?: string | null }): string {
  const ai = plainSpokenText(article.summary || '');
  if (ai.length >= 40) return ai;
  return distillSummary(article.content || '');
}
