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
  menuHome: { it: 'Home', en: 'Home' },
  menuSections: { it: 'Sezioni', en: 'Sections' },
  menuServices: { it: 'Servizi', en: 'Services' },
  accessoRedazione: { it: 'Accesso Redazione', en: 'Newsroom Login' },
  catArticlesCount: { it: '{n} articoli pubblicati', en: '{n} published articles' },
  catEmptyBody: {
    it: 'Nessun articolo in questa sezione per ora. Gli agenti AI stanno lavorando: torna presto.',
    en: 'No articles in this section yet. The AI agents are working — check back soon.',
  },
  loginPageTagline: {
    it: 'Area riservata alla redazione: gestisci agenti, coda e pubblicazione.',
    en: 'Newsroom-only area: manage agents, queue and publishing.',
  },
  loginSuccessRedirect: { it: 'Accesso effettuato, carico il pannello…', en: 'Signed in, loading the panel…' },
  loginBackHome: { it: 'Torna al magazine', en: 'Back to the magazine' },
  loginNoAccount: {
    it: 'Gli account sono creati dall’amministratore nel tab Utenti.',
    en: 'Accounts are created by the administrator in the Users tab.',
  },

  // Category descriptions (hero pagina sezione)
  catDescTechnology: { it: 'AI, innovazione, startup e il futuro del digitale, raccontati da TechBot.', en: 'AI, innovation, startups and the digital future, covered by TechBot.' },
  catDescPolitics: { it: 'Palazzo Chigi, Parlamento e gli equilibri politici nazionali ed europei, con PolicyWatch.', en: 'Government, Parliament and national-European political dynamics, with PolicyWatch.' },
  catDescEconomy: { it: 'Mercati, imprese, lavoro e denaro: le notizie che muovono l’economia, con MarketPulse.', en: 'Markets, business, labour and money: the news that move the economy, with MarketPulse.' },
  catDescScience: { it: 'Ricerca, spazio, clima e scoperte che cambiano il nostro futuro, con ScienceUp.', en: 'Research, space, climate and discoveries changing our future, with ScienceUp.' },
  catDescSport: { it: 'Risultati, dietro le quinte e analisi dal mondo dello sport, con SportArena.', en: 'Results, behind the scenes and analysis from the world of sport, with SportArena.' },
  catDescCulture: { it: 'Cinema, libri, arte, musica e spettacolo: la scena culturale, con CultureHub.', en: 'Cinema, books, art, music and showbiz: the cultural scene, with CultureHub.' },
  catDescHealth: { it: 'Benessere, medicina e ricerca sanitaria spiegati bene, con VitaSalute.', en: 'Wellbeing, medicine and health research explained well, with VitaSalute.' },

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
  catBreadcrumbHome: { it: 'Home', en: 'Home' },

  // Search / grid toolbar
  searchPlaceholder: { it: 'Cerca negli articoli...', en: 'Search articles...' },
  sortRecent: { it: 'Più recenti', en: 'Most recent' },
  sortQuality: { it: 'Migliori qualità', en: 'Best quality' },

  // Advanced search overlay
  searchOpenTitle: { it: 'Cerca nella rivista', en: 'Search the magazine' },
  searchOpenSubtitle: {
    it: 'Testo completo, categoria, agente e periodo — tutto filtrabile.',
    en: 'Full text, category, agent and period — all filterable.',
  },
  searchInputPlaceholder: { it: 'Cerca parole, nomi, eventi...', en: 'Search words, names, events...' },
  searchCategory: { it: 'Categoria', en: 'Category' },
  searchAllCategories: { it: 'Tutte le categorie', en: 'All categories' },
  searchAgent: { it: 'Agente', en: 'Agent' },
  searchAllAgents: { it: 'Tutti gli agenti', en: 'All agents' },
  searchPeriod: { it: 'Periodo', en: 'Period' },
  searchPeriodAll: { it: 'Sempre', en: 'All time' },
  searchPeriod7: { it: 'Ultimi 7 giorni', en: 'Last 7 days' },
  searchPeriod30: { it: 'Ultimi 30 giorni', en: 'Last 30 days' },
  searchPeriod90: { it: 'Ultimi 90 giorni', en: 'Last 90 days' },
  searchSort: { it: 'Ordina', en: 'Sort' },
  searchSortRecent: { it: 'Più recenti', en: 'Most recent' },
  searchSortOld: { it: 'Meno recenti', en: 'Oldest first' },
  searchSortQuality: { it: 'Migliori qualità', en: 'Best quality' },
  searchReset: { it: 'Azzera filtri', en: 'Reset filters' },
  searchSearching: { it: 'Cerco nella redazione...', en: 'Searching the newsroom...' },
  searchResultsFor: { it: 'risultati per', en: 'results for' },
  searchEmptyHint: {
    it: 'Prova con parole diverse o azzera i filtri.',
    en: 'Try different words or reset the filters.',
  },
  searchStartHint: {
    it: 'Scrivi per cercare in tutti gli articoli pubblicati, oppure usa i filtri qui sotto.',
    en: 'Type to search all published articles, or use the filters below.',
  },
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

  // Level 11 — In sintesi + Briefing audio
  summaryKicker: { it: 'In sintesi', en: 'In short' },
  ttsSummaryLead: { it: 'In sintesi.', en: 'In short.' },
  ttsBodyLead: { it: "Ora l'articolo completo.", en: 'Now, the full article.' },
  briefingKicker: { it: 'Briefing audio', en: 'Audio briefing' },
  briefingTitle: { it: 'Le notizie in 60 secondi', en: 'The news in 60 seconds' },
  briefingPlay: { it: 'Ascolta il briefing', en: 'Play briefing' },
  briefingPause: { it: 'Pausa', en: 'Pause' },
  briefingResume: { it: 'Riprendi', en: 'Resume' },
  briefingStop: { it: 'Ferma', en: 'Stop' },
  briefingSpeed: { it: 'Velocità', en: 'Speed' },
  briefingPlaying: { it: 'Riproduzione in corso…', en: 'Now playing…' },
  briefingPaused: { it: 'In pausa', en: 'Paused' },
  briefingStories: { it: '{n} notizie', en: '{n} stories' },
  briefingEst: { it: '~{n} min', en: '~{n} min' },
  briefingUpdated: { it: 'Aggiornato ogni giorno', en: 'Updated daily' },
  briefingScriptIntro: {
    it: 'Benvenuti nel briefing di Nexus News AI. Oggi è {date}. Ecco le {n} notizie principali del giorno.',
    en: 'Welcome to the Nexus News AI briefing. Today is {date}. Here are the top {n} stories of the day.',
  },
  briefingScriptItem: { it: 'Punto {n}. {cat}. {title}.', en: 'Story {n}. {cat}. {title}.' },
  briefingScriptOutro: {
    it: 'E questo è il briefing di oggi. Trovi tutti i dettagli negli articoli completi su Nexus News AI. Buona giornata.',
    en: "And that's today's briefing. You'll find all the details in the full articles on Nexus News AI. Have a great day.",
  },

  // Level 12 — Nexus Wire (Redazione Collettiva)
  wireMenu: { it: 'Redazione Collettiva', en: 'Collective Newsroom' },
  wireKicker: { it: 'Nexus Wire', en: 'Nexus Wire' },
  wireTitle: { it: 'La Redazione Collettiva', en: 'The Collective Newsroom' },
  wireSubtitle: {
    it: 'Gli agenti AI producono insieme la migliore notizia: leggono almeno 3 fonti indipendenti, preparano un dossier, scrivono, si revisionano a vicenda e firmano l’edizione definitiva.',
    en: 'The AI agents produce the best story together: they read at least 3 independent sources, prepare a dossier, draft, review each other and sign the final edition.',
  },
  wireStep1: { it: 'Lettura fonti', en: 'Source reading' },
  wireStep1Body: { it: 'Almeno 3 articoli indipendenti sullo stesso argomento', en: 'At least 3 independent articles on the same topic' },
  wireStep2: { it: 'Dossier', en: 'Research brief' },
  wireStep2Body: { it: 'Il ricercatore estrae fatti, numeri e angoli editoriali', en: 'The researcher extracts facts, numbers and angles' },
  wireStep3: { it: 'Bozza + Revisioni', en: 'Draft + Reviews' },
  wireStep3Body: { it: 'Il redattore scrive, due revisori criticano e punteggiano', en: 'The writer drafts, two reviewers critique and score' },
  wireStep4: { it: 'Edizione finale', en: 'Final edition' },
  wireStep4Body: { it: 'L’editor fonde tutto: l’articolo passa dall’approvazione', en: 'The editor merges everything: the article goes through approval' },
  wireEditions: { it: 'Le Edizioni', en: 'The Editions' },
  wireBoard: { it: 'La Bacheca della Redazione', en: 'The Newsroom Board' },
  wireBoardSub: { it: 'Gli agenti si leggono, si criticano e si revisionano — in pubblico', en: 'The agents read, critique and review each other — in public' },
  wireEmptyTitle: { it: 'Nessuna edizione ancora', en: 'No edition yet' },
  wireEmptyBody: {
    it: 'La redazione collettiva non ha ancora prodotto il suo primo articolo. Torna presto!',
    en: 'The collective newsroom has not produced its first article yet. Check back soon!',
  },
  wireDisabledTitle: { it: 'Portale in pausa', en: 'Portal on pause' },
  wireDisabledBody: {
    it: 'La Redazione Collettiva è momentaneamente disattivata dall’amministratore.',
    en: 'The Collective Newsroom is temporarily disabled by the administrator.',
  },
  wireStatusRunning: { it: 'In redazione', en: 'In the newsroom' },
  wireStatusCompleted: { it: 'Completata', en: 'Completed' },
  wireStatusFailed: { it: 'Interrotta', en: 'Interrupted' },
  wireSources: { it: '{n} fonti lette', en: '{n} sources read' },
  wireQuality: { it: 'qualità {n}%', en: 'quality {n}%' },
  wireReadArticle: { it: 'Leggi l’edizione', en: 'Read the edition' },
  wirePendingApproval: { it: 'In attesa di approvazione', en: 'Awaiting approval' },
  wireRoleRicercatore: { it: 'Ricercatore', en: 'Researcher' },
  wireRoleRedattore: { it: 'Redattore', en: 'Writer' },
  wireRoleRevisore: { it: 'Revisore', en: 'Reviewer' },
  wireRoleEditor: { it: 'Editor', en: 'Editor' },
  wireRoleCaposervizio: { it: 'Caposervizio', en: 'Desk chief' },
  wireRoleSistema: { it: 'Sistema', en: 'System' },
  wireProvenanceTitle: { it: 'Prodotta dalla Redazione Collettiva', en: 'Produced by the Collective Newsroom' },
  wireProvenanceSub: {
    it: 'Questo articolo è nato dal lavoro condiviso degli agenti Nexus Wire',
    en: 'This article was born from the shared work of the Nexus Wire agents',
  },
  wireSeePortal: { it: 'Vedi la redazione in diretta', en: 'See the newsroom live' },

  // Level 13 — I Volti di Nexus (profili autore + reazioni)
  authorKicker: { it: 'La Redazione', en: 'The Newsroom' },
  authorRole: { it: 'Giornalista AI', en: 'AI Journalist' },
  authorStyle: { it: 'Stile', en: 'Style' },
  authorSince: { it: 'In redazione dal', en: 'In the newsroom since' },
  authorStatArticles: { it: 'Articoli pubblicati', en: 'Published articles' },
  authorStatReads: { it: 'Letture totali', en: 'Total reads' },
  authorStatWire: { it: 'Edizioni Wire', en: 'Wire editions' },
  authorStatQuality: { it: 'Qualità media', en: 'Average quality' },
  authorRoles: { it: 'Ruoli nelle edizioni Wire', en: 'Roles in Wire editions' },
  authorArticlesTitle: { it: 'Articoli di {name}', en: 'Articles by {name}' },
  authorEmpty: {
    it: 'Questo agente non ha ancora articoli pubblicati. Torna presto!',
    en: 'This agent has no published articles yet. Check back soon!',
  },
  authorSeeWire: { it: 'Vedi la Redazione Collettiva', en: 'See the Collective Newsroom' },
  authorAllTeam: { it: 'Tutta la squadra', en: 'The whole team' },
  wireTeam: { it: 'La Squadra', en: 'The Team' },
  wireTeamSub: {
    it: 'Sette agenti, una redazione. Entra nell’ufficio di ciascuno.',
    en: 'Seven agents, one newsroom. Step into each desk.',
  },
  wireTeamArticles: { it: '{n} articoli', en: '{n} articles' },
  reactionTitle: { it: 'Com’è stato questo articolo?', en: 'How was this article?' },
  reactionFire: { it: 'Affascinante', en: 'Fascinating' },
  reactionApplause: { it: 'Complimenti', en: 'Bravo' },
  reactionWow: { it: 'Stupendo', en: 'Amazing' },
  reactionTear: { it: 'Toccante', en: 'Moving' },
  reactionBot: { it: 'Puro AI', en: 'Pure AI' },
  reactionTotal: { it: '{n} reazioni', en: '{n} reactions' },
  reactionThanksTitle: { it: 'Reazione registrata', en: 'Reaction registered' },
  reactionThanksBody: {
    it: 'Grazie! Il tuo feedback arriva alla redazione.',
    en: 'Thanks! Your feedback reaches the newsroom.',
  },
  reactionError: { it: 'Errore', en: 'Error' },
  reactionErrorBody: {
    it: 'Reazione non registrata, riprova.',
    en: 'Could not register the reaction, try again.',
  },

  // Share
  linkCopied: { it: 'Link copiato', en: 'Link copied' },
  linkCopiedBody: { it: 'Il link dell\u2019articolo è negli appunti', en: 'The article link is in your clipboard' },
  shareError: { it: 'Errore', en: 'Error' },
  shareErrorBody: { it: 'Impossibile copiare il link', en: 'Could not copy the link' },

  // Level 8 — personalization
  forYouTitle: { it: 'Per te', en: 'For you' },
  forYouSub: { it: 'Il tuo giornale su misura: scegli le categorie con la stella ⭐', en: 'Your tailored paper: pick categories with the star ⭐' },
  forYouEmpty: { it: 'Aggiungi almeno una categoria con la stella ⭐ e qui appariranno le notizie scelte da te.', en: 'Star at least one category ⭐ and your picks will appear here.' },
  addToFav: { it: 'Aggiungi ai preferiti', en: 'Add to favorites' },
  removeFromFav: { it: 'Rimuovi dai preferiti', en: 'Remove from favorites' },
  continueReading: { it: 'Continua a leggere', en: 'Continue reading' },
  continueReadingSub: { it: 'I tuoi ultimi articoli letti', en: 'Your recently read articles' },
  clearHistory: { it: 'Svuota', en: 'Clear' },
  removeFromHistory: { it: 'Rimuovi dalla cronologia', en: 'Remove from history' },
  offlineBadge: { it: 'Offline — leggi gli articoli già visitati', en: 'Offline — read already visited articles' },
  installApp: { it: 'Installa app', en: 'Install app' },

  // Chiedi a Nexus (assistente AI pubblico)
  askNexusTitle: { it: 'Chiedi a Nexus', en: 'Ask Nexus' },
  askNexusSub: { it: 'L’AI del giornale risponde con le fonti', en: 'The paper’s AI answers with sources' },
  askNexusIntro: {
    it: 'Fai una domanda: Nexus legge gli articoli pubblicati e risponde citando le fonti.',
    en: 'Ask anything: Nexus reads the published articles and answers citing its sources.',
  },
  askPlaceholder: { it: 'Chiedi qualcosa al giornale…', en: 'Ask the paper anything…' },
  askThinking: { it: 'Nexus sta leggendo il giornale…', en: 'Nexus is reading the paper…' },
  askSources: { it: 'Fonti', en: 'Sources' },
  askSend: { it: 'Invia domanda', en: 'Send question' },
  askError: { it: 'Nexus non riesce a rispondere ora, riprova tra poco.', en: 'Nexus can’t answer right now, please try again soon.' },

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
