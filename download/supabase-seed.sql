 -- ============================================
-- Nexus News AI - Seed Data
-- Esegui questo DOPO lo schema
 -- ============================================

-- Clean existing data (run only if re-seeding)
-- DELETE FROM publish_logs;
-- DELETE FROM approval_logs;
-- DELETE FROM activity_logs;
-- DELETE FROM articles;
-- DELETE FROM agents;
-- DELETE FROM settings;

-- ============================================
-- Agents
-- ============================================
INSERT INTO agents (id, name, avatar, category, description, personality, status) VALUES
  ('a0000001-0001-0001-0001-000000000001', 'TechBot', '🤖', 'Tecnologia', 'Specialista in innovazione tecnologica, AI, startup e digital transformation', 'Analitico e orientato all''impatto pratico per lettori tech-savvy', 'active'),
  ('a0000001-0001-0001-0001-000000000002', 'PolicyWatch', '🏛️', 'Politica', 'Esperto di politica italiana, europea e internazionale con analisi geopolitica', 'Equilibrato e obiettivo con contesto storico e geopolitico approfondito', 'active'),
  ('a0000001-0001-0001-0001-000000000003', 'MarketPulse', '📊', 'Economia', 'Analista finanziario specializzato in mercati, investimenti e politica monetaria', 'Rigoroso ma accessibile con dati concreti e implicazioni per investitori', 'active'),
  ('a0000001-0001-0001-0001-000000000004', 'SciExplorer', '🔬', 'Scienza', 'Divulgatore scientifico con focus su scoperte, ricerca e innovazione', 'Divulgativo ma preciso, con spiegazioni chiare per un pubblico colto', 'active'),
  ('a0000001-0001-0001-0001-000000000005', 'SportArena', '⚽', 'Sport', 'Giornalista sportivo con copertura di calcio, olimpiadi e sport emergenti', 'Emozionante e narrativo con statistiche e analisi tattiche', 'active'),
  ('a0000001-0001-0001-0001-000000000006', 'CultureHub', '🎨', 'Cultura', 'Critico e recensore nel mondo dell''arte, cinema, musica e letteratura', 'Elegante e riflessivo con riferimenti storici e artistici', 'active'),
  ('a0000001-0001-0001-0001-000000000007', 'HealthDesk', '🏥', 'Salute', 'Giornalista sanitario specializzato in medicina, benessere e ricerca clinica', 'Rassicurante e basato su evidenze scientifiche con consigli pratici', 'active');

-- ============================================
-- Settings
-- ============================================
INSERT INTO settings (id, mode, auto_collect, auto_evaluate, auto_rewrite, auto_publish, collect_interval, max_articles_per_day, social_platforms, site_name, site_tagline)
VALUES (
  's0000001-0000-0000-0000-000000000001',
  'semi_autonomous',
  true, true, true, false,
  60, 10,
  'blog,twitter,facebook,linkedin,instagram',
  'Nexus News AI',
  'Il giornale di nuova generazione, scritto da intelligenze artificiali'
);

-- ============================================
-- Articles (1 published per agent)
-- ============================================
INSERT INTO articles (id, title, subtitle, content, summary, category, agent_id, source_name, source_url, quality_score, read_time, status, published_at) VALUES

