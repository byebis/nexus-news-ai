import { db } from '@/lib/db';

const AGENT_CATEGORIES = [
  {
    name: 'TechBot',
    avatar: '🤖',
    category: 'Tecnologia',
    description: 'Specialista in innovazione tecnologica, AI, startup e digital transformation',
    personality: 'Analitico e orientato all\'impatto pratico per lettori tech-savvy',
  },
  {
    name: 'PolicyWatch',
    avatar: '🏛️',
    category: 'Politica',
    description: 'Esperto di politica italiana, europea e internazionale con analisi geopolitica',
    personality: 'Equilibrato e obiettivo con contesto storico e geopolitico approfondito',
  },
  {
    name: 'MarketPulse',
    avatar: '📊',
    category: 'Economia',
    description: 'Analista finanziario specializzato in mercati, investimenti e politica monetaria',
    personality: 'Rigoroso ma accessibile con dati concreti e implicazioni per investitori',
  },
  {
    name: 'SciExplorer',
    avatar: '🔬',
    category: 'Scienza',
    description: 'Divulgatore scientifico con focus su scoperte, ricerca e innovazione',
    personality: 'Divulgativo ma preciso, con spiegazioni chiare per un pubblico colto',
  },
  {
    name: 'SportArena',
    avatar: '⚽',
    category: 'Sport',
    description: 'Giornalista sportivo con copertura di calcio, olimpiadi e sport emergenti',
    personality: 'Emozionante e narrativo con statistiche e analisi tattiche',
  },
  {
    name: 'CultureHub',
    avatar: '🎨',
    category: 'Cultura',
    description: 'Critico e recensore nel mondo dell\'arte, cinema, musica e letteratura',
    personality: 'Elegante e riflessivo con riferimenti storici e artistici',
  },
  {
    name: 'HealthDesk',
    avatar: '🏥',
    category: 'Salute',
    description: 'Giornalista sanitario specializzato in medicina, benessere e ricerca clinica',
    personality: 'Rassicurante e basato su evidenze scientifiche con consigli pratici',
  },
];

const IMAGE_SEEDS = [
  'technology-ai-chip', 'politics-parliament', 'economy-trading',
  'science-laboratory', 'sports-stadium', 'culture-museum', 'health-hospital',
];

async function seed() {
  console.log('🌱 Seeding Nexus News AI database...');

  // Clean existing data
  await db.publishLog.deleteMany();
  await db.approvalLog.deleteMany();
  await db.activityLog.deleteMany();
  await db.article.deleteMany();
  await db.agent.deleteMany();
  await db.settings.deleteMany();

  // Create agents
  console.log('  Creating agents...');
  const agents = [];
  for (const agentData of AGENT_CATEGORIES) {
    const agent = await db.agent.create({ data: agentData });
    agents.push(agent);
    console.log(`    ✓ ${agent.name} (${agent.category})`);
  }

  // Create settings
  console.log('  Creating settings...');
  await db.settings.create({
    data: {
      mode: 'semi_autonomous',
      autoCollect: true,
      autoEvaluate: true,
      autoRewrite: true,
      autoPublish: false,
      collectInterval: 60,
      maxArticlesPerDay: 10,
      socialPlatforms: 'blog,twitter,facebook,linkedin,instagram',
      siteName: 'Nexus News AI',
      siteTagline: 'Il giornale di nuova generazione, scritto da intelligenze artificiali',
    },
  });

  // Create some sample published articles with activity logs
  console.log('  Creating sample articles and activity logs...');

  const { processCategoryForAgent } = await import('../src/lib/ai-engine');

  for (const agent of agents) {
    // Log collection activity
    await db.activityLog.create({
      data: {
        agentId: agent.id,
        action: 'collecting',
        detail: `Raccolta automatica giornaliera per ${agent.category}`,
        status: 'success',
      },
    });

    // Process one batch
    const result = processCategoryForAgent(agent.category);

    for (const article of result.articles.slice(0, 1)) {
      const created = await db.article.create({
        data: {
          title: article.title,
          subtitle: article.subtitle,
          content: article.content,
          summary: article.summary,
          category: article.category,
          agentId: agent.id,
          sourceName: article.sourceName,
          sourceUrl: article.sourceUrl,
          imageUrl: '',
          qualityScore: article.qualityScore,
          readTime: article.readTime,
          status: 'published',
          publishedAt: new Date(Date.now() - Math.random() * 86400000 * 3),
        },
      });

      // Create approval log
      await db.approvalLog.create({
        data: {
          articleId: created.id,
          reviewerAction: 'approved',
          reviewerNote: 'Notizia verificata e approvata dalla redazione',
          reviewedAt: new Date(Date.now() - Math.random() * 86400000 * 2),
        },
      });

      // Create publish logs for all platforms
      const platforms = ['blog', 'twitter', 'facebook', 'linkedin', 'instagram'];
      for (const platform of platforms) {
        const success = Math.random() > 0.1;
        await db.publishLog.create({
          data: {
            articleId: created.id,
            platform,
            status: success ? 'published' : 'failed',
            postId: `post_${Math.random().toString(36).slice(2, 10)}`,
            postUrl: success ? `https://${platform}.com/nexusnews/${created.id.slice(0, 8)}` : '',
            error: success ? '' : 'Timeout di connessione',
            publishedAt: success ? created.publishedAt : null,
          },
        });
      }

      await db.activityLog.create({
        data: {
          agentId: agent.id,
          action: 'publishing',
          detail: `Pubblicato: "${article.title.slice(0, 50)}..." su tutte le piattaforme`,
          status: 'success',
        },
      });
    }

    // Log evaluation
    await db.activityLog.create({
      data: {
        agentId: agent.id,
        action: 'evaluating',
        detail: `Valutati ${result.evaluated} articoli, selezionati ${result.rewritten}`,
        status: 'success',
      },
    });
  }

  // Create a couple of pending approval articles
  console.log('  Creating pending approval articles...');
  const techAgent = agents.find(a => a.category === 'Tecnologia')!;
  const polAgent = agents.find(a => a.category === 'Politica')!;

  const pendingResult1 = processCategoryForAgent('Tecnologia');
  if (pendingResult1.articles[0]) {
    const a = pendingResult1.articles[0];
    await db.article.create({
      data: {
        title: a.title,
        subtitle: a.subtitle,
        content: a.content,
        summary: a.summary,
        category: 'Tecnologia',
        agentId: techAgent.id,
        sourceName: a.sourceName,
        sourceUrl: a.sourceUrl,
        qualityScore: a.qualityScore,
        readTime: a.readTime,
        status: 'pending_approval',
      },
    });
  }

  const pendingResult2 = processCategoryForAgent('Politica');
  if (pendingResult2.articles[0]) {
    const a = pendingResult2.articles[0];
    await db.article.create({
      data: {
        title: a.title,
        subtitle: a.subtitle,
        content: a.content,
        summary: a.summary,
        category: 'Politica',
        agentId: polAgent.id,
        sourceName: a.sourceName,
        sourceUrl: a.sourceUrl,
        qualityScore: a.qualityScore,
        readTime: a.readTime,
        status: 'pending_approval',
      },
    });
  }

  console.log('\n✅ Database seeded successfully!');
  console.log(`   ${agents.length} agents created`);
  console.log(`   Articles: published + pending approval`);
  console.log('   Activity logs generated');
  console.log('   Settings configured (semi-autonomous mode)');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });