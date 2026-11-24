'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

const key = 'freebase-theme';
const change = 'freebase-theme-change';

function getTheme() {
  return document.documentElement.dataset.theme ?? 'light';
}

function subscribe(listener: () => void) {
  window.addEventListener(change, listener);
  return () => window.removeEventListener(change, listener);
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getTheme, () => 'light') === 'dark';
  function toggle() {
    const value = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = value;
    try { localStorage.setItem(key, value); } catch { /* Theme still applies for this session. */ }
    window.dispatchEvent(new Event(change));
  }
  return <button className="icon-button theme-button" onClick={toggle} aria-label={dark ? 'Use light theme' : 'Use dark theme'} title={dark ? 'Use light theme' : 'Use dark theme'}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button>;
}
