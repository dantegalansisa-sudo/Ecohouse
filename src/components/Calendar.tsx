import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Clock } from './Icons';
import { crm } from '../lib/crm';
import { SLOTS_SAT as SAT, SLOTS_WEEK as WEEK } from '../../api/_lib/solar.js';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const labelOf = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  const s = new Date(y, m - 1, d).toLocaleDateString('es-PR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function Calendar({ date, time, onDate, onTime }: { date: string; time: string; onDate: (k: string) => void; onTime: (t: string) => void }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const leads = crm.use();

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const total = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const arr: (Date | null)[] = Array(first.getDay()).fill(null);
    for (let i = 1; i <= total; i++) arr.push(new Date(view.getFullYear(), view.getMonth(), i));
    return arr;
  }, [view]);

  const max = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 45);
  const disabled = (d: Date) => d <= today || d > max || d.getDay() === 0;
  const selected = date ? new Date(date + 'T00:00') : null;
  const slots = selected ? (selected.getDay() === 6 ? SAT : WEEK) : [];
  const taken = (t: string) => leads.some((l) => l.appointment?.date === date && l.appointment.time === t);

  return (
    <div className="wstep--cal">
      <div className="cal">
        <div className="cal__head">
          <button disabled={view <= new Date(today.getFullYear(), today.getMonth(), 1)} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} aria-label="Mes anterior">
            <ChevronLeft size={18} />
          </button>
          <strong>
            {MONTHS[view.getMonth()]} <span>{view.getFullYear()}</span>
          </strong>
          <button disabled={new Date(view.getFullYear(), view.getMonth() + 1, 1) > max} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} aria-label="Mes siguiente">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="cal__grid">
          {DAYS.map((d, i) => (
            <span key={i} className="cal__dow">
              {d}
            </span>
          ))}
          {cells.map((d, i) =>
            d ? (
              <button
                key={i}
                type="button"
                disabled={disabled(d)}
                className={`cal__day ${date === keyOf(d) ? 'on' : ''} ${keyOf(d) === keyOf(today) ? 'today' : ''}`}
                onClick={() => {
                  onDate(keyOf(d));
                  onTime('');
                }}
              >
                {d.getDate()}
              </button>
            ) : (
              <span key={i} />
            )
          )}
        </div>
      </div>
      <div className="slots">
        <h4>
          <Clock size={16} /> {date ? labelOf(date) : 'Escoge un día'}
        </h4>
        {date ? (
          <div className="slots__grid">
            {slots.map((t, i) => (
              <motion.button key={t} type="button" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} disabled={taken(t)} className={`slot ${time === t ? 'on' : ''}`} onClick={() => onTime(t)}>
                {taken(t) ? 'Ocupado' : t}
              </motion.button>
            ))}
          </div>
        ) : (
          <p className="slots__empty">
            <CalIcon size={28} />
            Lunes a sábado. Escoge el día de tu visita técnica.
          </p>
        )}
      </div>
    </div>
  );
}
