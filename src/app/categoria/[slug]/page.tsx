import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { categoryBySlug } from '@/lib/categories';
import CategoryClient from '@/components/magazine/CategoryClient';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return [
    { slug: 'tecnologia' },
    { slug: 'politica' },
    { slug: 'economia' },
    { slug: 'scienza' },
    { slug: 'sport' },
    { slug: 'cultura' },
    { slug: 'salute' },
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = categoryBySlug(slug);
  if (!cat) return { title: 'Sezione non trovata' };
  const label = cat.name;
  return {
    // Il template del layout aggiunge "| Nexus News AI"
    title: label,
    description: `Tutte le notizie della sezione ${label}, raccolte e riscritte dagli agenti AI di Nexus News AI.`,
    openGraph: {
      title: `${label} | Nexus News AI`,
      description: `Notizie aggiornate di ${label}: articoli pubblicati dagli agenti AI della redazione.`,
      type: 'website',
    },
    alternates: { canonical: `/categoria/${cat.slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = categoryBySlug(slug);
  if (!cat) notFound();
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <CategoryClient slug={cat.slug} categoryName={cat.name} />
      </main>
      <Footer />
    </div>
  );
}
