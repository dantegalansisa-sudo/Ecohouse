import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from '../components/Logo';
import { crm, findLead, type Lead } from '../lib/crm';
import { money } from '../lib/estimate';
import { productStore } from '../lib/products';
import { labelOf } from '../components/Calendar';
import { ArrowUpRight, Calendar, Check, FileText, Phone, Sun, WhatsApp } from '../components/Icons';
import { CONTACT, EASINGS } from '../utils/easings';

const STEPS = [
  { t: 'Solicitud recibida', d: 'Recibimos tu factura y tus datos.' },
  { t: 'Visita técnica', d: 'Medimos tu techo y tu instalación eléctrica.' },
  { t: 'Propuesta', d: 'Tu diseño, equipos y ahorro estimado.' },
  { t: 'Permisos LUMA', d: 'Tramitamos los permisos de tu sistema.' },
  { t: 'Instalación', d: 'Nuestro equipo instala tu sistema.' },
  { t: 'Sistema encendido', d: '¡Bienvenido a tu casa eco-friendly!' },
];
const STEP_OF: Record<Lead['stage'], number> = { nuevo: 0, contactado: 0, visita: 1, propuesta: 2, permisos: 3, instalacion: 4, encendido: 5 };

export default function Portal() {
  const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
  const [code, setCode] = useState(params.get('code') ?? '');
  const [contact, setContact] = useState('');
  const [err, setErr] = useState('');
  const [id, setId] = useState<string | null>(null);
  const leads = crm.use();
  const lead = leads.find((l) => l.id === id) ?? null;

  const enter = (e: React.FormEvent) => {
    e.preventDefault();
    const found = findLead(code, contact);
    if (found) {
      setId(found.id);
      setErr('');
    } else setErr('No encontramos un proyecto con esos datos. Revisa tu código y tu teléfono o email.');
  };

  return (
    <div className="portal" data-lenis-prevent>
      <header className="portal__top">
        <a href="#/">
          <Logo size={42} />
        </a>
        <span>Mi proyecto</span>
        {lead && (
          <button className="btn btn--text btn--sm portal__out" onClick={() => setId(null)}>
            Salir
          </button>
        )}
      </header>

      <AnimatePresence mode="wait">
        {!lead ? (
          <motion.form key="login" className="portal__login" onSubmit={enter} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ ease: EASINGS.premium, duration: 0.6 }}>
            <span className="portal__sun">
              <Sun size={30} />
            </span>
            <h1>
              Sigue tu proyecto <em className="serif">solar.</em>
            </h1>
            <p>Entra con el código que recibiste al solicitar tu cotización (ej. EH-1042) y tu celular o email.</p>
            <label className="field filled">
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder=" " />
              <span>Código de proyecto</span>
            </label>
            <label className={`field ${contact ? 'filled' : ''}`}>
              <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder=" " />
              <span>Celular o email</span>
            </label>
            {err && <p className="err">{err}</p>}
            <button className="btn btn--yellow btn--block" type="submit" disabled={!code || !contact}>
              Ver mi proyecto <ArrowUpRight size={18} />
            </button>
            <small className="portal__hint">Demo: prueba con <b>EH-1035</b> y <b>787-555-0114</b>, o con el código que generes en la cotización del sitio.</small>
          </motion.form>
        ) : (
          <ProjectView key="view" lead={lead} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProjectView({ lead }: { lead: Lead }) {
  const products = productStore.use();
  const current = STEP_OF[lead.stage];
  const pct = (current / (STEPS.length - 1)) * 100;

  return (
    <motion.div className="pview" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: EASINGS.premium, duration: 0.6 }}>
      <div className="pview__hero">
        <div>
          <small>{lead.code} · {lead.property}</small>
          <h1>Hola, {lead.name.split(' ')[0]}.</h1>
          <p>
            Tu proyecto está en: <b>{STEPS[current].t}</b>
          </p>
        </div>
        <div className="ring">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" className="ring__track" />
            <motion.circle cx="50" cy="50" r="44" className="ring__fill" initial={{ pathLength: 0 }} animate={{ pathLength: Math.max(0.04, pct / 100) }} transition={{ duration: 1.4, ease: EASINGS.smooth }} />
          </svg>
          <b>{Math.round(pct)}%</b>
        </div>
      </div>

      <ol className="ptimeline">
        {STEPS.map((s, i) => (
          <motion.li key={s.t} className={i < current ? 'done' : i === current ? 'now' : ''} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>
            <span>{i < current ? <Check size={14} /> : i + 1}</span>
            <div>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i === current && <em>Etapa actual</em>}
          </motion.li>
        ))}
      </ol>

      <div className="pview__grid">
        <div className="pbox">
          <Calendar size={20} />
          <small>Próxima visita</small>
          <strong>{lead.appointment ? `${labelOf(lead.appointment.date)} · ${lead.appointment.time}` : 'Te contactaremos para coordinar'}</strong>
        </div>
        <div className="pbox">
          <FileText size={20} />
          <small>Factura</small>
          <strong>{lead.file ? `${lead.file.name} ✓` : lead.bill ? `$${lead.bill}/mes registrada` : 'Pendiente'}</strong>
        </div>
        {lead.estimate && (
          <div className="pbox pbox--y">
            <Sun size={20} />
            <small>Tu sistema estimado</small>
            <strong>
              {lead.estimate.kw} kW · {lead.estimate.panels} placas · {money(lead.estimate.yearlySavings)}/año de ahorro
            </strong>
          </div>
        )}
        {lead.interests.length > 0 && (
          <div className="pbox">
            <small>Equipos de interés</small>
            <strong>{lead.interests.map((id) => products.find((p) => p.id === id)?.name ?? id).join(', ')}</strong>
          </div>
        )}
      </div>

      <div className="pview__help">
        <p>¿Tienes preguntas sobre tu proyecto?</p>
        <a className="btn btn--wa" href={`https://wa.me/${CONTACT.phoneRaw}?text=${encodeURIComponent(`Hola Eco House, tengo una pregunta sobre mi proyecto ${lead.code}.`)}`} target="_blank" rel="noreferrer">
          <WhatsApp size={18} /> WhatsApp
        </a>
        <a className="btn btn--ghost" href={`tel:+${CONTACT.phoneRaw}`}>
          <Phone size={18} /> Llamar
        </a>
      </div>
    </motion.div>
  );
}
