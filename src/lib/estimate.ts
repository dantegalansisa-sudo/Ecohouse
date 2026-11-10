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
