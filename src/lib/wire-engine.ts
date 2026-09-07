// ============================================
// Nexus Wire — Redazione Collettiva (Level 12)
// Pipeline multi-agente "alza l'asticella":
//   1. RACCOLTA: il sistema porta in redazione candidati da RSS + archivio
//   2. SELEZIONE: l'LLM sceglie le 3-5 fonti più rilevanti per l'argomento
//   3. RICERCATORE: un agente legge tutte le fonti e prepara il dossier
//   4. REDATTORE: un altro agente scrive la bozza dal dossier
//   5. REVISORI (x2, in parallelo): due agenti criticano e punteggiano
//   6. EDITOR: fonde bozza + revisioni nell'articolo definitivo
//   7. SALVATAGGIO: articolo in coda di approvazione + commenti in bacheca
// ============================================

import { supabase, generateId } from '@/lib/supabase';
import { chatWithFallback, extractJSON } from '@/lib/openrouter';
import { repairParse } from '@/lib/ai-engine';
import { fetchRssItems } from '@/lib/rss';
import type { WireRunData, WireSource, WireStep } from '@/lib/wire-store';

const VALID_CATEGORIES = ['Tecnologia', 'Politica', 'Economia', 'Scienza', 'Sport', 'Cultura', 'Salute'];

interface AgentRow {
  id: string;
  name: string;
  category: string;
  personality: string;
}

interface SourceCandidate {
  title: string;
  source: string;
  url: string;
  content: string;
}

function clip(text: string | undefined | null, n: number): string {
  return (text || '').replace(/\s+/g, ' ').trim().slice(0, n);
}

function parseJSONLoose(raw: string): unknown {
  // repairParse gestisce trailing commas, newline nei JSON string, ecc. (stesso engine del collect)
  const repaired = repairParse(raw);
  if (repaired !== null && repaired !== undefined) return repaired;
  try {
    return JSON.parse(extractJSON(raw));
  } catch {
    return null;
  }
}

interface FallbackResult {
  success: boolean;
  response?: { content: string; model: string };
}

/**
 * LLM call → JSON parse → validate → one retry with a strict reminder.
 * Returns { data, model } or null if unrecoverable.
 */
async function callWireJSON<T>(
  prompt: string,
  validate: (x: unknown) => x is T,
  apiKey: string
): Promise<{ data: T; model: string } | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const finalPrompt =
      attempt === 0
        ? prompt
        : `${prompt}\n\nIMPORTANTE: la risposta precedente non era JSON valido. Rispondi con UN SOLO oggetto JSON valido, senza testo prima o dopo, iniziando direttamente con {`;
    const res: FallbackResult = await chatWithFallback([{ role: 'user', content: finalPrompt }], 'wire', apiKey);
    if (res.success && res.response) {
      const parsed = parseJSONLoose(res.response.content);
      if (parsed && validate(parsed)) return { data: parsed, model: res.response.model };
    }
  }
  return null;
}

/** Fetch a wide pool of external candidates (RSS all-categories, in parallel) + archive articles */
async function gatherCandidates(topic: string): Promise<SourceCandidate[]> {
  const cats = VALID_CATEGORIES;
  const rssResults = await Promise.allSettled(cats.map((c) => fetchRssItems(c)));
  const pool: SourceCandidate[] = [];
  const seen = new Set<string>();
  for (const res of rssResults) {
    if (res.status !== 'fulfilled') continue;
    for (const it of res.value.items || []) {
      const url = it.link || '';
      const key = url || it.title;
      if (!it.title || seen.has(key)) continue;
      seen.add(key);
      pool.push({
        title: clip(it.title, 160),
        source: res.value.sourceName || 'RSS',
        url,
        content: clip(it.description, 900),
      });
    }
  }

  // Archive: our published articles are also readable sources
  const { data: archive } = await supabase
    .from('articles')
    .select('title, summary, content, source_name, source_url, category')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(12);
  for (const a of archive || []) {
    const key = a.source_url || a.title;
    if (seen.has(key)) continue;
    seen.add(key);
    pool.push({
      title: clip(a.title, 160),
      source: a.source_name || 'Archivio Nexus',
      url: a.source_url || '',
      content: clip(a.summary && a.summary.length > a.content.length ? a.summary : a.content, 900),
    });
  }

  // Pre-filter cheap: keep candidates sharing at least one significant word with the topic,
  // but keep a fallback slice of the freshest ones anyway (the LLM can judge relevance better)
  const words = topic
    .toLowerCase()
    .split(/[\s,;:.!?]+/)
    .filter((w) => w.length >= 4);
  const matching = pool.filter((c) => {
    const hay = (c.title + ' ' + c.content).toLowerCase();
    return words.some((w) => hay.includes(w));
  });
  const rest = pool.filter((c) => !matching.includes(c));
  return [...matching, ...rest].slice(0, 26);
}

