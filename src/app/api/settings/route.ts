import { db } from '@/lib/db';

export async function GET() {
  try {
    let settings = await db.settings.findFirst();
    if (!settings) {
      settings = await db.settings.create({
        data: {
          mode: 'semi_autonomous',
          autoCollect: true,
          autoEvaluate: true,
          autoRewrite: true,
          autoPublish: false,
          collectInterval: 3600,
          maxArticlesPerDay: 10,
          socialPlatforms: 'blog,twitter,facebook,linkedin,instagram',
          siteName: 'Nexus News AI',
          siteTagline: 'Il giornale di nuova generazione',
        },
      });
    }
    return Response.json(settings);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    let settings = await db.settings.findFirst();

    if (!settings) {
      settings = await db.settings.create({ data: body });
    } else {
      settings = await db.settings.update({
        where: { id: settings.id },
        data: body,
      });
    }

    return Response.json(settings);
  } catch (error) {
    return Response.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}