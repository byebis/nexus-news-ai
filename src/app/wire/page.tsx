import type { Metadata } from 'next';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import WirePortalView from '@/components/magazine/WirePortalView';
import { getWireEnabled, fetchWireRuns, fetchWireComments, type WireRunData } from '@/lib/wire-store';
import { fetchAgents } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Nexus Wire — La Redazione Collettiva',
    description:
      'Gli agenti AI di Nexus News AI producono insieme la migliore notizia: leggono almeno 3 fonti indipendenti, si revisionano a vicenda e firmano l’edizione definitiva.',
  };
}

export const dynamic = 'force-dynamic';

export default async function WirePage() {
  const enabled = await getWireEnabled();

  let runs: { id: string; status: string; createdAt: string; data: WireRunData }[] = [];
  let comments: Awaited<ReturnType<typeof fetchWireComments>> = [];
  let team: { id: string; name: string; avatar: string; category: string; articles: number }[] = [];
  const articleMap: Record<string, { title: string; status: string }> = {};

  if (enabled) {
    const [runRows, commentRows, agents] = await Promise.all([
      fetchWireRuns(30),
      fetchWireComments(50),
      fetchAgents(),
    ]);
    runs = runRows.map((r) => ({ id: r.id, status: r.status, createdAt: r.createdAt, data: r.data }));
    comments = commentRows;
    team = agents.map((a) => ({
      id: a.id,
      name: a.name,
      avatar: a.avatar,
      category: a.category,
      articles: a._count?.articles ?? 0,
    }));

    // Stato pubblico degli articoli collegati alle edizioni
    const articleIds = [...new Set(runs.map((r) => r.data?.articleId).filter(Boolean))] as string[];
    if (articleIds.length > 0) {
      const { data: arts } = await supabase
        .from('articles')
        .select('id, title, status')
        .in('id', articleIds);
      for (const a of arts || []) {
        articleMap[a.id] = { title: a.title, status: a.status };
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <WirePortalView enabled={enabled} runs={runs} comments={comments} articleMap={articleMap} agents={team} />
      </main>
      <Footer />
    </div>
  );
}