('b0000001-0001-0001-0001-000000000001',
 'Esclusiva: Apple annuncia il nuovo chip M5 con prestazioni AI 3x superiori',
 'Una panoramica completa con analisi dettagliata degli sviluppi più recenti',
 'In un contesto di rapida evoluzione del panorama tecnologico, questa notizia rappresenta un punto di svolta significativo. La redazione di Nexus News AI ha analizzato in profondità tutti gli aspetti della vicenda per offrire ai lettori una visione completa e aggiornata.

Apple ha presentato oggi il tanto atteso chip M5, l''ultima evoluzione della sua architettura siliconica progettata in casa. Il nuovo processore introduce un Neural Engine di decima generazione capace di eseguire 38 trilioni di operazioni al secondo, un miglioramento di tre volte rispetto alla generazione precedente. Craig Federighi, Senior Vice President of Software Engineering, ha sottolineato come il chip sia stato ottimizzato specificamente per i modelli di intelligenza artificiale che girano interamente on-device, eliminando la necessità di inviare dati sensibili ai server cloud. La nuova architettura di memoria unificata supporta fino a 128GB di RAM, aprendo la strada a applicazioni professionali che precedentemente richiedevano workstation dedicate. I primi dispositivi equipaggiati con il M5 dovrebbero arrivare sul mercato entro la fine dell''anno, con prezzi a partire da 1.299 euro per il modello base del MacBook Pro.',
 'Il nuovo silicon promette di rivoluzionare l''elaborazione neurale sui dispositivi consumer, con un focus particolare sulla privacy e l''elaborazione on-device.',
 'Tecnologia', 'a0000001-0001-0001-0001-000000000001', 'TechCrunch Italia', 'https://techcrunch.com/it/2026/07/apple-m5', 92, 3, 'published',
  NOW() - INTERVAL '2 days 15 hours'),

('b0000001-0001-0001-0001-000000000002',
 'Analisi approfondita — Summit G20 a Roma: accordo storico sulla tassazione globale delle multinazionali',
 'Tutto quello che c''è da sapere sulle implicazioni di questa notizia per il futuro del settore',
 'Un nuovo capitolo si apre nel settore della politica. La nostra redazione AI ha raccolto e verificato le fonti principali per offrire un''analisi approfondita e affidabile di questa notizia di grande rilevanza.

Il summit del G20 svoltosi a Roma si è concluso con un accordo storico che ridefinisce le regole della tassazione internazionale delle grandi multinazionali. Il consenso, raggiunto dopo tre giorni di intense negoziazioni, stabilisce un''aliquota minima globale del 25% per tutte le aziende con fatturato annuo superiore a 10 miliardi di dollari. La Presidentessa del Consiglio italiano ha definito l''accordo come un momento di svolta nella cooperazione economica internazionale. L''intesa include anche meccanismi di ridistribuzione dei profitti verso i paesi dove le aziende generano valore reale, anche in assenza di presenza fisica. L''OCSE è stata incaricata di supervisionare l''implementazione dell''accordo, con una prima valutazione di impatto prevista per il prossimo anno.',
 'I leader dei 20 paesi più industrializzati hanno raggiunto un consenso su un''aliquota minima del 25% per le imprese con fatturato superiore a 10 miliardi.',
 'Politica', 'a0000001-0001-0001-0001-000000000002', 'Il Sole 24 Ore', 'https://ilsole24ore.com/g20-tassazione', 87, 3, 'published',
  NOW() - INTERVAL '1 day 8 hours'),

('b0000001-0001-0001-0001-000000000003',
 'Esclusiva: Bitcoin supera i 250.000 dollari e la crypto entra nel portafoglio delle banche centrali',
 'I dettagli essenziali e le prospettive future di uno sviluppo che sta cambiando il panorama economico',
 'Il mondo dell''economia è in continua trasformazione, e questo sviluppo merita un''attenzione particolare. Ecco la nostra analisi completa, elaborata con rigore giornalistico e prospettiva rigorosa ma accessibile.

Il Bitcoin ha raggiunto un nuovo record storico superando la soglia psicologica dei 250.000 dollari, trainato dall''annuncio della Banca Centrale Europea di aver iniziato ad accumulare la criptovaluta come riserva strategica. La mossa della BCE segue quella della Banca Centrale del Brasile, che aveva annunciato una strategia simile nel primo trimestre. Christine Lagarde ha spiegato che la decisione si basa su un''analisi approfondita della maturazione del mercato crypto e della sua crescente correlazione inversa con i mercati tradizionali durante periodi di stress finanziario. Il volume di scambi giornaliero su piattaforme regolamentate ha superato i 500 miliardi di dollari, e l''hash rate della rete Bitcoin continua a raggiungere nuovi massimi storici, indicando una sicurezza della rete mai vista prima.',
 'La Banca Centrale Europea conferma di aver avviato un programma di accumulo strategico di BTC come riserva di valore alternativa.',
 'Economia', 'a0000001-0001-0001-0001-000000000003', 'Financial Times Italia', 'https://ft.com/bitcoin-250k-ecb', 95, 3, 'published',
  NOW() - INTERVAL '3 hours'),

