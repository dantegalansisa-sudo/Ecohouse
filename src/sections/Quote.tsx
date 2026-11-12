import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import RevealText from '../components/RevealText';
import Calendar, { labelOf } from '../components/Calendar';
import { ArrowUpRight, Check, ChevronLeft, FileText, Home, Mail, MapPin, Phone, Store as StoreIcon, Upload, WhatsApp, X } from '../components/Icons';
import { CONTACT, EASINGS } from '../utils/easings';
import { TOWNS } from '../lib/towns';
import { estimate, money } from '../lib/estimate';
import { addLead, type Lead } from '../lib/crm';
import { saveFile } from '../lib/files';
import { productStore } from '../lib/products';
import { quoteList } from '../lib/quoteList';
import { backupNeeds } from './BackupCalc';
import { readBill, rpc, uploadBill, type BillAI } from '../lib/ai';
import { Sun } from '../components/Icons';

const STEP_NAMES = ['Propiedad', 'Factura', 'Datos', 'Visita', 'Listo'];
const MAX_MB = 10;
const ACCEPT = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export default function Quote() {
  const products = productStore.use();
  const list = quoteList.use();
  const needs = backupNeeds.use();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [property, setProperty] = useState<'Residencial' | 'Comercial'>('Residencial');
  const [file, setFile] = useState<File | null>(null);
  const [fileErr, setFileErr] = useState('');
  const [drag, setDrag] = useState(false);
  const [bill, setBill] = useState('');
  const [kwh, setKwh] = useState('');
  const [help, setHelp] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', town: '', address: '' });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geo, setGeo] = useState<'idle' | 'loading' | 'error'>('idle');
  const [consent, setConsent] = useState(true);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [sending, setSending] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);
  const [ai, setAi] = useState<BillAI | null>(null);
  const [aiState, setAiState] = useState<'idle' | 'reading' | 'error'>('idle');
  const [aiErr, setAiErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const preview = useMemo(() => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : ''), [file]);
  const est = +bill > 0 ? estimate(+bill, +kwh || undefined) : null;

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const validPhone = form.phone.replace(/\D/g, '').length >= 10;
  const validTown = TOWNS.includes(form.town);
  const ok = [true, !!file || +bill > 0, form.name.trim().split(' ').length >= 2 && validPhone && validEmail && validTown && consent, !date || !!time, true][step];

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    document.getElementById('cotizar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const pick = (f?: File | null) => {
    if (!f) return;
    if (!ACCEPT.includes(f.type) && !/\.(pdf|jpe?g|png|heic|webp)$/i.test(f.name)) return setFileErr('Formato no válido. Usa PDF, JPG o PNG.');
    if (f.size > MAX_MB * 1024 * 1024) return setFileErr(`El archivo supera ${MAX_MB} MB.`);
    setFileErr('');
    setFile(f);
    analyze(f);
  };

  // Sol lee la factura: total, consumo y el historial de 12 meses de la gráfica
  const analyze = async (f: File) => {
    setAi(null);
    setAiErr('');
    setAiState('reading');
    try {
      const r = await readBill(f);
      if (!r.es_factura) {
        setAiState('error');
        setAiErr('No parece una factura de luz. Revisa el archivo o escribe los datos abajo.');
        return;
      }
      setAi(r);
      setAiState('idle');
      if (r.total_a_pagar) setBill(String(Math.round(r.total_a_pagar * 100) / 100));
      const k = r.promedio_kwh ?? r.consumo_kwh;
      if (k) setKwh(String(k));
    } catch (e) {
      setAiState('error');
      setAiErr(e instanceof Error ? e.message : 'No pudimos leerla automáticamente.');
    }
  };

  const locate = () => {
    if (!navigator.geolocation) return setGeo('error');
    setGeo('loading');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) });
        setGeo('idle');
      },
      () => setGeo('error'),
      { timeout: 10000 }
    );
  };

  const submit = async () => {
    setSending(true);
    let stored: Lead['file'];
    if (file) {
      const id = `bill-${Date.now()}`;
      try {
        await saveFile(id, file);
        stored = { id, name: file.name, type: file.type, size: file.size };
      } catch {
        stored = undefined;
      }
    }
    let remoteCode: string | undefined;
    try {
      const path = file ? await uploadBill(file).catch(() => undefined) : undefined;
      const r = await rpc<{ code: string }>('create_lead', {
        p: {
          source: 'Cotización web',
          name: form.name.trim(),
          phone: form.phone,
          email: form.email.trim(),
          town: form.town,
          address: form.address,
          lat: coords?.lat ?? '',
          lng: coords?.lng ?? '',
          property,
          bill: +bill || '',
          kwh: +kwh || '',
          bill_ai: ai,
          bill_path: path,
          interests: list,
          message: needs,
          estimate: est,
          appointment_date: date,
          appointment_time: date ? time : '',
        },
      });
      remoteCode = r.code;
    } catch {
      /* sin conexión a la base: queda guardado localmente */
    }
    const created = addLead({
      name: form.name.trim(),
      phone: form.phone,
      email: form.email.trim(),
      town: form.town,
      address: form.address || undefined,
      coords: coords ?? undefined,
      property,
      bill: +bill || undefined,
      kwh: +kwh || undefined,
      file: stored,
      interests: list,
      message: needs || undefined,
      appointment: date && time ? { date, time, mode: 'Visita técnica' } : undefined,
      source: 'Cotización web',
      estimate: est ?? undefined,
    }, remoteCode);
    quoteList.set([]);
    backupNeeds.set('');
    setLead(created);
    setSending(false);
    go(4);
  };

  const summary = lead
    ? [
        `Hola Eco House, acabo de solicitar mi cotización (${lead.code}).`,
        `• Nombre: ${lead.name}`,
        `• Celular: ${lead.phone}`,
        `• Pueblo: ${lead.town}`,
        lead.bill ? `• Factura: $${lead.bill}/mes` : null,
        lead.appointment ? `• Visita: ${labelOf(lead.appointment.date)} ${lead.appointment.time}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  return (
    <section id="cotizar" className="booking">
      <div className="booking__bg">
        <img src="/img/house-glow.webp" alt="" loading="lazy" />
      </div>
      <div className="container booking__grid">
        <div className="booking__intro">
          <span className="eyebrow">10 · Cotización gratis</span>
          <RevealText tag="h2" className="h2" italic={['factura']}>
            Sube tu factura y recibe tu cotización.
          </RevealText>
          <p>Es rápido y fácil. Sube la foto o el PDF de tu factura de luz, cuéntanos dónde estás y recibe un estimado al instante. Un especialista te contacta con tu propuesta personalizada.</p>
          <ul className="booking__perks">
            <li>
              <Check size={16} /> Estimado de ahorro inmediato
            </li>
            <li>
              <Check size={16} /> Código para seguir tu proyecto
            </li>
            <li>
              <Check size={16} /> Agenda tu visita técnica en el mismo paso
            </li>
          </ul>
          <div className="booking__contact">
            <a href={`tel:+${CONTACT.phoneRaw}`}>
              <Phone size={18} /> {CONTACT.phone}
            </a>
            <a href={`mailto:${CONTACT.email}`}>
              <Mail size={18} /> {CONTACT.email}
            </a>
          </div>
        </div>

        <motion.div className="wizard" initial={{ y: 60 }} whileInView={{ y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 1, ease: EASINGS.premium }}>
          <div className="wizard__steps">
            {STEP_NAMES.map((n, i) => (
              <div key={n} className={`wizard__step ${i <= step ? 'on' : ''}`}>
                <span>{i < step ? <Check size={12} /> : i + 1}</span>
                <small>{n}</small>
              </div>
            ))}
            <div className="wizard__track">
              <motion.span animate={{ width: `${(step / 4) * 100}%` }} transition={{ ease: EASINGS.premium, duration: 0.6 }} />
            </div>
          </div>

          <div className="wizard__body">
            {/* cada paso se monta de inmediato con animación CSS: nunca queda bloqueado esperando una salida */}
            <div key={step} className={dir < 0 ? 'step-in step-in--back' : 'step-in'}>
                {step === 0 && (
                  <div className="wstep">
                    <h3>¿Para qué propiedad es?</h3>
                    <div className="choice-grid">
                      {(['Residencial', 'Comercial'] as const).map((id) => {
                        const Icon = id === 'Residencial' ? Home : StoreIcon;
                        return (
                          <button key={id} type="button" className={`choice ${property === id ? 'on' : ''}`} onClick={() => setProperty(id)}>
                            <Icon size={26} />
                            <strong>{id}</strong>
                            <small>{id === 'Residencial' ? 'Casa o apartamento' : 'Negocio, oficina o local'}</small>
                            {property === id && (
                              <motion.span layoutId="choice-check" className="choice__check">
                                <Check size={12} />
                              </motion.span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <h4>¿Qué te interesa? (opcional)</h4>
                    <div className="pills">
                      {products
                        .filter((p) => p.visible)
                        .map((p) => (
                          <button key={p.id} type="button" className={`pill ${list.includes(p.id) ? 'on' : ''}`} onClick={() => quoteList.set(list.includes(p.id) ? list.filter((x) => x !== p.id) : [...list, p.id])}>
                            {list.includes(p.id) && <Check size={13} />} {p.name}
                          </button>
                        ))}
                    </div>
                    {needs && <p className="wstep__note">🔋 {needs}</p>}
                  </div>
                )}

                {step === 1 && (
                  <div className="wstep">
                    <h3>Sube tu factura de luz</h3>
                    {!file ? (
                      <div
                        className={`drop ${drag ? 'drag' : ''}`}
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDrag(true);
                        }}
                        onDragLeave={() => setDrag(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDrag(false);
                          pick(e.dataTransfer.files[0]);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <motion.span className="drop__icon" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                          <Upload size={26} />
                        </motion.span>
                        <strong>Arrastra tu factura o toca para subirla</strong>
                        <small>PDF, JPG o PNG · máx. {MAX_MB} MB · también puedes tomarle una foto</small>
                      </div>
                    ) : (
                      <div className={`filecard pop-in ${aiState === 'reading' ? 'scan' : ''}`}>
                        {preview ? <img src={preview} alt="Vista previa de la factura" /> : <span className="filecard__pdf"><FileText size={28} /></span>}
                        <div>
                          <strong>{file.name}</strong>
                          <small>{aiState === 'reading' ? 'Sol está leyendo tu factura…' : `${(file.size / 1024 / 1024).toFixed(2)} MB · lista para enviar`}</small>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            setAi(null);
                            setAiState('idle');
                          }}
                          aria-label="Quitar archivo"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                    <input ref={inputRef} type="file" accept=".pdf,image/*" capture={undefined} hidden onChange={(e) => pick(e.target.files?.[0])} />
                    {fileErr && <p className="err">{fileErr}</p>}
                    {aiState === 'error' && (
                      <p className="err">
                        {aiErr}{' '}
                        {file && (
                          <button type="button" className="helpbtn" onClick={() => analyze(file)}>
                            Reintentar
                          </button>
                        )}
                      </p>
                    )}
                    {ai && <AiBill ai={ai} />}

                    <div className="fields__row bill-row">
                      <Field label="Total de tu factura ($/mes)" type="number" value={bill} onChange={setBill} />
                      <Field label="Consumo kWh (opcional)" type="number" value={kwh} onChange={setKwh} />
                    </div>
                    <button type="button" className="helpbtn" onClick={() => setHelp(!help)}>
                      ¿Dónde encuentro estos datos? {help ? '−' : '+'}
                    </button>
                    <AnimatePresence>
                      {help && (
                        <motion.div className="billhelp" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                          <div className="billmock">
                            <div className="billmock__row"><span>Cuenta</span><i /></div>
                            <div className="billmock__row billmock__hl"><span>Consumo del mes</span><b>kWh</b></div>
                            <div className="billmock__row"><span>Cargos</span><i /></div>
                            <div className="billmock__row billmock__hl"><span>Total a pagar</span><b>$</b></div>
                          </div>
                          <p>En tu factura busca <b>“Consumo”</b> (en kWh) y el <b>total a pagar</b>. Si no los tienes a mano, solo sube la foto y nosotros la leemos.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {est && (
                        <div className="estcard pop-in">
                          <span>Estimado preliminar</span>
                          <div className="estcard__grid">
                            <div>
                              <b>{est.kw} kW</b>
                              <small>sistema</small>
                            </div>
                            <div>
                              <b>{est.panels}</b>
                              <small>placas</small>
                            </div>
                            <div>
                              <b>{money(est.yearlySavings)}</b>
                              <small>ahorro/año</small>
                            </div>
                          </div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {step === 2 && (
                  <div className="wstep">
                    <h3>Regístrate para recibir tu cotización</h3>
                    <div className="fields">
                      <Field label="Nombre completo" value={form.name} onChange={(v) => setForm({ ...form, name: v })} autoComplete="name" />
                      <div className="fields__row">
                        <Field label="Teléfono celular" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} autoComplete="tel" error={form.phone.length > 3 && !validPhone} />
                        <Field label="Correo electrónico" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} autoComplete="email" error={form.email.length > 4 && !validEmail} />
                      </div>
                      <div className="fields__row">
                        <Field label="Pueblo" value={form.town} onChange={(v) => setForm({ ...form, town: v })} list="towns" error={form.town.length > 2 && !validTown} />
                        <Field label="Dirección o urbanización (opcional)" value={form.address} onChange={(v) => setForm({ ...form, address: v })} autoComplete="street-address" />
                      </div>
                      <datalist id="towns">
                        {TOWNS.map((t) => (
                          <option key={t} value={t} />
                        ))}
                      </datalist>
                      <button type="button" className={`geo ${coords ? 'on' : ''}`} onClick={locate}>
                        <MapPin size={18} />
                        {coords ? `Ubicación guardada (${coords.lat}, ${coords.lng})` : geo === 'loading' ? 'Obteniendo ubicación…' : geo === 'error' ? 'No se pudo obtener. Intenta de nuevo' : 'Usar mi ubicación actual'}
                        {coords && <Check size={16} />}
                      </button>
                      <label className="consent">
                        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                        <span>Acepto que Eco House me contacte por teléfono, WhatsApp o email sobre mi cotización.</span>
                      </label>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="wstep">
                    <h3>¿Agendamos tu visita técnica?</h3>
                    <p className="wstep__sub">Opcional. Si prefieres, te llamamos primero.</p>
                    <Calendar date={date} time={time} onDate={setDate} onTime={setTime} />
                  </div>
                )}

                {step === 4 && lead && (
                  <div className="wstep wstep--done">
                    <div className="done__check pop-in">
                      <svg viewBox="0 0 52 52">
                        <path d="M14 27 l8 8 l16 -18" />
                      </svg>
                    </div>
                    <h3>¡Recibimos tu solicitud, {lead.name.split(' ')[0]}!</h3>
                    <div className="code">
                      <small>Tu código de proyecto</small>
                      <strong>{lead.code}</strong>
                    </div>
                    <div className="ticket">
                      <div>
                        <small>Factura</small>
                        <strong>{lead.file ? 'Recibida ✓' : lead.bill ? `$${lead.bill}/mes` : '—'}</strong>
                      </div>
                      <div>
                        <small>Sistema estimado</small>
                        <strong>{lead.estimate ? `${lead.estimate.kw} kW` : 'En evaluación'}</strong>
                      </div>
                      <div>
                        <small>Ahorro estimado</small>
                        <strong>{lead.estimate ? `${money(lead.estimate.yearlySavings)}/año` : '—'}</strong>
                      </div>
                      <div>
                        <small>Visita</small>
                        <strong>{lead.appointment ? `${labelOf(lead.appointment.date).split(',')[0]} ${lead.appointment.time}` : 'Te llamamos'}</strong>
                      </div>
                    </div>
                    <div className="done__actions">
                      <a className="btn btn--wa" href={`https://wa.me/${CONTACT.phoneRaw}?text=${encodeURIComponent(summary)}`} target="_blank" rel="noreferrer">
                        <WhatsApp size={20} /> Avisar por WhatsApp
                      </a>
                      <a className="btn btn--ghost" href={`#/portal?code=${lead.code}`}>
                        Ver mi proyecto <ArrowUpRight size={16} />
                      </a>
                    </div>
                  </div>
                )}
            </div>
          </div>

          <div className="wizard__foot">
            {step > 0 && step < 4 ? (
              <button type="button" className="btn btn--text" onClick={() => go(step - 1)}>
                <ChevronLeft size={18} /> Atrás
              </button>
            ) : (
              <span />
            )}
            {step < 3 && (
              <button type="button" className="btn btn--yellow" disabled={!ok} onClick={() => go(step + 1)}>
                Continuar <ArrowUpRight size={18} />
              </button>
            )}
            {step === 3 && (
              <button type="button" className="btn btn--yellow" disabled={!ok || sending} onClick={submit}>
                {sending ? 'Enviando…' : date ? 'Enviar y agendar' : 'Enviar sin agendar'} <Check size={18} />
              </button>
            )}
            {step === 4 && (
              <button
                type="button"
                className="btn btn--text"
                onClick={() => {
                  setFile(null);
                  setBill('');
                  setKwh('');
                  setDate('');
                  setTime('');
                  setCoords(null);
                  setForm({ name: '', phone: '', email: '', town: '', address: '' });
                  setLead(null);
                  go(0);
                }}
              >
                Nueva cotización
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  error,
  list,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  error?: boolean;
  list?: string;
}) {
  return (
    <label className={`field ${value ? 'filled' : ''} ${error ? 'error' : ''}`}>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} placeholder=" " list={list} min={type === 'number' ? 0 : undefined} />
      <span>{label}</span>
    </label>
  );
}

