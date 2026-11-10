import { useState } from 'react';
import { motion } from 'framer-motion';
import { addLead, type Lead, type Source } from '../lib/crm';
import { estimate } from '../lib/estimate';
import { TOWNS } from '../lib/towns';
import { X } from '../components/Icons';
import { EASINGS } from '../utils/easings';

// Alta manual: para leads que llegan por teléfono, ferias o referidos
export default function NewLead({ onClose, onCreated }: { onClose: () => void; onCreated: (l: Lead) => void }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', town: '', address: '', bill: '', property: 'Residencial' as Lead['property'], source: 'Contacto' as Source });
  const valid = f.name.trim().length > 2 && (f.phone.replace(/\D/g, '').length >= 10 || f.email.includes('@')) && !!f.town;

  return (
    <motion.div className="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.form
        className="modal__card pform"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ ease: EASINGS.premium }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          const bill = +f.bill || undefined;
          onCreated(
            addLead({
              name: f.name.trim(),
              phone: f.phone,
              email: f.email.trim(),
              town: f.town,
              address: f.address || undefined,
              property: f.property,
              bill,
              interests: [],
              source: f.source,
              estimate: bill ? estimate(bill) : undefined,
            })
          );
        }}
      >
        <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>
        <h3>Nuevo cliente</h3>
        <div className="pform__grid">
          {(
            [
              ['name', 'Nombre completo', 'text'],
              ['phone', 'Teléfono celular', 'tel'],
              ['email', 'Correo electrónico', 'email'],
              ['address', 'Dirección', 'text'],
              ['bill', 'Factura mensual $', 'number'],
            ] as const
          ).map(([k, l, t]) => (
            <label key={k} className="lbl">
              {l}
              <input className="inp" type={t} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
            </label>
          ))}
          <label className="lbl">
            Pueblo
            <select value={f.town} onChange={(e) => setF({ ...f, town: e.target.value })}>
              <option value="">Selecciona…</option>
              {TOWNS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="lbl">
            Tipo
            <select value={f.property} onChange={(e) => setF({ ...f, property: e.target.value as Lead['property'] })}>
              <option>Residencial</option>
              <option>Comercial</option>
            </select>
          </label>
          <label className="lbl">
            Origen
            <select value={f.source} onChange={(e) => setF({ ...f, source: e.target.value as Source })}>
              <option>Contacto</option>
              <option>Cotización web</option>
              <option>Tienda</option>
              <option>Agenda</option>
            </select>
          </label>
        </div>
        <div className="pform__foot">
          <button type="submit" className="btn btn--yellow" disabled={!valid}>
            Crear cliente
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