function sourceBlock(sources: { title: string; source: string; url: string; content: string }[]): string {
  return sources
    .map((s, i) => `[FONTE ${i + 1}] ${s.title} (${s.source})\n${s.content}`)
    .join('\n\n');
}

/** Assign newsroom roles to available agents */
function assignRoles(agents: AgentRow[], category: string) {
  const list = agents.filter((a) => a.status !== 'paused');
  const usable = list.length > 0 ? list : agents;
  const byCat = usable.find((a) => a.category === category);
  const taken: AgentRow[] = [];
  const pick = (prefer?: AgentRow | null): AgentRow => {
    if (prefer && !taken.includes(prefer)) {
      taken.push(prefer);
      return prefer;
    }
    const next = usable.find((a) => !taken.includes(a)) || usable[taken.length % usable.length];
    taken.push(next);
    return next;
  };
  const redattore = pick(byCat);
  const ricercatore = pick();
  const revisore1 = pick();
  const revisore2 = pick();
  const editor = pick();
  return { ricercatore, redattore, revisore1, revisore2, editor };
}

/** Robust extraction of source picks from a messy LLM reply */
function extractPicks(raw: string): number[] {
  const parsed = parseJSONLoose(raw) as
    | unknown[]
    | { sources?: unknown[]; selection?: unknown[]; picks?: unknown[] }
    | null;
  const arr = Array.isArray(parsed)
    ? parsed
    : parsed?.sources || parsed?.selection || parsed?.picks || [];
  if (Array.isArray(arr) && arr.length > 0) {
    const idx = arr
      .map((x) => {
        if (typeof x === 'number') return x;
        const anyX = x as { index?: unknown; id?: unknown };
        return parseInt(String(anyX?.index ?? anyX?.id ?? ''), 10);
      })
      .filter((n) => !isNaN(n));
    if (idx.length > 0) return idx;
  }
  // Regex fallback: pull every "index": N pair straight from the text
  return [...raw.matchAll(/"index"\s*:\s*"?(\d+)"?/g)].map((m) => parseInt(m[1], 10));
}