function AiBill({ ai }: { ai: BillAI }) {
  const max = Math.max(1, ...ai.historial.map((h) => h.kwh));
  return (
    <div className="aibill pop-in">
      <div className="aibill__head">
        <Sun size={16} /> Factura leída por IA
        <em>Confianza {ai.confianza}</em>
      </div>
      <div className="aibill__grid">
        <div>
          <b>{ai.total_a_pagar != null ? `$${ai.total_a_pagar}` : '—'}</b>
          <small>total del mes</small>
        </div>
        <div>
          <b>{ai.consumo_kwh != null ? `${ai.consumo_kwh} kWh` : '—'}</b>
          <small>consumo del mes</small>
        </div>
        <div>
          <b>{ai.promedio_kwh != null ? `${ai.promedio_kwh} kWh` : '—'}</b>
          <small>{ai.historial.length > 1 ? `promedio ${ai.historial.length} meses` : 'para tu estimado'}</small>
        </div>
      </div>
      {ai.historial.length > 1 && (
        <div className="aibill__chart" aria-label="Historial de consumo">
          {ai.historial.map((h, i) => (
            <div key={i} title={`${h.mes}: ${h.kwh} kWh`}>
              <motion.span initial={{ height: 0 }} animate={{ height: `${(h.kwh / max) * 100}%` }} transition={{ delay: i * 0.04 }} />
              <small>{h.mes.slice(0, 3)}</small>
            </div>
          ))}
        </div>
      )}
      <p>
        {ai.nota} {ai.historial.length > 1 && 'Usamos tu promedio anual para dimensionar el sistema, no un solo mes.'}
      </p>
    </div>
  );
}
