import { STAGES, type Stage } from '../lib/crm';

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export function ago(iso: string) {
  const m = Math.round((Date.now() - +new Date(iso)) / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
}

export function StageChip({ stage }: { stage: Stage }) {
  const s = STAGES.find((x) => x.id === stage)!;
  return (
    <span className="stage-chip" style={{ ['--c' as string]: s.color }}>
      {s.label}
    </span>
  );
}

export function download(name: string, content: string, type = 'text/csv;charset=utf-8') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + content], { type }));
  a.download = name;
  a.click();
}
