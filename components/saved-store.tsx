'use client';

import { useSyncExternalStore } from 'react';
import { Bookmark } from 'lucide-react';

const storageKey = 'freebase-bookmarks-v1';
const eventName = 'freebase-bookmarks-change';
const empty: readonly string[] = [];
let lastRaw: string | null = null;
let bookmarks: readonly string[] = empty;
let sessionOnly = false;

function getBookmarks() {
  if (sessionOnly) return bookmarks;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw !== lastRaw) {
      const parsed: unknown = JSON.parse(raw ?? '[]');
      bookmarks = Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : empty;
      lastRaw = raw;
    }
  } catch {
    return bookmarks;
  }
  return bookmarks;
}

function subscribe(listener: () => void) {
  function storageChange(event: StorageEvent) {
    if (event.key === storageKey || event.key === null) listener();
  }
  window.addEventListener(eventName, listener);
  window.addEventListener('storage', storageChange);
  return () => {
    window.removeEventListener(eventName, listener);
    window.removeEventListener('storage', storageChange);
  };
}

export function useBookmarks() {
  return useSyncExternalStore(subscribe, getBookmarks, () => empty);
}

function toggleBookmark(slug: string) {
  const current = getBookmarks();
  const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
  saveBookmarks(next);
}

function saveBookmarks(next: readonly string[]) {
  try {
    const raw = JSON.stringify(next);
    localStorage.setItem(storageKey, raw);
    lastRaw = raw;
  } catch {
    sessionOnly = true;
  }
  bookmarks = next;
  window.dispatchEvent(new Event(eventName));
}

export function migrateBookmarks(legacySlugs: Record<string, string>) {
  try {
    if (localStorage.getItem('freebase-bookmarks-migrated')) return;
    const legacy: unknown = JSON.parse(localStorage.getItem('freebase-saved') ?? '[]');
    if (Array.isArray(legacy)) {
      const matches = legacy.flatMap((key) => typeof key === 'string' && Object.hasOwn(legacySlugs, key) ? [legacySlugs[key]] : []);
      if (matches.length) saveBookmarks([...new Set([...getBookmarks(), ...matches])]);
    }
    localStorage.setItem('freebase-bookmarks-migrated', '1');
  } catch {
    // A bad or inaccessible legacy value should not affect new saves.
  }
}

export function SaveButton({ slug, name, labeled = false }: { slug: string; name: string; labeled?: boolean }) {
  const saved = useBookmarks().includes(slug);
  return (
    <button className={labeled ? 'button save-button' : 'icon-button save-button'} aria-pressed={saved} aria-label={`Save ${name}`} title={saved ? 'Remove from saved' : 'Save resource'} onClick={() => toggleBookmark(slug)}>
      <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />{labeled && (saved ? 'Saved' : 'Save')}
    </button>
  );
}