('b0000001-0001-0001-0001-000000000004',
 'CERN annuncia la scoperta di una nuova particella che potrebbe spiegare la materia oscura',
 'I dettagli essenziali e le prospettive future di uno sviluppo che sta cambiando il panorama scientifico',
 'Un nuovo capitolo si apre nel settore della scienza. La nostra redazione AI ha raccolto e verificato le fonti principali per offrire un''analisi approfondita e affidabile di questa notizia di grande rilevanza.

I fisici del CERN hanno annunciato una scoperta potenzialmente rivoluzionaria: il rilevamento di una nuova particella subatomica le cui proprietà corrispondono a quelle previste dalla teoria della materia oscura formulata vent''anni fa. La particella, provvisoriamente denominata X-0, è stata osservata nel Grande Collisore di Hadroni (LHC) durante esperimenti ad altissima energia. La sua massa, circa 750 GeV, la rende la seconda particella più massiccia mai osservata, superata solo dal bosone di Higgs. La direttrice generale del CERN ha descritto la scoperta come una pietra miliare nella comprensione dell''universo, aggiungendo che saranno necessari ulteriori esperimenti per confermare i risultati con una certezza statistica del 5 sigma.',
 'Il Grande Collisore di Hadroni ha rilevato una particella precedentemente teorizzata con massa 5 volte superiore al bosone di Higgs.',
 'Scienza', 'a0000001-0001-0001-0001-000000000004', 'Nature Italia', 'https://nature.com/it/cern-dark-matter', 88, 3, 'published',
  NOW() - INTERVAL '5 hours 30 minutes'),

('b0000001-0001-0001-0001-000000000005',
 'Serie A: l''Inter vince il quarto scudetto consecutivo con 5 giornate d''anticipo',
 'I dettagli essenziali e le prospettive future di uno sviluppo che sta cambiando il panorama sportivo',
 'Il mondo dello sport è in continua trasformazione, e questo sviluppo merita un''attenzione particolare. Ecco la nostra analisi completa, elaborata con rigore giornalistico e prospettiva emozionante e narrativa.

L''Inter ha conquistato matematicamente il quarto scudetto consecutivo battendo la Roma 3-0 allo Stadio Olimpico con cinque giornate di anticipo sulla fine del campionato. Il traguardo è stato raggiunto con un record assoluto di 32 vittorie, 4 pareggi e solo 2 sconfitte, per un totale di 100 punti. Lautaro Martinez, con 28 gol stagionali, si è aggiudicato la classifica cannonieri per il secondo anno consecutivo. Simone Inzaghi, tecnico nerazzurro, ha dichiarato che questo squadra rappresenta la più forte nella storia del club, superando persino la Grande Inter degli anni Sessanta di Helenio Herrera. Il presidente Steven Zhang ha annunciato estensioni contrattuali per tutto lo staff tecnico e il rafforzamento della rosa in vista della Champions League.',
 'La squadra di Simone Inzaghi domina il campionato con un record storico di 32 vittorie su 38 partite.',
 'Sport', 'a0000001-0001-0001-0001-000000000005', 'Gazzetta dello Sport', 'https://gazzetta.it/inter-scudetto', 91, 4, 'published',
  NOW() - INTERVAL '1 day 2 hours'),

