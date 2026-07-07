import { db } from '@/lib/db';
import { processCategoryForAgent } from '@/lib/ai-engine';

export async function POST(request: Request) {
  try {
    const { agentId } = await request.json();

    if (!agentId) {
      return Response.json({ error: 'agentId required' }, { status: 400 });
    }

    const agent = await db.agent.findUnique({ where: { id: agentId } });
    if (!agent) return Response.json({ error: 'Agent not found' }, { status: 404 });

    // Get settings for mode
    const settings = await db.settings.findFirst();
    const isFullyAutonomous = settings?.mode === 'fully_autonomous';

    // Log activity: collecting
    await db.activityLog.create({
      data: {
        agentId,
        action: 'collecting',
        detail: `Inizio raccolta notizie per la categoria ${agent.category}...`,
        status: 'info',
      },
    });

    // Process news with AI engine
    const result = processCategoryForAgent(agent.category);

    // Log activity: evaluating
    await db.activityLog.create({
      data: {
        agentId,
        action: 'evaluating',
        detail: `Raccolti ${result.collected} articoli, valutati ${result.evaluated}, selezionati ${result.rewritten} per la riscrittura`,
        status: 'success',
      },
    });

    const createdArticles = [];

    for (const article of result.articles) {
      // Determine initial status based on mode
      const initialStatus = isFullyAutonomous ? 'approved' : 'pending_approval';

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
          qualityScore: article.qualityScore,
          readTime: article.readTime,
          status: initialStatus,
        },
        include: { agent: true },
      });

      // If fully autonomous, auto-approve
      if (isFullyAutonomous) {
        await db.approvalLog.create({
          data: {
            articleId: created.id,
            reviewerAction: 'approved',
            reviewerNote: 'Approvazione automatica - modalità completamente autonoma',
            reviewedAt: new Date(),
          },
        });
      }

      createdArticles.push(created);
    }

    // Log activity: rewriting complete
    await db.activityLog.create({
      data: {
        agentId,
        action: 'rewriting',
        detail: `${result.rewritten} articoli riscritti e pronti per la pubblicazione`,
        status: 'success',
      },
    });

    // Update agent last run
    await db.agent.update({
      where: { id: agentId },
      data: { lastRun: new Date() },
    });

    return Response.json({
      success: true,
      collected: result.collected,
      evaluated: result.evaluated,
      created: result.rewritten,
      articles: createdArticles,
      mode: isFullyAutonomous ? 'fully_autonomous' : 'semi_autonomous',
    });
  } catch (error) {
    return Response.json({ error: 'Failed to collect news' }, { status: 500 });
  }
}