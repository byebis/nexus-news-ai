'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// ============================================
// Language context: Italian (default) + English
// Persisted in localStorage, zero-dependency
// ============================================

export type Lang = 'it' | 'en';

const DICT: Record<string, { it: string; en: string }> = {
  // Header / nav
  aiActive: { it: 'AI Attivo', en: 'AI Active' },
  adminBtn: { it: 'Admin', en: 'Admin' },
  magazineBtn: { it: 'Magazine', en: 'Magazine' },
  adminPanel: { it: 'Pannello Admin', en: 'Admin Panel' },
  magazineView: { it: 'Vista Magazine', en: 'Magazine View' },
  lightTheme: { it: 'Tema Chiaro', en: 'Light Theme' },
  darkTheme: { it: 'Tema Scuro', en: 'Dark Theme' },

  // Hero
  heroWelcomeA: { it: 'Benvenuto su', en: 'Welcome to' },
  heroEmpty: {
    it: 'I nostri agenti AI stanno raccogliendo le ultime notizie. I primi articoli appariranno qui a breve.',
    en: 'Our AI agents are gathering the latest news. The first articles will appear here shortly.',
  },
  readMore: { it: 'Leggi di più', en: 'Read more' },
  minReadLong: { it: 'min di lettura', en: 'min read' },
  minRead: { it: 'min', en: 'min read' },

  // Cards / grid
  quality: { it: 'Qualità', en: 'Quality' },
  qExcellent: { it: 'Eccellente', en: 'Excellent' },
  qGood: { it: 'Buono', en: 'Good' },
  qFair: { it: 'Discreto', en: 'Fair' },
  reads: { it: 'letture', en: 'reads' },
  qualityScore: { it: 'Qualità', en: 'Quality' },

  // Ticker / trending
  breaking: { it: "Ultim'ora", en: 'Breaking' },
  flash: { it: 'Flash', en: 'Flash' },
  trendingNow: { it: 'Trending ora', en: 'Trending now' },
  trendingSub: { it: '· le letture del pubblico', en: '· what readers love' },

  // Categories
  catAll: { it: 'Tutti', en: 'All' },
  catTechnology: { it: 'Tecnologia', en: 'Technology' },
  catPolitics: { it: 'Politica', en: 'Politics' },
  catEconomy: { it: 'Economia', en: 'Economy' },
  catScience: { it: 'Scienza', en: 'Science' },
  catSport: { it: 'Sport', en: 'Sport' },
  catCulture: { it: 'Cultura', en: 'Culture' },
  catHealth: { it: 'Salute', en: 'Health' },
  catBookmarks: { it: 'Da leggere', en: 'Read later' },

  // Search / grid toolbar
  searchPlaceholder: { it: 'Cerca negli articoli...', en: 'Search articles...' },
  sortRecent: { it: 'Più recenti', en: 'Most recent' },
  sortQuality: { it: 'Migliori qualità', en: 'Best quality' },
  noArticlesTitle: { it: 'Nessun articolo', en: 'No articles yet' },
  noArticlesBody: {
    it: 'Non ci sono ancora articoli pubblicati in questa categoria. Gli agenti AI stanno lavorando per portarti le ultime notizie.',
    en: 'No published articles in this category yet. The AI agents are working to bring you the latest news.',
  },
  noResults: { it: 'Nessun risultato per', en: 'No results for' },

  // Modal
  publishingStatus: { it: 'Stato Pubblicazione', en: 'Publishing Status' },
  published: { it: 'Pubblicato', en: 'Published' },
  failed: { it: 'Fallito', en: 'Failed' },
  openFullPage: {
    it: 'Leggi la pagina completa con condivisione e articoli correlati',
    en: 'Open the full page with sharing and related articles',
  },
  source: { it: 'Fonte:', en: 'Source:' },
  qualityLabel: { it: 'Qualità:', en: 'Quality:' },

  // New articles banner
  oneNewArticle: { it: 'nuovo articolo in edicola', en: 'new article out now' },
  manyNewArticles: { it: 'nuovi articoli in edicola', en: 'new articles out now' },
  loadNow: { it: 'Carica', en: 'Load' },

  // Reader / TTS
  listen: { it: 'Ascolta', en: 'Listen' },
  ttsUnavailableHere: { it: 'Voce non disponibile qui', en: 'Voice not available here' },
  ttsUnavailableHereBody: {
    it: 'Questo browser/ambiente non espone voci vocali. Prova da Chrome, Edge o Safari desktop/mobile.',
    en: 'This browser/environment exposes no speech voices. Try Chrome, Edge or Safari on desktop/mobile.',
  },
  ttsUnavailable: { it: 'Voce non disponibile', en: 'Voice not available' },
  ttsUnsupported: { it: 'Il browser non supporta la sintesi vocale', en: 'Your browser does not support speech synthesis' },

  // Share
  linkCopied: { it: 'Link copiato', en: 'Link copied' },
  linkCopiedBody: { it: 'Il link dell\u2019articolo è negli appunti', en: 'The article link is in your clipboard' },
  shareError: { it: 'Errore', en: 'Error' },
  shareErrorBody: { it: 'Impossibile copiare il link', en: 'Could not copy the link' },

  // Bookmarks
  saveForLater: { it: 'Salva per dopo', en: 'Save for later' },
  removeSaved: { it: 'Rimuovi dai salvati', en: 'Remove from saved' },
  saved: { it: 'Salvato', en: 'Saved' },
  save: { it: 'Salva', en: 'Save' },

  // Article page
  backToMagazine: { it: 'Torna al magazine', en: 'Back to the magazine' },
  relatedFrom: { it: 'Altri articoli di {cat}', en: 'More from {cat}' },
  originalSource: { it: 'Fonte originale: ', en: 'Original source: ' },
  rewrittenBy: {
    it: 'Articolo riscritto e rielaborato da {agent} di Nexus News AI con un point of view editoriale originale.',
    en: 'Article rewritten and reworked by {agent} from Nexus News AI with an original editorial point of view.',
  },

  // Translation
  readInEnglish: { it: 'Read in English', en: 'Read in English' },
  readInItalian: { it: 'Leggi in italiano', en: 'Leggi in italiano' },
  translating: { it: 'Traduzione in corso… (fino a 60s la prima volta)', en: 'Translating… (up to 60s the first time)' },
  translatedWithAI: { it: 'Versione inglese generata con AI', en: 'English version generated with AI' },
  translateFailed: { it: 'Traduzione non disponibile, riprova tra poco', en: 'Translation unavailable, please retry soon' },

  // Digest
  digestTitle: { it: 'Il Digest della Redazione', en: 'The Newsroom Digest' },
  digestSub: { it: 'Ogni agente riassume la sua settimana in un thread editoriale', en: 'Each agent sums up its week in an editorial thread' },
  digestEmptyStaff: {
    it: 'Nessun digest per questa settimana. Genera il primo!',
    en: 'No digest for this week yet. Generate the first one!',
  },
  digestGenerateAll: { it: 'Genera tutti i digest', en: 'Generate all digests' },
  digestGenerateOne: { it: 'Genera', en: 'Generate' },
  digestSendTelegram: { it: 'Invia a Telegram', en: 'Send to Telegram' },
  digestArticlesThisWeek: { it: '{n} articoli questa settimana', en: '{n} articles this week' },
  digestGenerating: { it: 'Generazione… (fino a 60s)', en: 'Generating… (up to 60s)' },
  digestSent: { it: 'Thread inviato su Telegram', en: 'Thread sent on Telegram' },
  digestWeek: { it: 'Settimana del', en: 'Week of' },

  // Footer
  categories: { it: 'Categorie', en: 'Categories' },
  about: { it: 'Informazioni', en: 'About' },
  footerDisclaimer: {
    it: 'I contenuti sono generati da agenti AI specializzati e revisionati per garantire qualità e accuratezza.',
    en: 'Content is generated by specialized AI agents and reviewed to ensure quality and accuracy.',
  },
  allRights: { it: 'Tutti i diritti riservati.', en: 'All rights reserved.' },
  poweredBy: { it: 'Powered by AI Agents', en: 'Powered by AI Agents' },

  // AiDebate
  debateTitle: { it: 'Il Chiosco — la redazione commenta', en: 'The Kiosk — the newsroom comments' },
  debateSub: {
    it: "I nostri giornalisti AI leggono l'articolo dei colleghi e dicono la loro",
    en: 'Our AI journalists read their colleagues\u2019 article and share their take',
  },
  debateReading: {
    it: "Gli agenti stanno leggendo l'articolo… (fino a 30s la prima volta)",
    en: 'The agents are reading the article… (up to 30s the first time)',
  },
  debateFooter: {
    it: 'Commenti generati dagli agenti AI di Nexus News AI — nessun essere umano è stato coinvolto in questa discussione.',
    en: 'Comments generated by the AI agents of Nexus News AI — no human being was involved in this discussion.',
  },
  debateRecommended: { it: 'Consigliata', en: 'Recommended' },
  debateVote: { it: 'Voto {n}', en: 'Score {n}' },
  debateRefine: { it: 'Da rifinire ({n})', en: 'Needs work ({n})' },
};

function translate(key: string, lang: Lang, vars?: Record<string, string | number>): string {
  const entry = DICT[key];
  let out = entry ? entry[lang] : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return out;
}

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LangCtx>({ lang: 'it', setLang: () => {} });

const STORAGE_KEY = 'nexus-lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always start with 'it' to keep SSR/hydration consistent, then hydrate from storage
  const [lang, setLangState] = useState<Lang>('it');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'it') {
        setLangState(stored);
        document.documentElement.lang = stored;
      }
    } catch { /* noop */ }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    } catch { /* noop */ }
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

/** Returns a translate function bound to the current language. */
export function useT() {
  const { lang } = useLang();
  return useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(key, lang, vars),
    [lang]
  );
}

/** Inline translated text: <T k="readMore" /> */
export function T({ k, vars }: { k: string; vars?: Record<string, string | number> }) {
  const { lang } = useLang();
  return <>{translate(k, lang, vars)}</>;
}

/** Locale-aware date (it-IT / en-GB) — client-side only for consistency. */
export function LDate({
  date,
  options,
}: {
  date: string | null | undefined;
  options?: Intl.DateTimeFormatOptions;
}) {
  const { lang } = useLang();
  const locale = lang === 'en' ? 'en-GB' : 'it-IT';
  if (!date) return null;
  const opts: Intl.DateTimeFormatOptions = options || { day: 'numeric', month: 'long', year: 'numeric' };
  return <>{new Date(date).toLocaleDateString(locale, opts)}</>;
}

/** English display helpers for articles with translation cached */
export function pickTitle(lang: Lang, a: { title: string; titleEn?: string | null }): string {
  return lang === 'en' && a.titleEn ? a.titleEn : a.title;
}

export function pickSummary(lang: Lang, a: { summary: string; summaryEn?: string | null }): string {
  return lang === 'en' && a.summaryEn ? a.summaryEn : a.summary;
}

export function pickSubtitle(lang: Lang, a: { subtitle?: string | null; subtitleEn?: string | null }): string {
  return lang === 'en' && a.subtitleEn ? a.subtitleEn : (a.subtitle || '');
}

export const CATEGORY_LABEL_KEYS: Record<string, string> = {
  tecnologia: 'catTechnology',
  politica: 'catPolitics',
  economia: 'catEconomy',
  scienza: 'catScience',
  sport: 'catSport',
  cultura: 'catCulture',
  salute: 'catHealth',
};

/** Category display name in current language (falls back to raw value). */
export function useCategoryName() {
  const t = useT();
  return useCallback(
    (cat: string) => {
      const key = CATEGORY_LABEL_KEYS[(cat || '').toLowerCase()];
      return key ? t(key) : cat;
    },
    [t]
  );
}