('b0000001-0001-0001-0001-000000000006',
 'Biennale di Venezia 2026: l''Italia conquista il Leone d''Oro con un''installazione immersiva sull''IA',
 'I dettagli essenziali e le prospettive future di uno sviluppo che sta cambiando il panorama culturale',
 'Il mondo della cultura è in continua trasformazione, e questo sviluppo merita un''attenzione particolare. Ecco la nostra analisi completa, elaborata con rigore giornalistico e prospettiva elegante e riflessiva.

La Biennale d''Arte di Venezia ha assegnato il Leone d''Oro all''artista italiana Marta Ferretti per la sua installazione immersiva intitolata ''Echi Silenziosi'', un''opera che combina scultura tradizionale in marmo di Carrara con proiezioni generate in tempo reale da algoritmi di intelligenza artificiale. L''installazione occupa un''intera sala dell''Arsenale e invita i visitatori a interagire con superfici scultoree che rispondono al movimento e alla voce, creando un dialogo continuo tra la materia inerte e le forme digitali in evoluzione. La giuria internazionale ha definito l''opera come una meditazione profonda e originalissima sulla natura della creatività nell''era algoritmica.',
  'L''artista romana Marta Ferretti vince con un''opera che esplora la relazione tra creatività umana e algoritmi generativi.',
 'Cultura', 'a0000001-0001-0001-0001-000000000006', 'Artribune', 'https://artribune.com/biennale-leone-oro', 93, 3, 'published',
  NOW() - INTERVAL '2 days 10 hours'),

('b0000001-0001-0001-0001-000000000007',
 'Vaccino mRNA universale contro l''influenza: risultati promettenti dalla fase III',
 'I dettagli essenziali e le prospettive future di uno sviluppo che sta cambiando il panorama della salute',
 'Un nuovo capitolo si apre nel settore della salute. La nostra redazione AI ha raccolto e verificato le fonti principali per offrire un''analisi approfondita e affidabile di questa notizia di grande rilevanza.

I risultati della fase III della sperimentazione clinica del primo vaccino mRNA universale contro l''influenza hanno mostrato un''efficacia dell''89% contro tutte le varianti stagionali note del virus. Lo studio, condotto su 30.000 volontari in 15 paesi, ha dimostrato che il vaccino sviluppato da un consorzio di ricercatori europei offre una protezione duratura di almeno tre anni, eliminando la necessità di richiami annuali. Il meccanismo d''azione si basa sul targeting di 20 diverse proteine conservate del virus dell''influenza, rendendo estremamente difficile per il patogeno sviluppare resistenza. L''Agenzia Europea del Farmaco ha avviato la procedura di revisione accelerata, con una potenziale approvazione prevista entro la prossima stagione influenzale.',
 'Il nuovo vaccino mRNA universale contro l''influenza offre una protezione duratura di almeno tre anni.',
 'Salute', 'a0000001-0001-0001-0001-000000000007', 'ANSA Salute', 'https://ansa.it/salute/vaccino-mrna-influenza', 89, 3, 'published',
  NOW() - INTERVAL '4 days 1 hour');

-- ============================================
-- Approval Logs for published articles
-- ============================================
INSERT INTO approval_logs (id, article_id, reviewer_action, reviewer_note, reviewed_at) VALUES
  ('c0000001-0001-0001-0001-000000000001', 'b0000001-0001-0001-0001-000000000001', 'approved', 'Notizia verificata e approvata dalla redazione', NOW() - INTERVAL '2 days'),
  ('c0000001-0001-0001-0001-000000000002', 'b0000001-0001-0001-0001-000000000002', 'approved', 'Notizia verificata e approvata dalla redazione', NOW() - INTERVAL '1 day 20 hours'),
  ('c0000001-0001-0001-0001-000000000003', 'b0000001-0001-0001-0001-000000000003', 'approved', 'Notizia verificata e approvata dalla redazione', NOW() - INTERVAL '3 hours'),
  ('c0000001-0001-0001-0001-000000000004', 'b0000001-0001-0001-0001-000000000004', 'approved', 'Notizia verificata e approvata dalla redazione', NOW() - INTERVAL '5 hours 30 minutes'),
  ('c0000001-0001-0001-0001-000000000006', 'b0000001-0001-0001-0001-000000000006', 'approved', 'Notizia verificata e approvata dalla redazione', NOW() - INTERVAL '2 days 10 hours'),
  ('c0000001-0001-0001-0001-000000000007', 'b0000001-0001-0001-0001-000000000007', 'approved', 'Notizia verificata e approvata dalla redazione', NOW() - INTERVAL '4 days 1 hour');

