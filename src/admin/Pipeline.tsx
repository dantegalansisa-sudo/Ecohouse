import { useState } from 'react';
import { motion } from 'framer-motion';
import { STAGES, updateLead, type Lead, type Stage } from '../lib/crm';
import { money } from '../lib/estimate';
import { Calendar, FileText, MapPin } from '../components/Icons';
import { ago } from './ui';

export default function Pipeline({ leads, onOpen }: { leads: Lead[]; onOpen: (l: Lead) => void }) {
  const [over, setOver] = useState<Stage | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const drop = (stage: Stage) => {
    const l = leads.find((x) => x.id === dragId);
    if (l && l.stage !== stage) updateLead(l.id, { stage }, `Etapa cambiada a “${STAGES.find((s) => s.id === stage)!.label}”.`);
    setOver(null);
    setDragId(null);
  };

  return (
    <div className="kanban">
      {STAGES.map((s) => {
        const items = leads.filter((l) => l.stage === s.id && !l.lost).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        const total = items.reduce((t, l) => t + (l.value ?? 0), 0);
        return (
          <div
            key={s.id}
            className={`kcol ${over === s.id ? 'over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(s.id);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={() => drop(s.id)}
          >
            <div className="kcol__head" style={{ ['--c' as string]: s.color }}>
              <span>{s.label}</span>
              <b>{items.length}</b>
              <small>{money(total)}</small>
            </div>
            <div className="kcol__body">
              {items.map((l) => (
                <motion.div
                  layout
                  layoutId={l.id}
                  key={l.id}
                  className={`kcard ${dragId === l.id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => setDragId(l.id)}
                  onDragEnd={() => setDragId(null)}
                  onClick={() => onOpen(l)}
                  whileHover={{ y: -3 }}
                >
                  <div className="kcard__top">
                    <small>{l.code}</small>
                    <small>{ago(l.createdAt)}</small>
                  </div>
                  <strong>{l.name}</strong>
                  <span className="kcard__town">
                    <MapPin size={13} /> {l.town} · {l.property}
                  </span>
                  <div className="kcard__foot">
                    {l.bill && <span className="kchip">${l.bill}/mes</span>}
                    {l.file && (
                      <span className="kchip kchip--y" title="Factura subida">
                        <FileText size={12} /> Factura
                      </span>
                    )}
                    {l.appointment && (
                      <span className="kchip kchip--v" title="Visita agendada">
                        <Calendar size={12} /> {l.appointment.date.slice(5).split('-').reverse().join('/')}
                      </span>
                    )}
                    {!l.demo && <span className="kchip kchip--g">Web</span>}
                  </div>
                </motion.div>
              ))}
              {items.length === 0 && <p className="kcol__empty">Arrastra un cliente aquí</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
