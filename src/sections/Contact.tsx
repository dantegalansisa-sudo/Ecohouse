import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import RevealText from '../components/RevealText';
import { Check, Mail, MapPin, Phone, WhatsApp } from '../components/Icons';
import { CONTACT, EASINGS } from '../utils/easings';
import { addLead } from '../lib/crm';
import { TOWNS } from '../lib/towns';
import { Field } from './Quote';

export default function Contact() {
  const [f, setF] = useState({ name: '', email: '', phone: '', town: '', message: '' });
  const [sent, setSent] = useState(false);
  const valid = f.name.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) && f.message.trim().length > 4;

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    addLead({
      name: f.name.trim(),
      email: f.email.trim(),
      phone: f.phone,
      town: TOWNS.includes(f.town) ? f.town : f.town || 'Sin indicar',
      property: 'Residencial',
      interests: [],
      message: f.message.trim(),
      source: 'Contacto',
    });
    setSent(true);
  };

  return (
    <section id="contacto" className="contact">
      <div className="container contact__grid">
        <div>
          <span className="eyebrow">12 · Contacto</span>
          <RevealText tag="h2" className="h2" italic={['solar?']}>
            ¿Listo para cambiar a energía solar?
          </RevealText>
          <p className="contact__text">Escríbenos y un especialista de Eco House te responde. También puedes llamarnos o escribirnos por WhatsApp.</p>
          <div className="contact__cards">
            <a href={`tel:+${CONTACT.phoneRaw}`}>
              <Phone size={20} />
              <span>Llámanos</span>
              <b>{CONTACT.phone}</b>
            </a>
            <a href={`https://wa.me/${CONTACT.phoneRaw}`} target="_blank" rel="noreferrer">
              <WhatsApp size={20} />
              <span>WhatsApp</span>
              <b>Escríbenos</b>
            </a>
            <a href={`mailto:${CONTACT.email}`}>
              <Mail size={20} />
              <span>Email</span>
              <b>{CONTACT.email}</b>
            </a>
            <div>
              <MapPin size={20} />
              <span>Servicio</span>
              <b>Todo Puerto Rico</b>
            </div>
          </div>
        </div>

        <motion.form className="cform" onSubmit={send} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: EASINGS.premium }}>
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="ok" className="cform__ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <span className="done__check">
                  <Check size={30} />
                </span>
                <h3>¡Mensaje enviado!</h3>
                <p>Gracias, {f.name.split(' ')[0]}. Te contactaremos muy pronto.</p>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setSent(false);
                    setF({ name: '', email: '', phone: '', town: '', message: '' });
                  }}
                >
                  Enviar otro mensaje
                </button>
              </motion.div>
            ) : (
              <motion.div key="form" className="fields" exit={{ opacity: 0 }}>
                <Field label="Nombre" value={f.name} onChange={(v) => setF({ ...f, name: v })} autoComplete="name" />
                <div className="fields__row">
                  <Field label="Correo electrónico" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} autoComplete="email" />
                  <Field label="Teléfono (opcional)" type="tel" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} autoComplete="tel" />
                </div>
                <Field label="Pueblo (opcional)" value={f.town} onChange={(v) => setF({ ...f, town: v })} list="towns-c" />
                <datalist id="towns-c">
                  {TOWNS.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                <label className={`field field--area ${f.message ? 'filled' : ''}`}>
                  <textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder=" " rows={5} />
                  <span>Mensaje</span>
                </label>
                <button type="submit" className="btn btn--yellow" disabled={!valid}>
                  Enviar mensaje
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>
      </div>
    </section>
  );
}
