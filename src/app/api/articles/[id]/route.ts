import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const article = await db.article.findUnique({
      where: { id },
      include: {
        agent: true,
        publishLogs: true,
        approvalLog: true,
      },
    });
    if (!article) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(article);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const article = await db.article.update({
      where: { id },
      data: body,
      include: { agent: true, publishLogs: true, approvalLog: true },
    });
    return Response.json(article);
  } catch (error) {
    return Response.json({ error: 'Failed to update article' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.article.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Failed to delete article' }, { status: 500 });
  }
}