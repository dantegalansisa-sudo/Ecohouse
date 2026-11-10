import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { STAGES, updateLead, type Lead, type Stage } from '../lib/crm';
import { getFile } from '../lib/files';
import { money } from '../lib/estimate';
import { productStore } from '../lib/products';
import { labelOf } from '../components/Calendar';
import { Calendar, Download, FileText, Mail, MapPin, Message, Phone, WhatsApp, X } from '../components/Icons';
import { EASINGS } from '../utils/easings';
import { ago, initials } from './ui';

export default function LeadDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const products = productStore.use();
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [value, setValue] = useState(String(lead.value ?? ''));
  const [appt, setAppt] = useState(lead.appointment ?? { date: '', time: '', mode: 'Visita técnica' });

  useEffect(() => {
    let u = '';
    setUrl('');
    if (lead.file)
      getFile(lead.file.id).then((b) => {
        if (b) {
          u = URL.createObjectURL(b);
          setUrl(u);
        }
      });
    return () => {
      if (u) URL.revokeObjectURL(u);
    };
  }, [lead.file?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const digits = lead.phone.replace(/\D/g, '');
  const wa = `https://wa.me/${digits.length === 10 ? '1' + digits : digits}?text=${encodeURIComponent(`Hola ${lead.name.split(' ')[0]}, te saluda el equipo de Eco House sobre tu solicitud ${lead.code}.`)}`;
  const mapQ = lead.coords ? `${lead.coords.lat},${lead.coords.lng}` : `${lead.address ? lead.address + ', ' : ''}${lead.town}, Puerto Rico`;

  return (
    <motion.div className="drawer-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.aside className="drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ ease: EASINGS.premium, duration: 0.5 }} onClick={(e) => e.stopPropagation()}>
        <header className="drawer__head">
          <span className="avatar avatar--lg">{initials(lead.name)}</span>
          <div>
            <h2>{lead.name}</h2>
            <small>
              {lead.code} · {lead.property} · {lead.source} · {ago(lead.createdAt)}
            </small>
          </div>
          <button className="drawer__close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        <div className="drawer__actions">
          <a href={`tel:${lead.phone}`} className="act">
            <Phone size={18} /> Llamar
          </a>
          <a href={wa} target="_blank" rel="noreferrer" className="act act--wa">
            <WhatsApp size={18} /> WhatsApp
          </a>
          <a href={`mailto:${lead.email}?subject=${encodeURIComponent(`Tu cotización Eco House ${lead.code}`)}`} className="act">
            <Mail size={18} /> Email
          </a>
        </div>

        <div className="drawer__body">
          <section className="dsec">
            <h4>Etapa</h4>
            <div className="stages">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  className={lead.stage === s.id ? 'on' : ''}
                  style={{ ['--c' as string]: s.color }}
                  onClick={() => lead.stage !== s.id && updateLead(lead.id, { stage: s.id as Stage, lost: false }, `Etapa cambiada a “${s.label}”.`)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <label className="toggle toggle--red">
              <input type="checkbox" checked={!!lead.lost} onChange={(e) => updateLead(lead.id, { lost: e.target.checked }, e.target.checked ? 'Marcado como perdido.' : 'Reactivado.')} />
              <span /> Marcar como perdido
            </label>
          </section>

          <section className="dsec dsec--grid">
            <div>
              <small>Teléfono celular</small>
              <b>{lead.phone || '—'}</b>
            </div>
            <div>
              <small>Correo electrónico</small>
              <b>{lead.email}</b>
            </div>
            <div>
              <small>Pueblo</small>
              <b>{lead.town}</b>
            </div>
            <div>
              <small>Dirección</small>
              <b>{lead.address ?? '—'}</b>
            </div>
          </section>

          <section className="dsec">
            <h4>
              <MapPin size={16} /> Localización {lead.coords && <em className="tag-new">GPS</em>}
            </h4>
            <div className="mapbox">
              <iframe title="Mapa del cliente" loading="lazy" src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQ)}&z=${lead.coords ? 16 : 12}&output=embed`} />
            </div>
            <a className="adm-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQ)}`} target="_blank" rel="noreferrer">
              Abrir en Google Maps →
            </a>
          </section>

          <section className="dsec">
            <h4>
              <FileText size={16} /> Factura de luz
            </h4>
            {lead.file ? (
              url ? (
                <div className="billview">
                  {lead.file.type.startsWith('image/') ? <img src={url} alt="Factura del cliente" /> : lead.file.type === 'application/pdf' ? <iframe title="Factura PDF" src={url} /> : <p>{lead.file.name}</p>}
                  <a className="btn btn--ghost btn--sm" href={url} download={lead.file.name}>
                    <Download size={16} /> Descargar {lead.file.name}
                  </a>
                </div>
              ) : (
                <p className="adm-empty">Cargando factura…</p>
              )
            ) : (
              <p className="adm-empty">{lead.demo ? 'Cliente de ejemplo: sin archivo.' : 'El cliente no subió archivo.'}</p>
            )}
            <div className="dsec--grid">
              <div>
                <small>Total mensual</small>
                <b>{lead.bill ? `$${lead.bill}` : '—'}</b>
              </div>
              <div>
                <small>Consumo</small>
                <b>{lead.kwh ? `${lead.kwh} kWh` : lead.estimate ? `~${lead.estimate.kwhMonth} kWh` : '—'}</b>
              </div>
            </div>
          </section>

          {lead.estimate && (
            <section className="dsec">
              <h4>Estimado preliminar</h4>
              <div className="estcard estcard--light">
                <div className="estcard__grid">
                  <div>
                    <b>{lead.estimate.kw} kW</b>
                    <small>sistema</small>
                  </div>
                  <div>
                    <b>{lead.estimate.panels}</b>
                    <small>placas</small>
                  </div>
                  <div>
                    <b>{lead.estimate.batteryKwh} kWh</b>
                    <small>batería</small>
                  </div>
                  <div>
                    <b>{money(lead.estimate.yearlySavings)}</b>
                    <small>ahorro/año</small>
                  </div>
                </div>
              </div>
              <label className="field field--sm filled">
                <input type="number" value={value} onChange={(e) => setValue(e.target.value)} onBlur={() => +value !== lead.value && updateLead(lead.id, { value: +value || undefined }, `Valor de la venta actualizado a ${money(+value || 0)}.`)} placeholder=" " />
                <span>Valor estimado de la venta ($)</span>
              </label>
            </section>
          )}

          {(lead.interests.length > 0 || lead.message) && (
            <section className="dsec">
              <h4>Intereses y mensaje</h4>
              <div className="pills">
                {lead.interests.map((id) => (
                  <span key={id} className="pill on">
                    {products.find((p) => p.id === id)?.name ?? id}
                  </span>
                ))}
              </div>
              {lead.message && <p className="dmsg">{lead.message}</p>}
            </section>
          )}

          <section className="dsec">
            <h4>
              <Calendar size={16} /> Visita técnica
            </h4>
            {lead.appointment && (
              <p className="dappt">
                {labelOf(lead.appointment.date)} · {lead.appointment.time}
              </p>
            )}
            <div className="fields__row">
              <input className="inp" type="date" value={appt.date} onChange={(e) => setAppt({ ...appt, date: e.target.value })} />
              <input className="inp" type="text" placeholder="Hora (ej. 10:00 AM)" value={appt.time} onChange={(e) => setAppt({ ...appt, time: e.target.value })} />
            </div>
            <button className="btn btn--dark btn--sm" disabled={!appt.date || !appt.time} onClick={() => updateLead(lead.id, { appointment: appt, stage: lead.stage === 'nuevo' || lead.stage === 'contactado' ? 'visita' : lead.stage }, `Visita agendada: ${labelOf(appt.date)} ${appt.time}.`)}>
              {lead.appointment ? 'Reprogramar visita' : 'Agendar visita'}
            </button>
          </section>

          <section className="dsec">
            <h4>
              <Message size={16} /> Notas y actividad
            </h4>
            <form
              className="note-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!note.trim()) return;
                updateLead(lead.id, {}, note.trim());
                setNote('');
              }}
            >
              <input className="inp" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Escribe una nota (llamada, acuerdo, seguimiento…)" />
              <button className="btn btn--yellow btn--sm" type="submit" disabled={!note.trim()}>
                Guardar
              </button>
            </form>
            <ol className="timeline">
              {[...lead.notes].reverse().map((n, i) => (
                <li key={i}>
                  <span />
                  <div>
                    <p>{n.text}</p>
                    <small>
                      {n.by} · {new Date(n.at).toLocaleString('es-PR', { dateStyle: 'medium', timeStyle: 'short' })}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </motion.aside>
    </motion.div>
  );
}