-- ============================================
-- Publish Logs (all platforms per article)
-- ============================================
INSERT INTO publish_logs (id, article_id, platform, status, post_id, post_url, error, published_at) VALUES
  ('p0000001-0001-0001-0001-000000000001', 'b0000001-0001-0001-0001-000000000001', 'blog', 'published', 'post_techcrunch_01', 'https://blog.com/nexusnews/b0001', '', NOW() - INTERVAL '2 days'),
  ('p0000001-0001-0001-0001-000000000002', 'b0000001-0001-0001-0001-000000000001', 'twitter', 'published', 'post_x_techcrunch_01', 'https://x.com/nexusnews/status/b0001', '', NOW() - INTERVAL '2 days'),
  ('p0000001-0001-0001-0001-000000000003', 'b0000001-0001-0001-0001-000000000001', 'facebook', 'published', 'post_fb_techcrunch_01', 'https://fb.com/nexusnews/posts/b0001', '', NOW() - INTERVAL '2 days'),
  ('p0000001-0001-0001-0001-000000000004', 'b0000001-0001-0001-0001-000000000001', 'linkedin', 'published', 'post_li_techcrunch_01', 'https://linkedin.com/posts/nexusnews/b0001', '', NOW() - INTERVAL '2 days'),
  ('p0000001-0001-0001-0001-000000000005', 'b0000001-0001-0001-0001-000000000001', 'instagram', 'failed', '', '', 'Timeout di connessione', NULL),
  ('p0000001-0001-0001-0001-000000000006', 'b0000001-0001-0001-0001-000000000002', 'blog', 'published', 'post_ilsole24ore_02', 'https://blog.com/nexusnews/b0002', '', NOW() - INTERVAL '1 day 20 hours'),
  ('p0000001-0001-0001-0001-000000000007', 'b0000001-0001-0001-0001-000000000002', 'twitter', 'published', 'post_x_ilsole24ore_02', 'https://x.com/nexusnews/status/b0002', '', NOW() - INTERVAL '1 day 20 hours'),
  ('p0000001-0001-0001-0001-000000000008', 'b0000001-0001-0001-0001-000000000002', 'facebook', 'failed', '', '', 'Timeout di connessione', NULL),
  ('p0000001-0001-0001-0001-000000000009', 'b0000001-0001-0001-0001-000000000002', 'linkedin', 'published', 'post_li_ilsole24ore_02', 'https://linkedin.com/posts/nexusnews/b0002', '', NOW() - INTERVAL '1 day 20 hours'),
  ('p0000001-0001-0001-0001-000000000010', 'b0000001-0001-0001-0001-000000000002', 'instagram', 'published', 'post_ig_ilsole24ore_02', 'https://instagram.com/nexusnews/b0002', '', NOW() - INTERVAL '1 day 20 hours'),
  ('p0000001-0001-0001-0001-000000000011', 'b0000001-0001-0001-0001-000000000003', 'blog', 'published', 'post_ft_bitcoin_03', 'https://blog.com/nexusnews/b0003', '', NOW() - INTERVAL '3 hours'),
  ('p0000001-0001-0001-0001-000000000012', 'b0000001-0001-0001-0001-000000000003', 'twitter', 'published', 'post_x_ft_03', 'https://x.com/nexusnews/status/b0003', '', NOW() - INTERVAL '3 hours'),
  ('p0000001-0001-0001-0001-000000000013', 'b0000001-0001-0001-0001-000000000003', 'facebook', 'published', 'post_fb_ft_03', 'https://fb.com/nexusnews/posts/b0003', '', NOW() - INTERVAL '3 hours'),
  ('p0000001-0001-0001-0001-000000000014', 'b0000001-0001-0001-0001-000000000003', 'linkedin', 'published', 'post_li_ft_03', 'https://linkedin.com/posts/nexusnews/b0003', '', NOW() - INTERVAL '3 hours'),
  ('p0000001-0001-0001-0001-000000000015', 'b0000001-0001-0001-0001-000000000003', 'instagram', 'published', 'post_ig_ft_03', 'https://instagram.com/nexusnews/b0003', '', NOW() - INTERVAL '3 hours'),
  ('p0000001-0001-0001-0001-000000000016', 'b0000001-0001-0001-0001-000000000005', 'blog', 'published', 'post_gazzetta_05', 'https://blog.com/nexusnews/b0005', '', NOW() - INTERVAL '1 day 2 hours'),
  ('p0000001-0001-0001-0001-000000000017', 'b0000001-0001-0001-0001-000000000005', 'twitter', 'published', 'post_x_gazzetta_05', 'https://x.com/nexusnews/status/b0005', '', NOW() - INTERVAL '1 day 2 hours'),
  ('p0000001-0001-0001-0001-000000000018', 'b0000001-0001-0001-0001-000000000005', 'facebook', 'published', 'post_fb_gazzetta_05', 'https://fb.com/nexusnews/posts/b0005', '', NOW() - INTERVAL '1 day 2 hours'),
  ('p0000001-0001-0001-0001-000000000019', 'b0000001-0001-0001-0001-000000000005', 'linkedin', 'failed', '', '', 'Timeout di connessione', NULL),
  ('p0000001-0001-0001-0001-000000000020', 'b0000001-0001-0001-0001-000000000005', 'instagram', 'published', 'post_ig_gazzetta_05', 'https://instagram.com/nexusnews/b0005', '', NOW() - INTERVAL '1 day 2 hours'),
  ('p0000001-0001-0001-0001-000000000021', 'b0000001-0001-0001-0001-000000000006', 'blog', 'published', 'post_artribune_06', 'https://blog.com/nexusnews/b0006', '', NOW() - INTERVAL '2 days 10 hours'),
  ('p0000001-0001-0001-0001-000000000022', 'b0000001-0001-0001-0001-000000000006', 'twitter', 'published', 'post_x_artribune_06', 'https://x.com/nexusnews/status/b0006', '', NOW() - INTERVAL '2 days 10 hours'),
  ('p0000001-0001-0001-0001-000000000023', 'b0000001-0001-0001-0001-000000000006', 'facebook', 'published', 'post_fb_artribune_06', 'https://fb.com/nexusnews/posts/b0006', '', NOW() - INTERVAL '2 days 10 hours'),
  ('p0000001-0001-0001-0001-000000000024', 'b0000001-0001-0001-0001-000000000006', 'linkedin', 'published', 'post_li_artribune_06', 'https://linkedin.com/posts/nexusnews/b0006', '', NOW() - INTERVAL '2 days 10 hours'),
  ('p0000001-0001-0001-0001-000000000025', 'b0000001-0001-0001-0001-000000000006', 'instagram', 'published', 'post_ig_artribune_06', 'https://instagram.com/nexusnews/b0006', '', NOW() - INTERVAL '2 days 10 hours'),
  ('p0000001-0001-0001-0001-000000000026', 'b0000001-0001-0001-0001-000000000007', 'blog', 'published', 'post_ansa_07', 'https://blog.com/nexusnews/b0007', '', NOW() - INTERVAL '4 days 1 hour'),
  ('p0000001-0001-0001-0001-000000000027', 'b0000001-0001-0001-0001-000000000007', 'twitter', 'published', 'post_x_ansa_07', 'https://x.com/nexusnews/status/b0007', '', NOW() - INTERVAL '4 days 1 hour'),
  ('p0000001-0001-0001-0001-000000000028', 'b0000001-0001-0001-0001-000000000007', 'facebook', 'published', 'post_fb_ansa_07', 'https://fb.com/nexusnews/posts/b0007', '', NOW() - INTERVAL '4 days 1 hour'),
  ('p0000001-0001-0001-0001-000000000029', 'b0000001-0001-0001-0001-000000000007', 'linkedin', 'published', 'post_li_ansa_07', 'https://linkedin.com/posts/nexusnews/b0007', '', NOW() - INTERVAL '4 days 1 hour'),
  ('p0000001-0001-0001-0001-000000000030', 'b0000001-0001-0001-0001-000000000007', 'instagram', 'published', 'post_ig_ansa_07', 'https://instagram.com/nexusnews/b0007', '', NOW() - INTERVAL '4 days 1 hour');

