// Utilidades del servidor (funciones de Vercel). La clave de OpenAI vive solo aquí, en process.env.

export interface Req {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}
export interface Res {
  status(code: number): Res;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
}

export const MODEL = process.env.OPENAI_MODEL || 'gpt-5.4-mini';

// Supabase de la demo: URL y clave pública (protegida por RLS; solo expone funciones controladas)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://deswxtlzurawfufrvsnz.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlc3d4dGx6dXJhd2Z1ZnJ2c256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0NDI2MTgsImV4cCI6MjExMDAxODYxOH0.CnQQjdbyBL6LMJVGyRNAkWkPhsgVmPSXArchPf1jgDg';

export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`supabase ${fn}: ${r.status} ${text.slice(0, 200)}`);
  return (text ? JSON.parse(text) : null) as T;
}

export async function openai(body: Record<string, unknown>) {
  // acepta el nombre estándar o cualquier variable "openai" de Vercel cuyo valor sea una clave
  const key =
    process.env.OPENAI_API_KEY ||
    Object.entries(process.env).find(([k, v]) => /open\s*_?ai/i.test(k) && v?.trim().startsWith('sk-'))?.[1]?.trim();
  if (!key) throw new HttpError(503, 'La IA aún no está configurada (falta OPENAI_API_KEY en Vercel).');
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, ...body }),
  });
  const data = await r.json();
  if (!r.ok) {
    console.error('openai error', r.status, JSON.stringify(data).slice(0, 500));
    throw new HttpError(502, 'El asistente no está disponible en este momento.');
  }
  return data;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function guard(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return false;
  }
  return true;
}

export function fail(res: Res, e: unknown) {
  if (e instanceof HttpError) return res.status(e.status).json({ error: e.message });
  console.error(e);
  res.status(500).json({ error: 'Ocurrió un error. Intenta de nuevo.' });
}

// Fecha de hoy en Puerto Rico (AST, UTC-4, sin horario de verano)
export function todayPR() {
  const d = new Date(Date.now() - 4 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}
