import { fetchSettings, updateSettings } from '@/lib/api';

export async function GET() {
  try {
    let settings = await fetchSettings();
    if (!settings) {
      // Create default settings
      settings = await updateSettings({
        mode: 'semi_autonomous',
        auto_collect: true,
        auto_evaluate: true,
        auto_rewrite: true,
        auto_publish: false,
        collect_interval: 60,
        max_articles_per_day: 10,
        social_platforms: 'blog,twitter,facebook,linkedin,instagram',
        site_name: 'Nexus News AI',
        site_tagline: 'Il giornale di nuova generazione',
      });
    }
    return Response.json(settings);
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return Response.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    // Convert camelCase to snake_case for Supabase
    const data: Record<string, unknown> = {};
    if (body.mode !== undefined) data.mode = body.mode;
    if (body.autoCollect !== undefined) data.auto_collect = body.autoCollect;
    if (body.autoEvaluate !== undefined) data.auto_evaluate = body.autoEvaluate;
    if (body.autoRewrite !== undefined) data.auto_rewrite = body.autoRewrite;
    if (body.autoPublish !== undefined) data.auto_publish = body.autoPublish;
    if (body.collectInterval !== undefined) data.collect_interval = body.collectInterval;
    if (body.maxArticlesPerDay !== undefined) data.max_articles_per_day = body.maxArticlesPerDay;
    if (body.socialPlatforms !== undefined) data.social_platforms = body.socialPlatforms;
    if (body.siteName !== undefined) data.site_name = body.siteName;
    if (body.siteTagline !== undefined) data.site_tagline = body.siteTagline;

    const settings = await updateSettings(data);
    return Response.json(settings);
  } catch (error) {
    console.error('PUT /api/settings error:', error);
    return Response.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}