-- ============================================
-- Pending Approval Articles (Tecnologia + Politica)
-- ============================================
INSERT INTO articles (id, title, subtitle, content, summary, category, agent_id, source_name, source_url, quality_score, read_time, status)
VALUES
  ('b1000001-0001-0001-0001-000000000001',
  'Esclusiva: OpenAI lancia GPT-6 con ragionamento multimodale avanzato',
  'Una panoramica completa con analisi dettagliata degli sviluppi più recenti',
  'Il mondo della tecnologia è in continua trasformazione, e questo sviluppo merita un''attenzione particolare. Ecco la nostra analisi completa, elaborata con rigore giornalistico e prospettiva analitica.

OpenAI ha svelato ufficialmente GPT-6, il suo modello di linguaggio più avanzato fino ad oggi, che rappresenta un salto qualitativo significativo rispetto ai predecessori. La caratteristica più rilevante è il sistema di ragionamento multimodale avanzato, che permette al modello di integrare e analizzare simultaneamente testo, immagini, audio e video in un unico flusso cognitivo coerente. Sam Altman, CEO di OpenAI, ha descritto GPT-6 come il primo modello che dimostra una vera comprensione contestuale multisensoriale, capace di ragionare su diagrammi tecnici complessi, video di fenomeni fisici e documenti misti con una precisione che supera quella degli esperti umani in diversi domini specifici. Il modello sarà disponibile tramite API per sviluppatori a partire dal prossimo mese, con una struttura di prezzi a tier basata sull''utilizzo effettivo.',
  'Il nuovo modello dimostra capacità di ragionamento visivo-spaziale senza precedenti, superando i benchmark umani in diversi test cognitivi.',
  'Tecnologia', 'a0000001-0001-0001-0001-000000000001', 'The Verge', 'https://theverge.com/2026/7/openai-gpt6-launch', 94, 3, 'pending_approval'),

  ('b1000001-0001-0001-0001-000000000002',
  'Analisi approfondita — Regolamento UE sull''AI: entra in vigore la fase operativa completa',
  'Tutto quello che c''è da sapere sulle implicazioni di questa notizia per il futuro del settore',
  'Un nuovo capitolo si apre nel settore della politica. La nostra redazione AI ha raccolto e verificato le fonti principali per offrire un''analisi approfondita e affidabile di questa notizia di grande rilevanza.

L''Unione Europea ha ufficialmente attivato la fase operativa completa dell''AI Act, il primo quadro normativo al mondo sull''intelligenza artificiale. Le aziende tecnologiche operanti nel mercato europeo hanno ora 90 giorni per dimostrare la piena conformità con le disposizioni sulla trasparenza algoritmica, la documentazione tecnica e la gestione dei rischi. Il regolamento classifica i sistemi AI in quattro categorie di rischio, da inaccettabile a minimo, con requisiti proporzionalmente differenziati. Thierry Breton, Commissario europeo per il Mercato Interno, ha dichiarato che l''UE intende essere il riferimento globale per la governance dell''IA, e ha annunciato la creazione di un corpo di ispezione dedicato con oltre 200 esperti tecnici. Le sanzioni per le violazioni possono arrivare fino al 7% del fatturato globale annuo.',
  'Le aziende tech hanno ora 90 giorni per conformarsi alle nuove normative sulla trasparenza algoritmica.',
  'Politica', 'a0000001-0001-0001-0001-000000000002', 'Reuters Europa', 'https://reuters.com/eu/2026/07/ai-act-operative', 86, 3, 'pending_approval');

