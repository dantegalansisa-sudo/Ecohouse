import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { STAGES, type Lead } from '../lib/crm';
import { keyOf, labelOf } from '../components/Calendar';
import { money } from '../lib/estimate';
import { ArrowUpRight, Calendar, FileText, Target, Users, Wallet } from '../components/Icons';
import { ago, initials, StageChip } from './ui';

type Go = (v: 'pipeline' | 'clientes' | 'citas') => void;

export default function Dashboard({ leads, onOpen, onGo }: { leads: Lead[]; onOpen: (l: Lead) => void; onGo: Go }) {
  const stats = useMemo(() => {
    const now = Date.now();
    const month = leads.filter((l) => now - +new Date(l.createdAt) < 30 * 864e5);
    const won = leads.filter((l) => ['permisos', 'instalacion', 'encendido'].includes(l.stage));
    const open = leads.filter((l) => !l.lost && !['encendido'].includes(l.stage));
    const today = keyOf(new Date());
    const upcoming = leads
      .filter((l) => l.appointment && l.appointment.date >= today)
      .sort((a, b) => (a.appointment!.date + a.appointment!.time).localeCompare(b.appointment!.date + b.appointment!.time));
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const key = keyOf(d);
      return { key, label: d.getDate(), n: leads.filter((l) => keyOf(new Date(l.createdAt)) === key).length };
    });
    const towns = Object.entries(
      leads.reduce<Record<string, number>>((acc, l) => {
        acc[l.town] = (acc[l.town] ?? 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    return {
      month: month.length,
      bills: leads.filter((l) => l.file || l.bill).length,
      upcoming,
      pipeline: open.reduce((s, l) => s + (l.value ?? 0), 0),
      close: leads.length ? Math.round((won.length / leads.length) * 100) : 0,
      days,
      towns,
    };
  }, [leads]);

  const maxDay = Math.max(1, ...stats.days.map((d) => d.n));
  const maxTown = Math.max(1, ...stats.towns.map((t) => t[1]));
  const KPIS = [
    { icon: Users, label: 'Leads (30 días)', value: stats.month, tone: 'blue' },
    { icon: FileText, label: 'Facturas recibidas', value: stats.bills, tone: 'yellow' },
    { icon: Calendar, label: 'Visitas próximas', value: stats.upcoming.length, tone: 'violet' },
    { icon: Wallet, label: 'Valor en pipeline', value: money(stats.pipeline), tone: 'green' },
    { icon: Target, label: 'Tasa de cierre', value: `${stats.close}%`, tone: 'teal' },
  ];

  return (
    <div className="dash">
      <div className="kpis">
        {KPIS.map(({ icon: Icon, label, value, tone }, i) => (
          <motion.div key={label} className={`kpi kpi--${tone}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <span className="kpi__icon">
              <Icon size={18} />
            </span>
            <small>{label}</small>
            <strong>{value}</strong>
          </motion.div>
        ))}
      </div>

      <div className="dash__grid">
        <div className="adm-card dash__chart">
          <div className="adm-card__head">
            <h3>Solicitudes · últimos 14 días</h3>
          </div>
          <div className="bars">
            {stats.days.map((d, i) => (
              <div key={d.key} className="bars__col">
                <motion.span initial={{ height: 0 }} animate={{ height: `${(d.n / maxDay) * 100}%` }} transition={{ delay: 0.2 + i * 0.03, type: 'spring', stiffness: 90, damping: 16 }}>
                  {d.n > 0 && <b>{d.n}</b>}
                </motion.span>
                <small>{d.label}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card__head">
            <h3>Embudo de ventas</h3>
            <button className="adm-link" onClick={() => onGo('pipeline')}>
              Ver pipeline <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="funnel">
            {STAGES.map((s, i) => {
              const n = leads.filter((l) => l.stage === s.id && !l.lost).length;
              return (
                <div key={s.id} className="funnel__row">
                  <span>{s.label}</span>
                  <div>
                    <motion.i style={{ background: s.color }} initial={{ width: 0 }} animate={{ width: `${Math.max(4, (n / Math.max(1, leads.length)) * 100)}%` }} transition={{ delay: 0.2 + i * 0.05 }} />
                  </div>
                  <b>{n}</b>
                </div>
              );
            })}
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card__head">
            <h3>Próximas visitas</h3>
            <button className="adm-link" onClick={() => onGo('citas')}>
              Ver todas <ArrowUpRight size={14} />
            </button>
          </div>
          {stats.upcoming.length === 0 && <p className="adm-empty">No hay visitas agendadas.</p>}
          <ul className="mini-list">
            {stats.upcoming.slice(0, 5).map((l) => (
              <li key={l.id} onClick={() => onOpen(l)}>
                <span className="date-pill">
                  <b>{+l.appointment!.date.slice(8)}</b>
                  <small>{labelOf(l.appointment!.date).slice(0, 3)}</small>
                </span>
                <div>
                  <strong>{l.name}</strong>
                  <small>
                    {l.appointment!.time} · {l.town}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="adm-card">
          <div className="adm-card__head">
            <h3>Leads por pueblo</h3>
          </div>
          <div className="funnel">
            {stats.towns.map(([t, n]) => (
              <div key={t} className="funnel__row">
                <span>{t}</span>
                <div>
                  <motion.i style={{ background: '#0a1a6b' }} initial={{ width: 0 }} animate={{ width: `${(n / maxTown) * 100}%` }} />
                </div>
                <b>{n}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="adm-card dash__recent">
          <div className="adm-card__head">
            <h3>Actividad reciente</h3>
            <button className="adm-link" onClick={() => onGo('clientes')}>
              Ver clientes <ArrowUpRight size={14} />
            </button>
          </div>
          <ul className="mini-list">
            {[...leads]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .slice(0, 6)
              .map((l) => (
                <li key={l.id} onClick={() => onOpen(l)}>
                  <span className="avatar">{initials(l.name)}</span>
                  <div>
                    <strong>
                      {l.name} {!l.demo && <em className="tag-new">Desde el sitio</em>}
                    </strong>
                    <small>
                      {l.source} · {l.town} · {ago(l.createdAt)}
                    </small>
                  </div>
                  <StageChip stage={l.stage} />
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
