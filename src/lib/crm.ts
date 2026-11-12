import { createStore } from './createStore';
import { estimate, type Estimate } from './estimate';

export const STAGES = [
  { id: 'nuevo', label: 'Nuevo', color: '#3ba7e8' },
  { id: 'contactado', label: 'Contactado', color: '#8b7cf6' },
  { id: 'visita', label: 'Visita técnica', color: '#f59e0b' },
  { id: 'propuesta', label: 'Propuesta enviada', color: '#ffd20a' },
  { id: 'permisos', label: 'Venta · Permisos LUMA', color: '#22c55e' },
  { id: 'instalacion', label: 'Instalación', color: '#14b8a6' },
  { id: 'encendido', label: 'Sistema encendido', color: '#10b981' },
] as const;

export type Stage = (typeof STAGES)[number]['id'];
export type Source = 'Cotización web' | 'Contacto' | 'Calculadora de respaldo' | 'Tienda' | 'Agenda' | 'Chat IA';

export interface Note {
  at: string;
  text: string;
  by: string;
}

export interface Lead {
  id: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  phone: string;
  email: string;
  town: string;
  address?: string;
  coords?: { lat: number; lng: number };
  property: 'Residencial' | 'Comercial';
  bill?: number;
  kwh?: number;
  file?: { id: string; name: string; type: string; size: number };
  interests: string[];
  message?: string;
  appointment?: { date: string; time: string; mode: string };
  source: Source;
  stage: Stage;
  lost?: boolean;
  value?: number;
  estimate?: Estimate;
  notes: Note[];
  demo?: boolean;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const iso = (daysAgo: number, h = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, 15, 0, 0);
  return d.toISOString();
};
const future = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function seed(): Lead[] {
  const rows: [string, string, string, 'Residencial' | 'Comercial', number, Stage, number, Source, string[]][] = [
    ['María González', 'Bayamón', 'maria.g', 'Residencial', 285, 'nuevo', 0, 'Cotización web', ['sistema-solar', 'delta-pro-3']],
    ['Carlos Rivera', 'Caguas', 'crivera', 'Residencial', 340, 'contactado', 1, 'Cotización web', ['sistema-solar', 'fortress-eflex']],
    ['Panadería La Esquina', 'Ponce', 'laesquina', 'Comercial', 1480, 'visita', 3, 'Cotización web', ['sistema-solar']],
    ['Ana López', 'Carolina', 'ana.lopez', 'Residencial', 210, 'propuesta', 6, 'Calculadora de respaldo', ['gendome']],
    ['José Martínez', 'Mayagüez', 'jmartinez', 'Residencial', 390, 'permisos', 12, 'Cotización web', ['sistema-solar', 'sunbeat-combo']],
    ['Luz Ortiz', 'Arecibo', 'luzortiz', 'Residencial', 260, 'instalacion', 20, 'Tienda', ['sistema-solar', 'calentador-solar']],
    ['Farmacia Vida', 'Humacao', 'farmaciavida', 'Comercial', 2100, 'encendido', 41, 'Cotización web', ['sistema-solar', 'fortress-eflex']],
    ['Pedro Santiago', 'San Juan', 'psantiago', 'Residencial', 175, 'nuevo', 0, 'Contacto', []],
    ['Carmen Díaz', 'Guaynabo', 'cdiaz', 'Residencial', 455, 'contactado', 2, 'Agenda', ['sistema-solar', 'delta-pro']],
    ['Miguel Torres', 'Toa Baja', 'mtorres', 'Residencial', 230, 'propuesta', 8, 'Cotización web', ['cisterna', 'sistema-solar']],
  ];
  return rows.map(([name, town, mail, property, bill, stage, days, source, interests], i) => {
    const est = estimate(bill);
    return {
      id: uid(),
      code: `EH-${1031 + i}`,
      createdAt: iso(days, 9 + (i % 7)),
      updatedAt: iso(Math.max(0, days - 1)),
      name,
      phone: `(787) 555-01${String(10 + i)}`,
      email: `${mail}@ejemplo.com`,
      town,
      property,
      bill,
      interests,
      source,
      stage,
      value: Math.round(est.kw * 2900),
      estimate: est,
      appointment: stage === 'visita' || stage === 'contactado' ? { date: future(1 + i % 4), time: i % 2 ? '10:00 AM' : '2:00 PM', mode: 'Visita técnica' } : undefined,
      notes: [{ at: iso(days), text: `Lead recibido vía ${source}.`, by: 'Sistema' }],
      demo: true,
    };
  });
}

export const crm = createStore<Lead[]>('eh-crm-v1', seed());

export function addLead(data: Omit<Lead, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'stage' | 'notes'>, code?: string): Lead {
  const all = crm.get();
  const max = all.reduce((m, l) => Math.max(m, +l.code.split('-')[1] || 0), 1030);
  const now = new Date().toISOString();
  const lead: Lead = {
    ...data,
    id: uid(),
    code: code ?? `EH-${max + 1}`,
    createdAt: now,
    updatedAt: now,
    stage: 'nuevo',
    value: data.estimate ? Math.round(data.estimate.kw * 2900) : undefined,
    notes: [{ at: now, text: `Lead recibido vía ${data.source}.`, by: 'Sistema' }],
  };
  crm.set([lead, ...all]);
  return lead;
}

export function updateLead(id: string, patch: Partial<Lead>, note?: string) {
  crm.set((all) =>
    all.map((l) =>
      l.id === id
        ? {
            ...l,
            ...patch,
            updatedAt: new Date().toISOString(),
            notes: note ? [...l.notes, { at: new Date().toISOString(), text: note, by: 'Equipo Eco House' }] : l.notes,
          }
        : l
    )
  );
}

export function findLead(code: string, contact: string) {
  const c = contact.replace(/\D/g, '');
  return crm.get().find(
    (l) => l.code.toLowerCase() === code.trim().toLowerCase() && (l.email.toLowerCase() === contact.trim().toLowerCase() || (c.length >= 7 && l.phone.replace(/\D/g, '').endsWith(c.slice(-7))))
  );
}

export const resetCrm = () => crm.set(seed());

export function toCsv(leads: Lead[]) {
  const head = ['Código', 'Fecha', 'Nombre', 'Teléfono', 'Email', 'Pueblo', 'Dirección', 'Tipo', 'Factura $', 'Etapa', 'Origen', 'Valor est.'];
  const rows = leads.map((l) => [
    l.code,
    new Date(l.createdAt).toLocaleDateString('es-PR'),
    l.name,
    l.phone,
    l.email,
    l.town,
    l.address ?? '',
    l.property,
    l.bill ?? '',
    STAGES.find((s) => s.id === l.stage)?.label ?? l.stage,
    l.source,
    l.value ?? '',
  ]);
  return [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}
