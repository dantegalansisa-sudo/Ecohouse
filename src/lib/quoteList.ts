import { createStore } from './createStore';

// Productos que el visitante marca en la tienda para incluir en su cotización
export const quoteList = createStore<string[]>('eh-quote-list', []);
export const toggleQuote = (id: string) =>
  quoteList.set((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
