import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import RevealText from '../components/RevealText';
import { ArrowUpRight, Check, Minus, Plus } from '../components/Icons';
import { productStore } from '../lib/products';
import { APPLIANCES, recommendBackup } from '../../api/_lib/solar.js';
import { quoteList } from '../lib/quoteList';
import { createStore } from '../lib/createStore';
import { EASINGS } from '../utils/easings';
import { scrollToId } from '../utils/scroll';
import { ProductImage } from './Store';

const HOURS = [8, 12, 24, 48, 72];

export const backupNeeds = createStore<string>('eh-backup-needs', '');

export default function BackupCalc() {
  const products = productStore.use();
  const list = quoteList.use();
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(APPLIANCES.map((a) => [a.id, a.def])));
  const [hours, setHours] = useState(24);

  const { kwh, peak, options: recs } = useMemo(() => recommendBackup(qty, hours, products), [qty, hours, products]);
  const options = recs.map((r) => ({ ...r, p: products.find((x) => x.id === r.id)! }));

  const level = Math.min(1, kwh / 30);
  const set = (id: string, d: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(9, q[id] + d)) }));

  const addToQuote = (id: string, units: number) => {
    if (!list.includes(id)) quoteList.set([...list, id]);
    const items = APPLIANCES.filter((a) => qty[a.id] > 0).map((a) => `${qty[a.id]}× ${a.label}`).join(', ');
    backupNeeds.set(`Respaldo deseado: ${hours}h · ${kwh} kWh · pico ${peak}W · ${units} unidad(es) sugerida(s). Equipos: ${items}`);
    scrollToId('cotizar');
  };

  return (
    <section id="respaldo" className="backup">
      <div className="container">
        <div className="backup__head">
          <span className="eyebrow">08 · Calculadora de respaldo</span>
          <RevealText tag="h2" className="h2" italic={['apagón?']}>
            ¿Qué necesitas mantener encendido en un apagón?
          </RevealText>
          <p>Escoge tus equipos y cuántas horas quieres respaldo. Te decimos cuánta batería necesitas y qué equipo de nuestra tienda te sirve.</p>
        </div>

        <div className="backup__grid">
          <div className="backup__list">
            {APPLIANCES.map((a) => (
              <div key={a.id} className={`appl ${qty[a.id] > 0 ? 'on' : ''}`}>
                <span className="appl__emoji">{a.emoji}</span>
                <div>
                  <strong>{a.label}</strong>
                  <small>
                    {a.w}W · {a.h}h/día
                  </small>
                </div>
                <div className="stepper">
                  <button onClick={() => set(a.id, -1)} aria-label={`Quitar ${a.label}`} disabled={qty[a.id] === 0}>
                    <Minus size={14} />
                  </button>
                  <motion.b key={qty[a.id]} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    {qty[a.id]}
                  </motion.b>
                  <button onClick={() => set(a.id, 1)} aria-label={`Añadir ${a.label}`}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="backup__result">
            <div className="backup__hours">
              <span>Horas sin luz que quieres cubrir</span>
              <div className="seg">
                {HOURS.map((h) => (
                  <button key={h} className={hours === h ? 'on' : ''} onClick={() => setHours(h)}>
                    {hours === h && <motion.span layoutId="seg-bg" className="seg__bg" />}
                    <span>{h < 24 ? `${h}h` : `${h / 24} día${h > 24 ? 's' : ''}`}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="meter">
              <svg viewBox="0 0 200 120">
                <path d="M20 110 A80 80 0 0 1 180 110" className="meter__track" />
                <motion.path d="M20 110 A80 80 0 0 1 180 110" className="meter__fill" animate={{ pathLength: Math.max(0.02, level) }} transition={{ type: 'spring', stiffness: 60, damping: 16 }} />
              </svg>
              <div className="meter__val">
                <strong>{kwh}</strong>
                <span>kWh necesarios</span>
              </div>
              <div className="meter__peak">
                Potencia pico <b>{peak.toLocaleString('en-US')}W</b>
              </div>
            </div>

            <div className="recs">
              <span className="recs__title">Equipos recomendados</span>
              <AnimatePresence mode="popLayout">
                {options.map(({ p, units, total, powerOk }) => (
                  <motion.div layout key={p.id} className="rec" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ ease: EASINGS.premium }}>
                    <ProductImage p={p} className="rec__img" />
                    <div>
                      <strong>
                        {units}× {p.name}
                      </strong>
                      <small>
                        {total} kWh {powerOk ? '· cubre tu potencia' : '· requiere inversor adicional'}
                      </small>
                    </div>
                    <button className={`rec__add ${list.includes(p.id) ? 'on' : ''}`} onClick={() => addToQuote(p.id, units)} aria-label="Cotizar esta opción">
                      {list.includes(p.id) ? <Check size={16} /> : <ArrowUpRight size={16} />}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <p className="recs__tip">☀️ Con placas solares tu batería se recarga cada día: el respaldo se vuelve ilimitado.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
