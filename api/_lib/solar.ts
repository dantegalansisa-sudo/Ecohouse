// Estimado preliminar a partir de la factura. Supuestos visibles para el equipo de ventas.
export const RATE_PER_KWH = 0.27; // $/kWh promedio residencial (ajustable)
const SUN_HOURS = 4.8; // horas pico promedio en Puerto Rico
const SYSTEM_LOSSES = 0.8;
const PANEL_W = 450;
export const SAVINGS_PCT = 0.7; // "reduce hasta un 70%"

export interface Estimate {
  kwhMonth: number;
  kw: number;
  panels: number;
  monthlySavings: number;
  yearlySavings: number;
  batteryKwh: number;
  roofSqft: number;
}

export function estimate(bill: number, kwh?: number): Estimate {
  const kwhMonth = kwh && kwh > 0 ? kwh : bill / RATE_PER_KWH;
  const kw = kwhMonth / (30 * SUN_HOURS * SYSTEM_LOSSES);
  const panels = Math.max(4, Math.ceil((kw * 1000) / PANEL_W));
  const monthlySavings = bill * SAVINGS_PCT;
  return {
    kwhMonth: Math.round(kwhMonth),
    kw: Math.round(kw * 10) / 10,
    panels,
    monthlySavings: Math.round(monthlySavings),
    yearlySavings: Math.round(monthlySavings * 12),
    batteryKwh: Math.round(Math.min(30, Math.max(5, (kwhMonth / 30) * 0.4)) * 10) / 10,
    roofSqft: Math.round(panels * 21.5),
  };
}

export const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

// consumo típico por equipo: vatios en uso y horas de uso por día
export const APPLIANCES = [
  { id: 'nevera', label: 'Nevera', emoji: '🧊', w: 150, h: 10, def: 1 },
  { id: 'abanico', label: 'Abanico', emoji: '🌀', w: 60, h: 8, def: 2 },
  { id: 'luces', label: 'Luces LED (5)', emoji: '💡', w: 50, h: 6, def: 1 },
  { id: 'router', label: 'Internet / Router', emoji: '📶', w: 15, h: 24, def: 1 },
  { id: 'tv', label: 'Televisor', emoji: '📺', w: 100, h: 5, def: 1 },
  { id: 'cel', label: 'Celulares y laptop', emoji: '💻', w: 60, h: 4, def: 1 },
  { id: 'bomba', label: 'Bomba de agua', emoji: '🚿', w: 750, h: 1, def: 0 },
  { id: 'ac', label: 'Aire acond. 12k BTU', emoji: '❄️', w: 1100, h: 8, def: 0 },
  { id: 'lavadora', label: 'Lavadora', emoji: '🧺', w: 500, h: 1, def: 0 },
  { id: 'micro', label: 'Microondas', emoji: '🍲', w: 1200, h: 0.3, def: 0 },
  { id: 'cpap', label: 'Equipo médico (CPAP)', emoji: '🩺', w: 60, h: 8, def: 0 },
  { id: 'cafe', label: 'Cafetera', emoji: '☕', w: 900, h: 0.25, def: 0 },
];

export const SLOTS_WEEK = ['8:00 AM', '9:30 AM', '11:00 AM', '1:00 PM', '2:30 PM', '4:00 PM'];
export const SLOTS_SAT = ['9:00 AM', '10:30 AM', '12:00 PM'];

export interface BackupProduct {
  id: string;
  name: string;
  capacityKwh?: number;
  outputW?: number;
  visible?: boolean;
}

// Energía y potencia para un respaldo, y qué baterías del catálogo lo cubren
export function recommendBackup(qty: Record<string, number>, hours: number, products: BackupProduct[]) {
  let daily = 0;
  let peak = 0;
  APPLIANCES.forEach((a) => {
    const n = qty[a.id] ?? 0;
    daily += ((a.w * a.h) / 1000) * n;
    peak += a.w * n;
  });
  const kwh = Math.round(daily * (hours / 24) * 10) / 10;
  const options = products
    .filter((p) => p.visible !== false && p.capacityKwh)
    .map((p) => {
      const units = Math.max(1, Math.ceil(kwh / (p.capacityKwh! * 0.9)));
      return { id: p.id, name: p.name, units, total: Math.round(units * p.capacityKwh! * 10) / 10, powerOk: !p.outputW || p.outputW >= peak };
    })
    .sort((a, b) => Number(b.powerOk) - Number(a.powerOk) || a.units - b.units)
    .slice(0, 3);
  return { kwh, peak: Math.round(peak), options };
}
