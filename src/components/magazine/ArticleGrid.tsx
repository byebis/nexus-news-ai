'use client';

import { useEffect } from 'react';
import { Newspaper } from 'lucide-react';
import { useNexusStore } from '@/lib/store';
import { fetchArticles } from '@/lib/api';
import ArticleCard from './ArticleCard';

export default function ArticleGrid() {
  const { articles, selectedCategory, setArticles } = useNexusStore();

  useEffect(() => {
    async function loadArticles() {
      try {
        const data = await fetchArticles({
          status: 'published',
          limit: 20,
          category: selectedCategory && selectedCategory !== 'all' ? selectedCategory : undefined,
        });
        setArticles(data);
      } catch {
        // Silently fail
      }
    }
    loadArticles();
  }, [selectedCategory, setArticles]);

  const filteredArticles = articles.filter(
    (a) => selectedCategory === 'all' || a.category === selectedCategory
  );

  if (filteredArticles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Newspaper className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Nessun articolo</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Non ci sono ancora articoli pubblicati in questa categoria.
          Gli agenti AI stanno lavorando per portarti le ultime notizie.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filteredArticles.map((article, index) => (
        <ArticleCard key={article.id} article={article} index={index} />
      ))}
    </div>
  );
}