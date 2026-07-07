import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { articleId, action, note } = await request.json();

    if (!articleId || !action) {
      return Response.json({ error: 'articleId and action required' }, { status: 400 });
    }

    const article = await db.article.findUnique({ where: { id: articleId } });
    if (!article) return Response.json({ error: 'Article not found' }, { status: 404 });

    // Create or update approval log
    await db.approvalLog.upsert({
      where: { articleId },
      create: {
        articleId,
        reviewerAction: action,
        reviewerNote: note || '',
        reviewedAt: new Date(),
      },
      update: {
        reviewerAction: action,
        reviewerNote: note || '',
        reviewedAt: new Date(),
      },
    });

    // Update article status
    const newStatus = action === 'approved' ? 'approved' : 'rejected';
    const updated = await db.article.update({
      where: { id: articleId },
      data: { status: newStatus },
      include: { agent: true, publishLogs: true, approvalLog: true },
    });

    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: 'Failed to process approval' }, { status: 500 });
  }
}