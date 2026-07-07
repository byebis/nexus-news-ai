import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { articleId, platforms } = await request.json();

    if (!articleId || !platforms || !Array.isArray(platforms)) {
      return Response.json({ error: 'articleId and platforms array required' }, { status: 400 });
    }

    const article = await db.article.findUnique({
      where: { id: articleId },
      include: { agent: true },
    });

    if (!article) return Response.json({ error: 'Article not found' }, { status: 404 });

    const platformsList = ['blog', 'twitter', 'facebook', 'linkedin', 'instagram'];

    // Create publish logs for each platform
    for (const platform of platforms) {
      if (!platformsList.includes(platform)) continue;

      // Simulate publishing with random success/failure
      const success = Math.random() > 0.15; // 85% success rate

      await db.publishLog.create({
        data: {
          articleId,
          platform,
          status: success ? 'published' : 'failed',
          postId: `post_${Date.now()}_${platform}`,
          postUrl: success ? `https://${platform}.com/post/${Date.now()}` : '',
          error: success ? '' : 'Timeout di connessione - ritentare',
          publishedAt: success ? new Date() : null,
        },
      });
    }

    // Mark article as published if at least one platform succeeded
    const logs = await db.publishLog.findMany({ where: { articleId } });
    const anyPublished = logs.some((l) => l.status === 'published');

    if (anyPublished) {
      await db.article.update({
        where: { id: articleId },
        data: { status: 'published', publishedAt: new Date() },
      });
    }

    const updatedArticle = await db.article.findUnique({
      where: { id: articleId },
      include: { agent: true, publishLogs: true, approvalLog: true },
    });

    return Response.json(updatedArticle);
  } catch (error) {
    return Response.json({ error: 'Failed to publish' }, { status: 500 });
  }
}