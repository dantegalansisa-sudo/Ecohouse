import { useSyncExternalStore } from 'react';

// Estado persistente en localStorage, sincronizado entre pestañas (sitio ↔ panel).
export function createStore<T>(key: string, initial: T) {
  let value: T = initial;
  try {
    const raw = localStorage.getItem(key);
    if (raw) value = JSON.parse(raw);
  } catch {
    /* sin almacenamiento: queda en memoria */
  }
  const listeners = new Set<() => void>();

  const set = (next: T | ((prev: T) => T)) => {
    value = typeof next === 'function' ? (next as (p: T) => T)(value) : next;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* cuota llena o bloqueado */
    }
    listeners.forEach((l) => l());
  };

  window.addEventListener('storage', (e) => {
    if (e.key !== key || !e.newValue) return;
    try {
      value = JSON.parse(e.newValue);
      listeners.forEach((l) => l());
    } catch {
      /* ignorar */
    }
  });

  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };

  return {
    get: () => value,
    set,
    use: () => useSyncExternalStore(subscribe, () => value),
  };
}