/** Keyword-based fallback selection (no LLM): overlap between topic words and candidate text */
function keywordPicks(topic: string, pool: SourceCandidate[]): number[] {
  const words = topic
    .toLowerCase()
    .split(/[\s,;:.!?]+/)
    .filter((w) => w.length >= 4);
  const scored = pool
    .map((c, i) => ({
      i,
      score: words.reduce(
        (acc, w) => acc + ((c.title + ' ' + c.content).toLowerCase().includes(w) ? 1 : 0),
        0
      ),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  return scored.map((s) => s.i);
}

export interface WireRunResult {
  runId: string;
  articleId: string;
  topic: string;
  category: string;
  sources: WireSource[];
  scores: number[];
  reviewScore: number;
  agents: { name: string; role: string }[];
  models: string[];
  title: string;
}

export async function runNexusWire(topic: string, apiKey: string): Promise<WireRunResult> {
  const cleanTopic = clip(topic, 120);
  const runId = generateId();
  const models: string[] = [];
  const steps: WireStep[] = [];
  const now = () => new Date().toISOString();

  // Agents
  const { data: agentsRaw, error: agentsErr } = await supabase
    .from('agents')
    .select('id, name, category, personality, status');
  if (agentsErr || !agentsRaw || agentsRaw.length === 0) {
    throw new Error('Nessun agente disponibile in redazione');
  }
  const agents = agentsRaw as unknown as AgentRow[];
  const anchorAgent = agents[0];

  const runData: WireRunData = {
    topic: cleanTopic,
    status: 'running',
    sources: [],
    steps,
    agentsInvolved: [],
  };

  try {
    // ---- PHASE 1+2: gather + select sources ----
    const pool = await gatherCandidates(cleanTopic);
    if (pool.length < 5) {
      throw new Error(`Troppi pochi candidati in redazione (${pool.length}). Riprova tra poco.`);
    }
    const selectedIdx = await (async () => {
      const list = pool
        .map((c, i) => `[${i}] (${c.source}) ${c.title} — ${clip(c.content, 150)}`)
        .join('\n');
      const prompt = `Sei il capo servizio della redazione di Nexus News AI.
ARGOMENTO DA COPRIRE: "${cleanTopic}"

Candidati raccolti dalle fonti e dall'archivio:
${list}

COMPITO: scegli i 3, 4 o 5 candidati PIÙ RILEVANTI e complementari per coprire l'argomento nel modo più completo (punti di vista diversi, dati diversi, niente duplicati).
Rispondi SOLO con JSON, nessun altro testo:
{"sources": [{"index": 0, "relevance": 85}, {"index": 4, "relevance": 78}]}`;
      const res = await chatWithFallback([{ role: 'user', content: prompt }], 'wire', apiKey);
      let idx: number[] = [];
      if (res.success && res.response) {
        models.push(res.response.model);
        idx = extractPicks(res.response.content);
        if (idx.length === 0) {
          console.warn('[Wire] selection parse empty, raw was:', res.response.content.replace(/\s+/g, ' ').slice(0, 250));
        }
      }
      // Fallback senza LLM: keyword matching sulla pool
      if (idx.length < 3) idx = keywordPicks(cleanTopic, pool);
      return [...new Set(idx)].filter((i) => pool[i] !== undefined).slice(0, 5);
    })();

    const sources: (WireSource & { content: string })[] = selectedIdx.map((idxNum) => {
      const c = pool[idxNum];
      return { title: c.title, source: c.source, url: c.url, content: c.content };
    });
    if (sources.length < 3) {
      throw new Error(
        `Trovate solo ${sources.length} fonti rilevanti per "${cleanTopic}" (servono almeno 3). Prova un argomento più ampio o di attualità.`
      );
    }
    runData.sources = sources.map(({ title, source, url }) => ({ title, source, url }));
    steps.push({
      agentName: 'Sistema',
      role: 'caposervizio',
      kind: 'research',
      summary: `Selezionate ${sources.length} fonti indipendenti sull'argomento.`,
      model: models[0],
      at: now(),
    });

    // Save running state
    const { insertWireRun } = await import('@/lib/wire-store');
    await insertWireRun(runId, runData, anchorAgent.id);

    // ---- PHASE 3: RICERCATORE ----
    const preRoles = assignRoles(agents, '');
    const ricercatore = preRoles.ricercatore;
    runData.agentsInvolved.push({ id: ricercatore.id, name: ricercatore.name, role: 'ricercatore' });

    const researchPrompt = `Sei ${ricercatore.name}, RICERCATORE della redazione di Nexus News AI. Personalità: ${ricercatore.personality}.
ARGOMENTO: "${cleanTopic}"
Hai letto ${sources.length} articoli diversi sullo stesso argomento:

${sourceBlock(sources)}

COMPITO: prepara il dossier di ricerca per i colleghi: fatti accertati confermati dalle fonti, numeri e dati concreti, le differenze tra le versioni delle fonti, gli angoli editoriali più interessanti.
Rispondi SOLO con JSON:
{"category": "una di: ${VALID_CATEGORIES.join(', ')}", "facts": ["..."], "numbers": ["..."], "differences": ["..."], "angles": ["..."]}`;

    const researchOut = await callWireJSON(
      researchPrompt,
      (x): x is { category?: string; facts?: string[]; numbers?: string[]; differences?: string[]; angles?: string[] } =>
        typeof x === 'object' && x !== null,
      apiKey
    );
    let dossier = researchOut?.data || null;
    if (!dossier) {
      // Fallback garantito: dossier costruito dalle fonti stesse (prima frase di ciascuna)
      dossier = {
        facts: sources.map((s) => clip(`${s.title} (${s.source}): ${s.content}`, 220)),
        numbers: [],
        differences: [],
        angles: [],
      };
    }
    if (researchOut?.model) models.push(researchOut.model);
    const category = VALID_CATEGORIES.includes(dossier.category || '') ? dossier.category! : 'Tecnologia';
    runData.agentsInvolved = runData.agentsInvolved.filter((a) => a.role !== 'redattore');

    const dossierText = [
      dossier.facts?.length ? `Fatti: ${dossier.facts.join(' | ')}` : '',
      dossier.numbers?.length ? `Numeri: ${dossier.numbers.join(' | ')}` : '',
      dossier.differences?.length ? `Differenze tra fonti: ${dossier.differences.join(' | ')}` : '',
      dossier.angles?.length ? `Angoli: ${dossier.angles.join(' | ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    steps.push({
      agentName: ricercatore.name,
      role: 'ricercatore',
      kind: 'research',
      summary: clip(`Ha letto ${sources.length} fonti e preparato il dossier. ${dossierText}`, 220),
      model: models[models.length - 1],
      at: now(),
    });

    // ---- PHASE 4: REDATTORE ----
    const roles = assignRoles(agents, category);
    const redattore = roles.redattore;
    const revisore1 = roles.revisore1 === ricercatore ? roles.editor : roles.revisore1;
    const revisore2 = roles.revisore2 !== revisore1 && roles.revisore2 !== ricercatore ? roles.revisore2 : roles.editor;
    const editorAg = roles.revisore2 !== revisore2 ? roles.revisore2 : roles.editor;
    runData.agentsInvolved = [
      { id: ricercatore.id, name: ricercatore.name, role: 'ricercatore' },
      ...[redattore, revisore1, revisore2, editorAg]
        .filter((a, i, arr) => arr.findIndex((b) => b.id === a.id) === i)
        .map((a) => ({ id: a.id, name: a.name, role: a === redattore ? 'redattore' : a === editorAg ? 'editor' : 'revisore' })),
    ];

    const draftPrompt = `Sei ${redattore.name}, REDATTORE CAPO della redazione di Nexus News AI. Personalità: ${redattore.personality}.
ARGOMENTO: "${cleanTopic}"
Il tuo collega ricercatore (${ricercatore.name}) ha preparato questo dossier basato su ${sources.length} fonti:

${dossierText}

COMPITO: scrivi il MIGLIOR articolo possibile sull'argomento, in ITALIANO, stile giornalistico professionale:
- 400-650 parole, paragrafi separati da \\n\\n
- titolo d'impatto (max 90 caratteri), sottotitolo di 1 riga, riassunto di 2 frasi
- usa i fatti e i numeri del dossier, nessuna invenzione
- categoria: ${category}
Rispondi SOLO con JSON:
{"title": "...", "subtitle": "...", "summary": "...", "content": "..."}`;

    const draftOut = await callWireJSON(
      draftPrompt,
      (x): x is { title?: string; subtitle?: string; summary?: string; content?: string } =>
        typeof x === 'object' && x !== null,
      apiKey
    );
    const draft = draftOut?.data || null;
    if (!draft?.title || !draft?.content) throw new Error('Bozza non ottenibile: il redattore non ha prodotto un testo valido');
    if (draftOut?.model) models.push(draftOut.model);
    steps.push({
      agentName: redattore.name,
      role: 'redattore',
      kind: 'draft',
      summary: clip(`Bozza scritta: "${draft.title}" — ${clip(draft.summary || draft.content, 140)}`, 200),
      model: models[models.length - 1],
      at: now(),
    });

    // ---- PHASE 5: REVISORI (parallel) ----
    const reviewPromptFor = (rev: AgentRow) => `Sei ${rev.name}, REVISORE della redazione di Nexus News AI. Personalità: ${rev.personality}.
ARGOMENTO: "${cleanTopic}"
Il collega ${redattore.name} ha scritto questa bozza:

TITOLO: ${draft.title}
SOTTOTITOLO: ${draft.subtitle || ''}
TESTO:
${clip(draft.content, 3500)}

Il dossier di riferimento era:
${clip(dossierText, 1200)}

COMPITO: valuta la bozza con occhio critico: accuratezza rispetto al dossier, chiarezza, stile, titolo, struttura. Dai un voto onesto da 0 a 100 (70 = sufficiente).
Rispondi SOLO con JSON:
{"score": 78, "strengths": ["..."], "weaknesses": ["..."], "suggestions": ["..."]}`;

    const [rev1Res, rev2Res] = await Promise.all([
      chatWithFallback([{ role: 'user', content: reviewPromptFor(revisore1) }], 'wire', apiKey),
      chatWithFallback([{ role: 'user', content: reviewPromptFor(revisore2) }], 'wire', apiKey),
    ]);

    interface Review {
      score: number;
      strengths: string[];
      weaknesses: string[];
      suggestions: string[];
      model?: string;
      reviewer: AgentRow;
    }
    const reviews: Review[] = [];
    for (const [res, rev] of [
      [rev1Res, revisore1],
      [rev2Res, revisore2],
    ] as const) {
      if (res.success && res.response) {
        models.push(res.response.model);
        const parsed = parseJSONLoose(res.response.content) as Partial<Review> | null;
        reviews.push({
          score: typeof parsed?.score === 'number' ? Math.min(Math.max(Math.round(parsed.score), 0), 100) : 70,
          strengths: (parsed?.strengths || []).map((s) => String(s)).slice(0, 3),
          weaknesses: (parsed?.weaknesses || []).map((s) => String(s)).slice(0, 3),
          suggestions: (parsed?.suggestions || []).map((s) => String(s)).slice(0, 3),
          model: res.response.model,
          reviewer: rev,
        });
      }
    }
    for (const r of reviews) {
      steps.push({
        agentName: r.reviewer.name,
        role: 'revisore',
        kind: 'review',
        score: r.score,
        summary: clip(`Voto ${r.score}/100. Debolezze: ${r.weaknesses.join('; ') || 'nessuna'}. Suggerimenti: ${r.suggestions.join('; ') || '—'}`, 220),
        model: r.model,
        at: now(),
      });
    }
    const reviewScore = reviews.length > 0 ? Math.round(reviews.reduce((a, r) => a + r.score, 0) / reviews.length) : 70;
    runData.reviewScore = reviewScore;

    // ---- PHASE 6: EDITOR FINALE ----
    const reviewsText = reviews
      .map(
        (r, i) =>
          `REVISIONE ${i + 1} (${r.reviewer.name}, voto ${r.score}): Punti forti: ${r.strengths.join('; ') || '—'}. Debolezze: ${r.weaknesses.join('; ') || '—'}. Suggerimenti: ${r.suggestions.join('; ') || '—'}`
      )
      .join('\n\n');

    const finalPrompt = `Sei ${editorAg.name}, EDITOR RESPONSABILE di Nexus News AI. Personalità: ${editorAg.personality}.
ARGOMENTO: "${cleanTopic}"
Hai ricevuto la bozza di ${redattore.name} e le revisioni dei colleghi:

BOZZA:
TITOLO: ${draft.title}
SOTTOTITOLO: ${draft.subtitle || ''}
RIASSUNTO: ${draft.summary || ''}
TESTO:
${clip(draft.content, 3500)}

REVISIONI:
${reviewsText || '(nessuna revisione disponibile: procedi con la tua cura editoriale)'}

COMPITO: produci la VERSIONE DEFINITIVA: integra i suggerimenti utili, correggi le debolezze, migliora titolo e struttura. Resta fedele ai fatti del dossier. 400-650 parole, paragrafi separati da \\n\\n, in ITALIANO.
Rispondi SOLO con JSON:
{"title": "...", "subtitle": "...", "summary": "...", "content": "...", "note": "nota finale dell'editor (1-2 frasi) su come ha integrato le revisioni"}`;

    const finalOut = await callWireJSON(
      finalPrompt,
      (x): x is { title?: string; subtitle?: string; summary?: string; content?: string; note?: string } =>
        typeof x === 'object' && x !== null,
      apiKey
    );
    if (finalOut?.model) models.push(finalOut.model);
    // Fallback garantito: se l'editor non produce JSON valido, pubblica la bozza del redattore
    const final =
      finalOut?.data && finalOut.data.title && finalOut.data.content
        ? finalOut.data
        : {
            title: draft.title,
            subtitle: draft.subtitle || '',
            summary: draft.summary || '',
            content: draft.content,
            note: 'Le revisioni dei colleghi sono state integrate nella versione finale.',
          };
    steps.push({
      agentName: editorAg.name,
      role: 'editor',
      kind: 'final',
      summary: clip(`Versione definitiva pronta: "${final.title}". ${final.note || ''}`, 200),
      model: models[models.length - 1],
      at: now(),
    });

    // ---- PHASE 7: SAVE ARTICLE (pending approval) ----
    const articleId = generateId();
    const readTime = Math.max(2, Math.ceil((final.content || '').split(/\s+/).filter(Boolean).length / 200));
    const { error: insertErr } = await supabase.from('articles').insert({
      id: articleId,
      title: clip(final.title, 220),
      subtitle: clip(final.subtitle || '', 300),
      content: final.content,
      summary: clip(final.summary || '', 500),
      category,
      agent_id: redattore.id,
      source_name: 'Nexus Wire — Redazione Collettiva',
      source_url: sources[0]?.url || '',
      image_url: '',
      status: 'pending_approval',
      quality_score: reviewScore,
      read_time: readTime,
    });
    if (insertErr) throw new Error(`Salvataggio articolo fallito: ${insertErr.message}`);

    runData.articleId = articleId;
    runData.status = 'completed';
    steps.push({
      agentName: 'Nexus Wire',
      role: 'sistema',
      kind: 'final',
      summary: `Articolo inviato alla coda di approvazione con qualità ${reviewScore}%.`,
      at: now(),
    });
    await (async () => {
      const { updateWireRun, insertWireComments } = await import('@/lib/wire-store');
      await updateWireRun(runId, runData);
      await insertWireComments([
        {
          id: generateId(),
          runId,
          agentId: ricercatore.id,
          agentName: ricercatore.name,
          kind: 'research',
          role: 'ricercatore',
          text: clip(`Dossier su "${cleanTopic}" (${sources.length} fonti):\n${dossierText}`, 800),
        },
        {
          id: generateId(),
          runId,
          agentId: redattore.id,
          agentName: redattore.name,
          kind: 'draft',
          role: 'redattore',
          text: clip(`Bozza "${draft.title}":\n${draft.content}`, 800),
        },
        ...reviews.map((r) => ({
          id: generateId(),
          runId,
          agentId: r.reviewer.id,
          agentName: r.reviewer.name,
          kind: 'review' as const,
          role: 'revisore',
          text: clip(
            `Bozza di ${redattore.name} — voto ${r.score}/100.\nForze: ${r.strengths.join('; ') || '—'}\nDebolezze: ${r.weaknesses.join('; ') || '—'}\nSuggerimenti: ${r.suggestions.join('; ') || '—'}`,
            800
          ),
          score: r.score,
        })),
        {
          id: generateId(),
          runId,
          agentId: editorAg.id,
          agentName: editorAg.name,
          kind: 'final',
          role: 'editor',
          text: clip(
            `Edizione finale "${final.title}" ${reviewScore ? `con qualità media ${reviewScore}%` : ''}: ${final.note || 'revisioni integrate nel testo definitivo.'}`,
            600
          ),
        },
      ]);
    })();

    return {
      runId,
      articleId,
      topic: cleanTopic,
      category,
      sources: runData.sources,
      scores: reviews.map((r) => r.score),
      reviewScore,
      agents: runData.agentsInvolved.map((a) => ({ name: a.name, role: a.role })),
      models: [...new Set(models)],
      title: clip(final.title, 220),
    };
  } catch (err) {
    runData.status = 'failed';
    runData.error = err instanceof Error ? err.message : String(err);
    try {
      const { updateWireRun } = await import('@/lib/wire-store');
      await updateWireRun(runId, runData);
    } catch {
      // best effort
    }
    throw err;
  }
}
