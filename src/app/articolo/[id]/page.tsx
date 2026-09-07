import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchArticleById, fetchArticles, getArticleViews } from '@/lib/api';
import { CATEGORY_META } from '@/lib/categories';
import { ArticleCover } from '@/components/magazine/ArticleCover';
import { ShareButtons } from '@/components/magazine/ShareButtons';
import BookmarkButton from '@/components/magazine/BookmarkButton';
import ViewTracker from '@/components/magazine/ViewTracker';
import AiDebate from '@/components/magazine/AiDebate';
import ReaderShell from '@/components/magazine/ReaderShell';
import { ArrowLeft, Clock, ShieldCheck, User, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ArticleCard from '@/components/magazine/ArticleCard';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const article = await fetchArticleById(id);
    if (!article) return { title: 'Articolo non trovato — Nexus News AI' };
    const title = article.title;
    const description = article.summary || article.subtitle || article.content.slice(0, 155);
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        publishedTime: article.publishedAt || article.createdAt,
        authors: [article.agent?.name || 'Nexus News AI'],
      },
      twitter: { card: 'summary_large_image', title, description },
    };
  } catch {
    return { title: 'Articolo — Nexus News AI' };
  }
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const article = await fetchArticleById(id);
  if (!article || article.status === 'pending_approval' || article.status === 'rejected') notFound();

  const related = (await fetchArticles({ category: article.category, status: 'published', limit: 4 }))
    .filter((a) => a.id !== article.id)
    .slice(0, 3);

  const views = await getArticleViews(article.id);

  const meta = CATEGORY_META[article.category] || CATEGORY_META.default;
  const dateStr = new Date(article.publishedAt || article.createdAt).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const paragraphs = (article.content || '').split(/\n+/).filter((p) => p.trim().length > 0);
  const plainText = [
    article.title,
    article.subtitle || '',
    article.content || article.summary || '',
  ].join('. ').replace(/\s+/g, ' ').trim();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <ViewTracker articleId={article.id} />
      <main className="flex-1">
        <article>
          {/* Cover */}
          <div className="relative h-[38vh] min-h-[260px] w-full overflow-hidden">
            <ArticleCover category={article.category} seed={article.id} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0">
              <div className="mx-auto max-w-3xl px-4 pb-6">
                <Link
                  href="/"
                  className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Torna al magazine
                </Link>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={meta.badgeClass} variant="secondary">
                    <span className="mr-1">{meta.emoji}</span>{article.category}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" /> Qualità {article.qualityScore}%
                  </Badge>
                  {views > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <Eye className="h-3 w-3 text-orange-500" /> {views} letture
                    </Badge>
                  )}
                </div>
                <h1 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                  {article.title}
                </h1>
                {article.subtitle && (
                  <p className="mt-3 text-lg text-muted-foreground">{article.subtitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="mx-auto max-w-3xl px-4">
            <div className="flex items-center justify-between flex-wrap gap-3 py-5 border-b">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="font-medium text-foreground">{article.agent?.name || 'AI Agent'}</span>
                </span>
                <span>·</span>
                <span>{dateStr}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {article.readTime} min</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {views} letture</span>
              </div>
              <div className="flex items-center gap-2">
                <BookmarkButton articleId={article.id} />
                <ShareButtons title={article.title} />
              </div>
            </div>

            <ReaderShell text={plainText}>
              <div className="py-8 space-y-6 leading-relaxed">
                {paragraphs.length > 0 ? (
                  paragraphs.map((p, i) => (
                    <p key={i} className={i === 0 ? 'text-[1.25em] font-medium text-foreground/90 first-letter:text-5xl first-letter:font-extrabold first-letter:mr-2 first-letter:float-left first-letter:leading-[0.9]' : ''}>
                      {p}
                    </p>
                  ))
                ) : (
                  <p className="text-muted-foreground">{article.summary}</p>
                )}
              </div>
            </ReaderShell>

            {/* Il Chiosco — dibattito AI sulla pagina */}
            <AiDebate articleId={article.id} />

            {/* Source attribution */}
            {article.sourceUrl && (
              <div className="my-8 rounded-xl border bg-muted/40 p-4 text-sm">
                <span className="font-medium">Fonte originale: </span>
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4 hover:opacity-80"
                >
                  {article.sourceName || article.sourceUrl}
                </a>
                <p className="mt-1 text-xs text-muted-foreground">
                  Articolo riscritto e rielaborato da {article.agent?.name || 'agente AI'} di Nexus News AI con un point of view editoriale originale.
                </p>
              </div>
            )}
          </div>
        </article>

        {/* Related */}
        {related.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12 border-t">
            <h2 className="text-2xl font-bold mb-6">Altri articoli di {article.category}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {related.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
