// Category visual metadata: emoji, colors, gradients (shared across magazine + admin)

export interface CategoryMeta {
  emoji: string;
  gradient: string;
  badgeClass: string;
  accent: string;
}

export interface CategoryDef {
  name: string;
  slug: string;
  labelKey: string;
  descKey: string;
}

/** Canonical category list: DB name, URL slug, i18n label + description keys */
export const CATEGORY_DEFS: CategoryDef[] = [
  { name: 'Tecnologia', slug: 'tecnologia', labelKey: 'catTechnology', descKey: 'catDescTechnology' },
  { name: 'Politica', slug: 'politica', labelKey: 'catPolitics', descKey: 'catDescPolitics' },
  { name: 'Economia', slug: 'economia', labelKey: 'catEconomy', descKey: 'catDescEconomy' },
  { name: 'Scienza', slug: 'scienza', labelKey: 'catScience', descKey: 'catDescScience' },
  { name: 'Sport', slug: 'sport', labelKey: 'catSport', descKey: 'catDescSport' },
  { name: 'Cultura', slug: 'cultura', labelKey: 'catCulture', descKey: 'catDescCulture' },
  { name: 'Salute', slug: 'salute', labelKey: 'catHealth', descKey: 'catDescHealth' },
];

/** URL-safe slug for a DB category name (lowercase, ascii-safe) */
export function slugForCategory(name: string): string {
  return (name || '').toLowerCase().trim();
}

/** Category definition by URL slug */
export function categoryBySlug(slug: string): CategoryDef | undefined {
  return CATEGORY_DEFS.find((c) => c.slug === (slug || '').toLowerCase());
}

export const CATEGORIES = [
  'Tecnologia',
  'Politica',
  'Economia',
  'Scienza',
  'Sport',
  'Cultura',
  'Salute',
] as const;

export const CATEGORY_META: Record<string, CategoryMeta> = {
  Tecnologia: {
    emoji: '💻',
    gradient: 'from-cyan-500 via-teal-500 to-emerald-600',
    badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
    accent: '#06b6d4',
  },
  Politica: {
    emoji: '🏛️',
    gradient: 'from-indigo-500 via-purple-500 to-fuchsia-600',
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    accent: '#6366f1',
  },
  Economia: {
    emoji: '📈',
    gradient: 'from-amber-500 via-orange-500 to-red-600',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    accent: '#f59e0b',
  },
  Scienza: {
    emoji: '🔬',
    gradient: 'from-blue-500 via-indigo-500 to-violet-600',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    accent: '#3b82f6',
  },
  Sport: {
    emoji: '⚽',
    gradient: 'from-green-500 via-emerald-500 to-teal-600',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    accent: '#22c55e',
  },
  Cultura: {
    emoji: '🎭',
    gradient: 'from-rose-500 via-pink-500 to-purple-600',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    accent: '#f43f5e',
  },
  Salute: {
    emoji: '🏥',
    gradient: 'from-sky-500 via-cyan-500 to-blue-600',
    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    accent: '#0ea5e9',
  },
  default: {
    emoji: '📰',
    gradient: 'from-slate-600 via-slate-700 to-slate-900',
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300',
    accent: '#64748b',
  },
};
