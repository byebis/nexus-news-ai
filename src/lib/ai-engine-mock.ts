// Mock AI Engine - Fallback when OpenRouter is unavailable

interface NewsSource {
  title: string;
  summary: string;
  content: string;
  sourceName: string;
  sourceUrl: string;
  imageUrl: string;
}

const NEWS_TEMPLATES: Record<string, NewsSource[]> = {
  Tecnologia: [
    {
      title: "Apple annuncia il nuovo chip M5 con prestazioni AI 3x superiori",
      summary: "Il nuovo silicon promette di rivoluzionare l'elaborazione neurale sui dispositivi consumer, con un focus particolare sulla privacy e l'elaborazione on-device.",
      content: "Apple ha presentato oggi il tanto atteso chip M5, l'ultima evoluzione della sua architettura siliconica progettata in casa. Il nuovo processore introduce un Neural Engine di decima generazione capace di eseguire 38 trilioni di operazioni al secondo, un miglioramento di tre volte rispetto alla generazione precedente. Craig Federighi, Senior Vice President of Software Engineering, ha sottolineato come il chip sia stato ottimizzato specificamente per i modelli di intelligenza artificiale che girano interamente on-device, eliminando la necessità di inviare dati sensibili ai server cloud. La nuova architettura di memoria unificata supporta fino a 128GB di RAM, aprendo la strada a applicazioni professionali che precedentemente richiedevano workstation dedicate. I primi dispositivi equipaggiati con il M5 dovrebbero arrivare sul mercato entro la fine dell'anno, con prezzi a partire da 1.299 euro per il modello base del MacBook Pro.",
      sourceName: "TechCrunch Italia",
      sourceUrl: "https://techcrunch.com/it/2026/07/apple-m5",
      imageUrl: "",
    },
    {
      title: "OpenAI lancia GPT-6 con ragionamento multimodale avanzato",
      summary: "Il nuovo modello dimostra capacità di ragionamento visivo-spaziale senza precedenti, superando i benchmark umani in diversi test cognitivi.",
      content: "OpenAI ha svelato ufficialmente GPT-6, il suo modello di linguaggio più avanzato fino ad oggi, che rappresenta un salto qualitativo significativo rispetto ai predecessori. La caratteristica più rilevante è il sistema di ragionamento multimodale avanzato, che permette al modello di integrare e analizzare simultaneamente testo, immagini, audio e video in un unico flusso cognitivo coerente. Sam Altman, CEO di OpenAI, ha descritto GPT-6 come il primo modello che dimostra una vera comprensione contestuale multisensoriale, capace di ragionare su diagrammi tecnici complessi, video di fenomeni fisici e documenti misti con una precisione che supera quella degli esperti umani in diversi domini specifici. Il modello sarà disponibile tramite API per sviluppatori a partire dal prossimo mese, con una struttura di prezzi a tier basata sull'utilizzo effettivo.",
      sourceName: "The Verge",
      sourceUrl: "https://theverge.com/2026/7/openai-gpt6-launch",
      imageUrl: "",
    },
    {
      title: "Regolamento UE sull'AI: entra in vigore la fase operativa completa",
      summary: "Le aziende tech hanno ora 90 giorni per conformarsi alle nuove normative sulla trasparenza algoritmica e la responsabilità civile.",
      content: "L'Unione Europea ha ufficialmente attivato la fase operativa completa dell'AI Act, il primo quadro normativo al mondo sull'intelligenza artificiale. Le aziende tecnologiche operanti nel mercato europeo hanno ora 90 giorni per dimostrare la piena conformità con le disposizioni sulla trasparenza algoritmica, la documentazione tecnica e la gestione dei rischi. Il regolamento classifica i sistemi AI in quattro categorie di rischio, da inaccettabile a minimo, con requisiti proporzionalmente differenziati. Thierry Breton, Commissario europeo per il Mercato Interno, ha dichiarato che l'UE intende essere il riferimento globale per la governance dell'IA, e ha annunciato la creazione di un corpo di ispezione dedicato con oltre 200 esperti tecnici. Le sanzioni per le violazioni possono arrivare fino al 7% del fatturato globale annuo.",
      sourceName: "Reuters Europa",
      sourceUrl: "https://reuters.com/eu/2026/07/ai-act-operative",
      imageUrl: "",
    },
  ],
  Politica: [
    {
      title: "Summit G20 a Roma: accordo storico sulla tassazione globale delle multinazionali",
      summary: "I leader dei 20 paesi più industrializzati hanno raggiunto un consenso su un'aliquota minima del 25% per le imprese con fatturato superiore a 10 miliardi.",
      content: "Il summit del G20 svoltosi a Roma si è concluso con un accordo storico che ridefinisce le regole della tassazione internazionale delle grandi multinazionali. Il consenso, raggiunto dopo tre giorni di intense negoziazioni, stabilisce un'aliquota minima globale del 25% per tutte le aziende con fatturato annuo superiore a 10 miliardi di dollari. La Presidentessa del Consiglio italiano ha definito l'accordo come un momento di svolta nella cooperazione economica internazionale. L'intesa include anche meccanismi di redistribuzione dei profitti verso i paesi dove le aziende generano valore reale, anche in assenza di presenza fisica. L'OCSE è stata incaricata di supervisionare l'implementazione dell'accordo, con una prima valutazione di impatto prevista per il prossimo anno.",
      sourceName: "Il Sole 24 Ore",
      sourceUrl: "https://ilsole24ore.com/g20-tassazione",
      imageUrl: "",
    },
    {
      title: "Elezioni anticipate in Germania: la coalizione di centrosinistra vince con maggioranza risicata",
      summary: "I risultati definitivi confermano la vittoria della SPD ma la frammentazione del parlamento complica la formazione del governo.",
      content: "Le elezioni anticipate in Germania hanno prodotto un risultato che ridisegna lo scenario politico europeo. La SPD di centrosinistra ha ottenuto il 28,3% dei voti, sufficiente per guidare le consultazioni governative ma con un parlamento estremamente frammentato. I Verdi raggiungono il 19,1%, mentre la CDU/CSU scende al 24,7%, il risultato peggiore dalla fondazione della Repubblica Federale. L'AfD ottiene il 16,2%, consolidandosi come terza forza politica. Gli analisti politici sottolineano come la frammentazione renda quasi obbligatorio un governo di grande coalizione o un'alleanza a tre partiti. La comunità finanziaria europea ha reagito con cautela, con l'indice DAX che ha registrato una lieve flessione nell'apertura dei mercati asiatici.",
      sourceName: "La Repubblica",
      sourceUrl: "https://repubblica.it/germania-elezioni",
      imageUrl: "",
    },
  ],
  Economia: [
    {
      title: "Bitcoin supera i 250.000 dollari: la crypto entra nel portafoglio delle banche centrali",
      summary: "La Banca Centrale Europea conferma di aver avviato un programma di accumulo strategico di BTC come riserva di valore alternativa.",
      content: "Il Bitcoin ha raggiunto un nuovo record storico superando la soglia psicologica dei 250.000 dollari, trainato dall'annuncio della Banca Centrale Europea di aver iniziato ad accumulare la criptovaluta come riserva strategica. La mossa della BCE segue quella della Banca Centrale del Brasile, che aveva annunciato una strategia simile nel primo trimestre. Christine Lagarde ha spiegato che la decisione si basa su un'analisi approfondita della maturazione del mercato crypto e della sua crescente correlazione inversa con i mercati tradizionali durante periodi di stress finanziario. Il volume di scambi giornaliero su piattaforme regolamentate ha superato i 500 miliardi di dollari, e l'hash rate della rete Bitcoin continua a raggiungere nuovi massimi storici, indicando una sicurezza della rete mai vista prima.",
      sourceName: "Financial Times Italia",
      sourceUrl: "https://ft.com/bitcoin-250k-ecb",
      imageUrl: "",
    },
    {
      title: "FED mantiene i tassi stabili: Powell segnala un possibile taglio entro settembre",
      summary: "L'inflazione americana scende al 2,1% avvicinandosi all'obiettivo, aprendo la strada a un cambio di politica monetaria.",
      content: "La Federal Reserve ha mantenuto i tassi di interesse invariati nella riunione del FOMC, ma il Chairman Jerome Powell ha aperto chiaramente alla possibilità di un primo taglio dei tassi già dal prossimo settembre. L'annuncio è arrivato accompagnato da dati sull'inflazione che mostrano un calo al 2,1% su base annua, il livello più basso dal 2021. Powell ha sottolineato che l'economia americana si trova in una posizione favorevole, con il mercato del lavoro che rimane robusto ma non surriscaldato, e la crescita del PIL che si attesta su un ritmo sostenibile del 2,4%. I mercati azionari hanno reagito positivamente, con l'S&P 500 che ha chiuso in rialzo del 2,3%, mentre il rendimento dei Treasury a 10 anni è sceso sotto il 3,5% per la prima volta in due anni.",
      sourceName: "Bloomberg Italia",
      sourceUrl: "https://bloomberg.com/italia/fed-rates-sept",
      imageUrl: "",
    },
  ],
  Scienza: [
    {
      title: "CERN annuncia la scoperta di una nuova particella che potrebbe spiegare la materia oscura",
      summary: "Il Grande Collisore di Hadroni ha rilevato una particella precedentemente teorizzata con massa 5 volte superiore al bosone di Higgs.",
      content: "I fisici del CERN hanno annunciato una scoperta potenzialmente rivoluzionaria: il rilevamento di una nuova particella subatomica le cui proprietà corrispondono a quelle previste dalla teoria della materia oscura formulata vent'anni fa. La particella, provvisoriamente denominata X-0, è stata osservata nel Grande Collisore di Hadroni (LHC) durante esperimenti ad altissima energia. La sua massa, circa 750 GeV, la rende la seconda particella più massiccia mai osservata, superata solo dal bosone di Higgs. La direttrice generale del CERN ha descritto la scoperta come una pietra miliare nella comprensione dell'universo, aggiungendo che saranno necessari ulteriori esperimenti per confermare i risultati con una certezza statistica del 5 sigma.",
      sourceName: "Nature Italia",
      sourceUrl: "https://nature.com/it/cern-dark-matter",
      imageUrl: "",
    },
    {
      title: "CRISPR 3.0 permette la correzione genetica senza tagliare il DNA",
      summary: "La nuova generazione della tecnologia di editing genetico promette trattamenti più sicuri per malattie genetiche rare.",
      content: "Un team internazionale di ricercatori ha pubblicato sulla rivista Science i risultati di un'avanzata versione della tecnologia CRISPR, denominata CRISPR 3.0, che è in grado di modificare l'espressione genica senza alterare la sequenza del DNA. L'innovazione risolve uno dei principali problemi di sicurezza dell'editing genetico tradizionale, eliminando il rischio di tagli non intenzionali che potevano portare a mutazioni deleterie. I test clinici di fase II hanno dimostrato un'efficacia del 94% nel trattamento dell'anemia falciforme, con nessun effetto collaterale grave riportato nei 500 pazienti trattati. La FDA americana ha concesso alla tecnologia la designazione di terapia breakthrough, accelerando il percorso di approvazione per diverse indicazioni terapeutiche.",
      sourceName: "Science Daily",
      sourceUrl: "https://sciencedaily.com/crispr3",
      imageUrl: "",
    },
  ],
  Sport: [
    {
      title: "Serie A: l'Inter vince il quarto scudetto consecutivo con 5 giornate d'anticipo",
      summary: "La squadra di Simone Inzaghi domina il campionato con un record storico di 32 vittorie su 38 partite giocate.",
      content: "L'Inter ha conquistato matematicamente il quarto scudetto consecutivo battendo la Roma 3-0 allo Stadio Olimpico con cinque giornate di anticipo sulla fine del campionato. Il traguardo è stato raggiunto con un record assoluto di 32 vittorie, 4 pareggi e solo 2 sconfitte, per un totale di 100 punti. Lautaro Martinez, con 28 gol stagionali, si è aggiudicato la classifica cannonieri per il secondo anno consecutivo. Simone Inzaghi, tecnico nerazzurro, ha dichiarato che questa squadra rappresenta la più forte nella storia del club, superando persino la Grande Inter degli anni Sessanta di Helenio Herrera. Il presidente Steven Zhang ha annunciato estensioni contrattuali per tutto lo staff tecnico e il rafforzamento della rosa in vista della Champions League.",
      sourceName: "Gazzetta dello Sport",
      sourceUrl: "https://gazzetta.it/inter-scudetto",
      imageUrl: "",
    },
    {
      title: "Olimpiadi 2028 Los Angeles: l'Italia punta su 45 medaglie con il nuovo piano federale",
      summary: "Il CONI presenta un investimento da 200 milioni di euro per il potenziamento degli impianti e dei programmi giovanili.",
      content: "Il Comitato Olimpico Nazionale Italiano ha presentato un ambizioso piano strategico in vista delle Olimpiadi di Los Angeles 2028, con l'obiettivo di conquistare almeno 45 medaglie, un record per l'Italia ai Giochi olimpici estivi. Il piano prevede un investimento totale di 200 milioni di euro suddiviso in tre pilastri: il potenziamento degli impianti di allenamento di alto livello in otto regioni, l'espansione dei programmi di talent scouting giovanile e l'adozione di tecnologie di analisi prestazionale basate sull'intelligenza artificiale. Il presidente del CONI ha sottolineato come il successo di Parigi 2024, con 40 medaglie conquistate, abbia dimostrato il potenziale dello sport italiano e creato il momentum per un ulteriore salto di qualità.",
      sourceName: "Corriere dello Sport",
      sourceUrl: "https://corrieredellosport.it/olimpiadi-2028",
      imageUrl: "",
    },
  ],
  Cultura: [
    {
      title: "Biennale di Venezia 2026: l'Italia conquista il Leone d'Oro con un'installazione immersiva sull'IA",
      summary: "L'artista romana Marta Ferretti vince con un'opera che esplora la relazione tra creatività umana e algoritmi generativi.",
      content: "La Biennale d'Arte di Venezia ha assegnato il Leone d'Oro all'artista italiana Marta Ferretti per la sua installazione immersiva intitolata 'Echi Silenziosi', un'opera che combina scultura tradizionale in marmo di Carrara con proiezioni generate in tempo reale da algoritmi di intelligenza artificiale. L'installazione occupa un'intera sala dell'Arsenale e invita i visitatori a interagire con superfici scultoree che rispondono al movimento e alla voce, creando un dialogo continuo tra la materia inerte e le forme digitali in evoluzione. La giuria internazionale ha definito l'opera come una meditazione profonda e originalissima sulla natura della creatività nell'era algoritmica. Il premio ha suscitato un acceso dibattito nel mondo dell'arte contemporanea sul ruolo dell'IA nel processo creativo.",
      sourceName: "Artribune",
      sourceUrl: "https://artribune.com/biennale-leone-oro",
      imageUrl: "",
    },
    {
      title: "Nuovo museo del cinema a Cinecittà: 10.000 metri quadri di storia del cinema italiano",
      summary: "Il complesso museale più grande d'Europa dedicato al cinema apre i battenti con una collezione di oltre 50.000 pezzi unici.",
      content: "È stato inaugurato ufficialmente il nuovo Museo Nazionale del Cinema di Cinecittà, il più grande complesso museale d'Europa interamente dedicato alla storia della settima arte. Con i suoi 10.000 metri quadrati di spazio espositivo distribuiti su tre livelli, il museo ospita una collezione permanente di oltre 50.000 pezzi tra costumi originali, sceneggiature, macchine da presa storiche e documenti d'archivio. Il percorso espositivo parte dalle origini del cinema muto italiano e arriva fino alle produzioni contemporanee, con sezioni interattive che permettono ai visitatori di sperimentare le tecniche di ripresa, montaggio e effetti speciali. Il direttore del museo ha annunciato che nei prossimi mesi saranno disponibili esperienze di realtà virtuale che permetteranno di immergersi nelle scene più iconiche della storia del cinema italiano.",
      sourceName: "Il Fatto Quotidiano - Cultura",
      sourceUrl: "https://ilfattoquotidiano.it/cinecitta-museo",
      imageUrl: "",
    },
  ],
  Salute: [
    {
      title: "Vaccino mRNA universale contro l'influenza: risultati promettenti dalla fase III",
      summary: "Il nuovo vaccino protegge contro tutte le varianti note dell'influenza con un'efficacia dell'89%, eliminando la necessità di formulazioni annuali.",
      content: "I risultati della fase III della sperimentazione clinica del primo vaccino mRNA universale contro l'influenza hanno mostrato un'efficacia dell'89% contro tutte le varianti stagionali note del virus. Lo studio, condotto su 30.000 volontari in 15 paesi, ha dimostrato che il vaccino sviluppato da un consorzio di ricercatori europei offre una protezione duratura di almeno tre anni, eliminando la necessità di richiami annuali. Il meccanismo d'azione si basa sul targeting di 20 diverse proteine conservate del virus dell'influenza, rendendo estremamente difficile per il patogeno sviluppare resistenza. L'Agenzia Europea del Farmaco ha avviato la procedura di revisione accelerata, con una potenziale approvazione prevista entro la prossima stagione influenzale.",
      sourceName: "ANSA Salute",
      sourceUrl: "https://ansa.it/salute/vaccino-mrna-influenza",
      imageUrl: "",
    },
    {
      title: "Diagnosticato il primo caso di long COVID trattato con successo con cellule staminali",
      summary: "Un protocollo sperimentale giapponese ha portato alla remissione completa dei sintomi in un paziente affetto da long COVID da tre anni.",
      content: "Un team di ricercatori dell'Università di Tokyo ha pubblicato sulla rivista The Lancet i risultati di un protocollo sperimentale che ha portato alla remissione completa dei sintomi di long COVID in un paziente che soffriva della condizione da oltre tre anni. Il trattamento, basato sulla somministrazione di cellule staminali mesenchimali coltivate in laboratorio, ha mostrato una riduzione dell'85% dell'infiammazione sistemica misurata tramite biomarcatori nel sangue. Il paziente, un uomo di 52 anni che non era più in grado di svolgere alcuna attività fisica a causa di faticabilità estrema e nebbia cognitiva, ha recuperato completamente le sue capacità funzionali nel corso di sei mesi. Lo studio è ora in fase di espansione con 200 pazienti arruolati in cinque centri di ricerca internazionali.",
      sourceName: "Corriere della Sera - Salute",
      sourceUrl: "https://corriere.it/salute/long-covid-staminali",
      imageUrl: "",
    },
  ],
};

