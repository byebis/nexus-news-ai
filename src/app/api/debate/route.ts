import { supabase } from '@/lib/supabase';
import { chatWithFallback, extractJSON } from '@/lib/openrouter';

interface DebateComment {
  agent: string;
  avatar: string;
  category: string;
  text: string;
  vote: number;
}

function repairJsonParse(raw: string): { comments: DebateComment[] } | null {
  try {
    return JSON.parse(raw);
  } catch {
    // fallback: rimuovi trailing commas
    try {
      return JSON.parse(raw.replace(/,\s*([}\]])/g, '$1'));
    } catch {
      return null;
    }
  }
}

async function getCachedDebate(articleId: string): Promise<DebateComment[] | null> {
  const { data } = await supabase
    .from('activity_logs')
    .select('detail')
    .eq('action', `ai_debate_${articleId}`)
    .order('created_at', { ascending: false })
    .limit(1);
  if (!data || data.length === 0) return null;
  try {
    const parsed = JSON.parse(data[0].detail);
    if (Array.isArray(parsed?.comments) && parsed.comments.length > 0) return parsed.comments;
  } catch {
    // cache corrotta: rigenera
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');
    if (!articleId) {
      return Response.json({ error: 'articleId required' }, { status: 400 });
    }

    // Cache hit?
    const cached = await getCachedDebate(articleId);
    if (cached) {
      return Response.json({ comments: cached, cached: true });
    }

    // Carica articolo + agenti
    const { data: article } = await supabase
      .from('articles')
      .select('id, title, summary, content, category, agent_id, agent:agents(id, name, avatar, category)')
      .eq('id', articleId)
      .single();
    if (!article) {
      return Response.json({ error: 'Article not found' }, { status: 404 });
    }

    const { data: agents } = await supabase
      .from('agents')
      .select('id, name, avatar, category, personality')
      .eq('status', 'active');
    if (!agents || agents.length === 0) {
      return Response.json({ comments: [], cached: false });
    }

    // Scegli fino a 3 agenti di categorie diverse da quella dell'articolo
    const artCat = (article as { category: string }).category?.toLowerCase() || '';
    const diverse = agents.filter((a) => a.category?.toLowerCase() !== artCat);
    const chosen = (diverse.length >= 3 ? diverse : agents).slice(0, 3);
    const roster = chosen
      .map((a) => `- ${a.name} (${a.category}, stile: "${a.personality?.slice(0, 80)}")`)
      .join('\n');

    const content = (article as { content: string }).content || '';
    const articleDigest = `${(article as { title: string }).title}\n\n${content.slice(0, 2200)}`;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.length < 10) {
      return Response.json({ error: 'API key non configurata' }, { status: 500 });
    }

    const result = await chatWithFallback(
      [
        {
          role: 'system',
          content:
            'Sei il moderatore del "Chiosco", la rubrica in cui i giornalisti AI di Nexus News AI commentano gli articoli dei colleghi. Rispondi SOLO con JSON valido, senza testo prima o dopo, in italiano.',
        },
        {
          role: 'user',
          content: `Articolo della redazione da commentare:\n"""${articleDigest}"""\n\nGiornalisti AI che commentano:\n${roster}\n\nOgni giornalista scrive un commento di 2-3 frasi dalla prospettiva della sua categoria, con un punto di vista personale e costruttivo (anche critico o curioso, mai banale), MASSIMO 320 caratteri per commento, e dà un voto di qualità 0-100 all'articolo.\n\nFormato risposta (SOLO JSON):\n{"comments":[{"agent":"Nome","category":"Categoria","text":"...","vote":85}]}`,
        },
      ],
      'evaluate',
      apiKey
    );

    if (!result.success || !result.response) {
      return Response.json({ comments: [], cached: false, error: 'AI unavailable' });
    }

    const parsed = repairJsonParse(extractJSON(result.response.content));
    const rawComments = parsed?.comments;

    if (!Array.isArray(rawComments) || rawComments.length === 0) {
      return Response.json({ comments: [], cached: false });
    }

    const comments: DebateComment[] = rawComments.slice(0, 4).map((c) => {
      const found = chosen.find((a) => a.name.toLowerCase() === (c.agent || '').toLowerCase());
      return {
        agent: found?.name || c.agent || 'AI Agent',
        avatar: found?.avatar || '🤖',
        category: found?.category || c.category || 'Redazione',
        text: String(c.text || '').slice(0, 700),
        vote: Math.max(0, Math.min(100, Number(c.vote) || 75)),
      };
    }).filter((c) => c.text.length > 10);

    if (comments.length === 0) {
      return Response.json({ comments: [], cached: false });
    }

    // Salva in cache
    await supabase.from('activity_logs').insert({
      agent_id: (article as { agent_id: string }).agent_id || chosen[0].id,
      action: `ai_debate_${articleId}`.slice(0, 60),
      detail: JSON.stringify({ comments }),
      status: 'success',
    });

    return Response.json({ comments, cached: false });
  } catch (error) {
    console.error('GET /api/debate error:', error);
    return Response.json({ comments: [], error: 'Failed to generate debate' }, { status: 500 });
  }
}
