'use client';

import { create } from 'zustand';

const STORAGE_KEY = 'nexus_bookmarks';

function loadInitial(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

interface BookmarksStore {
  ids: string[];
  hydrated: boolean;
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  hydrate: () => void;
}

export const useBookmarks = create<BookmarksStore>((set, get) => ({
  ids: [],
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    set({ ids: loadInitial(), hydrated: true });
  },
  toggle: (id) => {
    const current = get().ids;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    set({ ids: next });
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage pieno o non disponibile
    }
  },
  has: (id) => get().ids.includes(id),
}));