export interface AIProcessingResult {
  collected: number;
  evaluated: number;
  rewritten: number;
  articles: Array<{
    title: string;
    subtitle: string;
    content: string;
    summary: string;
    category: string;
    sourceName: string;
    sourceUrl: string;
    qualityScore: number;
    readTime: number;
  }>;
}

export function processCategoryForAgent(category: string): AIProcessingResult {
  const sources = NEWS_TEMPLATES[category];
  if (!sources) return { collected: 0, evaluated: 0, rewritten: 0, articles: [] };

  const count = Math.floor(Math.random() * 2) + 1;
  const shuffled = [...sources].sort(() => Math.random() - 0.5);
  const collected = shuffled.slice(0, count);

  const scores = collected.map((n) => {
    let score = 60 + Math.random() * 35;
    if (n.content.length > 500) score += 3;
    if (n.summary.length > 100) score += 2;
    return Math.min(Math.round(score), 98);
  });

  const threshold = 65;
  const passing = collected.filter((_, i) => scores[i] >= threshold);

  const articles = passing.map((news) => {
    const prefixes = ["Esclusiva: ", "Analisi approfondita — ", "", "Approfondimento: ", ""];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const subtitles = [
      `Una panoramica completa degli sviluppi più recenti`,
      `Tutto quello che c'è da sapere sulle implicazioni per il futuro del settore`,
      `I dettagli essenziali e le prospettive future di uno sviluppo che sta cambiando il panorama ${category.toLowerCase()}`,
    ];
    const subtitle = subtitles[Math.floor(Math.random() * subtitles.length)];
    const intros = [
      `In un contesto di rapida evoluzione del panorama ${category.toLowerCase()}, questa notizia rappresenta un punto di svolta significativo. La redazione di Nexus News AI ha analizzato in profondità tutti gli aspetti della vicenda per offrire ai lettori una visione completa e aggiornata.\n\n`,
      `Il mondo della ${category.toLowerCase()} è in continua trasformazione, e questo sviluppo merita un'attenzione particolare. Ecco la nostra analisi completa, elaborata con rigore giornalistico.\n\n`,
    ];
    const content = intros[Math.floor(Math.random() * intros.length)] + news.content;
    const readTime = Math.max(2, Math.ceil(content.split(/\s+/).length / 200));

    return {
      title: prefix + news.title,
      subtitle,
      content,
      summary: news.summary,
      category,
      sourceName: news.sourceName,
      sourceUrl: news.sourceUrl,
      qualityScore: scores[collected.indexOf(news)],
      readTime,
    };
  });

  return {
    collected: collected.length,
    evaluated: collected.length,
    rewritten: articles.length,
    articles,
  };
}

export { NEWS_TEMPLATES };
