import type { Estimate } from './estimate';

// Supabase de la demo (clave pública; la base solo expone funciones controladas)
const SUPABASE_URL = 'https://deswxtlzurawfufrvsnz.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlc3d4dGx6dXJhd2Z1ZnJ2c256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0NDI2MTgsImV4cCI6MjExMDAxODYxOH0.CnQQjdbyBL6LMJVGyRNAkWkPhsgVmPSXArchPf1jgDg';
const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(await r.text());
  const t = await r.text();
  return (t ? JSON.parse(t) : null) as T;
}

export async function uploadBill(file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/facturas/${path}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!r.ok) throw new Error(await r.text());
  return path;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as { error?: string }).error || 'No disponible');
  return data as T;
}

/* ---------- Sol (chat) ---------- */
export type ChatCard =
  | ({ type: 'estimate'; bill: number } & Estimate)
  | { type: 'backup'; hours: number; kwh: number; peak: number; options: { id: string; name: string; units: number; total: number; powerOk: boolean }[] }
  | { type: 'products'; ids: string[] }
  | { type: 'lead'; code: string; name: string; phone: string; email: string; town: string; property: 'Residencial' | 'Comercial'; bill?: number; estimate?: Estimate }
  | { type: 'slots'; date: string; slots: string[]; code?: string }
  | { type: 'visit'; code: string; date: string; time: string }
  | { type: 'human'; url: string };

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  cards?: ChatCard[];
}

export const askSol = (messages: ChatTurn[], session: string, leadCode?: string) =>
  post<{ reply: string; cards: ChatCard[]; leadCode: string | null }>('/api/chat', {
    session,
    leadCode,
    messages: messages.map(({ role, content }) => ({ role, content })),
  });

/* ---------- factura leída por IA ---------- */
export interface BillAI {
  es_factura: boolean;
  total_a_pagar: number | null;
  consumo_kwh: number | null;
  periodo: string | null;
  dias: number | null;
  tarifa: string | null;
  historial: { mes: string; kwh: number }[];
  confianza: 'alta' | 'media' | 'baja';
  nota: string;
  promedio_kwh: number | null;
  pico_kwh: number | null;
  estimate: Estimate | null;
}

// Las fotos se reducen antes de enviarlas: más rápido, más barato y bajo el límite de Vercel
async function toDataUrl(file: File): Promise<string> {
  if (file.type.startsWith('image/') && file.type !== 'image/heic') {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
}

export async function readBill(file: File) {
  if (file.size > 3.5 * 1024 * 1024 && !file.type.startsWith('image/')) throw new Error('El PDF es muy grande para leerlo con IA. Escribe los datos manualmente.');
  return post<BillAI>('/api/bill', { file: await toDataUrl(file), name: file.name });
}
