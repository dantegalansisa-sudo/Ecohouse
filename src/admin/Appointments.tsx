import { useMemo } from 'react';
import { type Lead } from '../lib/crm';
import { keyOf, labelOf } from '../components/Calendar';
import { MapPin, Phone } from '../components/Icons';
import { StageChip } from './ui';

export default function Appointments({ leads, onOpen }: { leads: Lead[]; onOpen: (l: Lead) => void }) {
  const today = keyOf(new Date());
  const groups = useMemo(() => {
    const list = leads.filter((l) => l.appointment).sort((a, b) => (a.appointment!.date + a.appointment!.time).localeCompare(b.appointment!.date + b.appointment!.time));
    const map = new Map<string, Lead[]>();
    list.forEach((l) => {
      const k = l.appointment!.date;
      map.set(k, [...(map.get(k) ?? []), l]);
    });
    return [...map.entries()];
  }, [leads]);

  const upcoming = groups.filter(([d]) => d >= today);
  const past = groups.filter(([d]) => d < today);

  return (
    <div className="appts">
      {upcoming.length === 0 && <div className="adm-card adm-empty">No hay visitas próximas. Se agendan desde la cotización del sitio o desde la ficha del cliente.</div>}
      {[...upcoming, ...past].map(([date, items]) => (
        <div key={date} className={`adm-card appts__day ${date < today ? 'past' : ''}`}>
          <div className="appts__date">
            <b>{+date.slice(8)}</b>
            <div>
              <strong>{labelOf(date)}</strong>
              <small>
                {date === today ? 'Hoy' : date < today ? 'Pasada' : ''} {items.length} visita{items.length > 1 ? 's' : ''}
              </small>
            </div>
          </div>
          <ul>
            {items.map((l) => (
              <li key={l.id} onClick={() => onOpen(l)}>
                <span className="appts__time">{l.appointment!.time}</span>
                <div>
                  <strong>{l.name}</strong>
                  <small>
                    <MapPin size={12} /> {l.address ? `${l.address}, ` : ''}
                    {l.town} · <Phone size={12} /> {l.phone}
                  </small>
                </div>
                <StageChip stage={l.stage} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