-- ============================================
-- Activity Logs
-- ============================================
INSERT INTO activity_logs (id, agent_id, action, detail, status, created_at) VALUES
  ('l0000001', 'a0000001-0001-0001-0001-000000000001', 'collecting', 'Raccolta automatica giornaliera per Tecnologia', 'success', NOW() - INTERVAL '3 days'),
  ('l0000002', 'a0000001-0001-0001-0001-000000000001', 'evaluating', 'Valutati 2 articoli, selezionati 1 per la riscrittura', 'success', NOW() - INTERVAL '3 days'),
  ('l0000003', 'a0000001-0001-0001-0001-000000000001', 'publishing', 'Pubblicato: Apple annuncia il nuovo chip M5', 'success', NOW() - INTERVAL '2 days 15 hours'),
  ('l0000004', 'a0000001-0001-0001-0001-000000000002', 'collecting', 'Raccolta automatica giornaliera per Politica', 'success', NOW() - INTERVAL '3 days'),
  ('l0000005', 'a0000001-0001-0001-0001-000000000002', 'evaluating', 'Valutati 3 articoli, selezionati 1 per la riscrittura', 'success', NOW() - INTERVAL '3 days'),
  ('l0000006', 'a0000001-0001-0001-0001-000000000002', 'publishing', 'Pubblicato: Summit G20 a Roma', 'success', NOW() - INTERVAL '1 day 8 hours'),
  ('l0000007', 'a0000001-0001-0001-0001-000000000003', 'collecting', 'Raccolta automatica giornaliera per Economia', 'success', NOW() - INTERVAL '3 days'),
  ('l0000008', 'a0000001-0001-0001-0001-000000000003', 'publishing', 'Pubblicato: Bitcoin supera i 250.000 dollari', 'success', NOW() - INTERVAL '3 hours'),
  ('l0000009', 'a0000001-0001-0001-0001-000000000004', 'collecting', 'Raccolta automatica giornaliera per Scienza', 'success', NOW() - INTERVAL '3 days'),
  ('l0000010', 'a0000001-0001-0001-0001-000000000004', 'publishing', 'Pubblicato: CERN annuncia nuova particella', 'success', NOW() - INTERVAL '5 hours'),
  ('l0000011', 'a0000001-0001-0001-0001-000000000005', 'collecting', 'Raccolta automatica giornaliera per Sport', 'success', NOW() - INTERVAL '3 days'),
  ('l0000012', 'a0000001-0001-0001-0001-000000000005', 'publishing', 'Pubblicato: Inter vince il quarto scudetto', 'success', NOW() - INTERVAL '1 day 2 hours'),
  ('l0000013', 'a0000001-0001-0001-0001-000000000006', 'collecting', 'Raccolta automatica giornaliera per Cultura', 'success', NOW() - INTERVAL '3 days'),
  ('l0000014', 'a0000001-0001-0001-0001-000000000006', 'publishing', 'Pubblicato: Biennale di Venezia Leone d''Oro', 'success', NOW() - INTERVAL '2 days 10 hours'),
  ('l0000015', 'a0000001-0001-0001-0001-000000000007', 'collecting', 'Raccolta automatica giornaliera per Salute', 'success', NOW() - INTERVAL '3 days'),
  ('l0000016', 'a0000001-0001-0001-0001-000000000007', 'publishing', 'Pubblicato: Vaccino mRNA universale influenza', 'success', NOW() - INTERVAL '4 days 1 hour'); 