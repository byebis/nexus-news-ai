'use client';

import { create } from 'zustand';

/**
 * usePersonalization — Level 8 "giornale su misura":
 * 1. favorites:  categorie preferite dell'utente (chip ⭐, localStorage)
 * 2. history:    ultimi articoli letti ("Continua a leggere", localStorage)
 * Nessun backend: tutto locale, hydration-safe (SSR non esplode).
 */

const FAV_KEY = 'nexus_fav_categories';
const HIST_KEY = 'nexus_read_history';
const HIST_MAX = 8;

export interface HistoryEntry {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  ts: number;
}

function load<T>(key: string, validate: (v: unknown) => T | null): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return validate(JSON.parse(raw));
  } catch {
    return null;
  }
}

function loadFavorites(): string[] {
  return (
    load<string[]>(FAV_KEY, (v) =>
      Array.isArray(v) ? v.filter((x) => typeof x === 'string') : null,
    ) || []
  );
}

function loadHistory(): HistoryEntry[] {
  return (
    load<HistoryEntry[]>(HIST_KEY, (v) =>
      Array.isArray(v)
        ? v
            .filter(
              (x) =>
                x &&
                typeof x.id === 'string' &&
                typeof x.title === 'string',
            )
            .slice(0, HIST_MAX)
        : null,
    ) || []
  );
}

interface PersonalizationStore {
  favorites: string[];
  history: HistoryEntry[];
  hydrated: boolean;

  hydrate: () => void;
  toggleFavorite: (category: string) => void;
  isFavorite: (category: string) => boolean;
  pushHistory: (entry: Omit<HistoryEntry, 'ts'>) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
}

export const usePersonalization = create<PersonalizationStore>((set, get) => ({
  favorites: [],
  history: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ favorites: loadFavorites(), history: loadHistory(), hydrated: true });
  },

  toggleFavorite: (category) => {
    const current = get().favorites;
    const next = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category].slice(0, 7);
    set({ favorites: next });
    try {
      window.localStorage.setItem(FAV_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile
    }
  },

  isFavorite: (category) => get().favorites.includes(category),

  pushHistory: (entry) => {
    const current = get().history.filter((h) => h.id !== entry.id);
    const next = [{ ...entry, ts: Date.now() }, ...current].slice(0, HIST_MAX);
    set({ history: next });
    try {
      window.localStorage.setItem(HIST_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile
    }
  },

  removeHistory: (id) => {
    const next = get().history.filter((h) => h.id !== id);
    set({ history: next });
    try {
      window.localStorage.setItem(HIST_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile
    }
  },

  clearHistory: () => {
    set({ history: [] });
    try {
      window.localStorage.removeItem(HIST_KEY);
    } catch {
      // storage non disponibile
    }
  },
}));
