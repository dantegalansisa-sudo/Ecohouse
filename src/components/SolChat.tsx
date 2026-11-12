import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { askSol, readBill, uploadBill, type BillContext, type ChatCard, type ChatTurn } from '../lib/ai';
import { addLead, crm } from '../lib/crm';
import { money } from '../lib/estimate';
import { productStore } from '../lib/products';
import { quoteList, toggleQuote } from '../lib/quoteList';
import { labelOf } from './Calendar';
import { ProductImage } from '../sections/Store';
import { ArrowUpRight, Camera, Check, FileText, Plus, Sun, WhatsApp, X } from './Icons';
import { EASINGS } from '../utils/easings';
import { scrollToId } from '../utils/scroll';

const STORE = 'eh-sol-v1';
const WELCOME: ChatTurn = {
  role: 'assistant',
  content: '¡Hola! Soy **Sol**, el asistente de Eco House ☀️\nTe ayudo a calcular cuánto puedes ahorrar, qué batería necesitas para los apagones y a pedir tu cotización gratis. ¿Por dónde empezamos?',
};
const CHIPS = ['📷 Enviar foto de mi factura', '¿Cuánto puedo ahorrar?', '¿Qué batería necesito para los apagones?', '¿Cómo funciona la instalación?', 'Quiero mi cotización gratis'];

interface Saved {
  turns: ChatTurn[];
  session: string;
  leadCode?: string;
  bill?: BillContext;
}

function load(): Saved {
  try {
    const s = JSON.parse(sessionStorage.getItem(STORE) || 'null');
    if (s?.turns) return s;
  } catch {
    /* sin almacenamiento */
  }
  return { turns: [], session: crypto.randomUUID?.() ?? String(Date.now()) };
}

// Markdown mínimo: **negrita**, viñetas y saltos de línea
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => {
        const bullet = /^\s*[-•]\s+/.test(line);
        const parts = line.replace(/^\s*[-•]\s+/, '').split(/(\*\*[^*]+\*\*)/g);
        const content = parts.map((p, k) => (p.startsWith('**') && p.endsWith('**') ? <b key={k}>{p.slice(2, -2)}</b> : p));
        return bullet ? (
          <span key={i} className="sol-li">
            {content}
          </span>
        ) : (
          <span key={i} className="sol-p">
            {content}
          </span>
        );
      })}
    </>
  );
}

export function openSol(prompt?: string) {
  window.dispatchEvent(new CustomEvent('sol:open', { detail: prompt }));
}

export default function SolChat({ ready }: { ready: boolean }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<Saved>(load);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [teaser, setTeaser] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(saved));
    } catch {
      /* sin almacenamiento */
    }
  }, [saved]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [saved.turns.length, busy, open]);

  useEffect(() => {
    if (!ready || sessionStorage.getItem('eh-sol-teased')) return;
    const t = setTimeout(() => setTeaser(true), 9000);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    const on = (e: Event) => {
      setOpen(true);
      setTeaser(false);
      const p = (e as CustomEvent<string | undefined>).detail;
      if (p) setTimeout(() => send(p), 250);
    };
    window.addEventListener('sol:open', on);
    return () => window.removeEventListener('sol:open', on);
  });

  const send = async (text: string, extra?: { cards?: ChatCard[]; bill?: BillContext }) => {
    const msg = text.trim();
    if (!msg || (busy && !extra)) return;
    if (msg.startsWith('📷')) return fileRef.current?.click();
    setErr('');
    setInput('');
    const turns: ChatTurn[] = [...saved.turns, { role: 'user', content: msg, cards: extra?.cards }];
    const bill = extra?.bill ?? saved.bill;
    setSaved((s) => ({ ...s, turns, bill }));
    setBusy(true);
    try {
      const r = await askSol([WELCOME, ...turns], saved.session, saved.leadCode, bill);
      r.cards.forEach((c) => {
        // reflejo local para que la cotización aparezca también en "Mi proyecto" de este navegador
        if (c.type === 'lead' && !crm.get().some((l) => l.code === c.code))
          addLead({ name: c.name, phone: c.phone, email: c.email, town: c.town, property: c.property, bill: c.bill, estimate: c.estimate, interests: [], source: 'Chat IA' }, c.code);
      });
      setSaved((s) => ({ ...s, leadCode: r.leadCode ?? s.leadCode, turns: [...turns, { role: 'assistant', content: r.reply, cards: r.cards }] }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No pude responder. Intenta de nuevo.');
      setSaved((s) => ({ ...s, turns }));
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  // El cliente le envía la foto o el PDF de su factura a Sol
  const sendBill = async (file?: File | null) => {
    if (!file || busy) return;
    if (file.size > 10 * 1024 * 1024) return setErr('El archivo supera 10 MB.');
    setErr('');
    setBusy(true);
    try {
      const [ai, path] = await Promise.all([readBill(file), uploadBill(file).catch(() => undefined)]);
      if (!ai.es_factura) {
        setSaved((s) => ({
          ...s,
          turns: [...s.turns, { role: 'user', content: `Te envié ${file.name}` }, { role: 'assistant', content: 'Mmm, eso no parece una factura de luz 🤔 ¿Puedes enviarme una foto clara de tu factura de LUMA? También puedes escribirme cuánto pagas al mes.' }],
        }));
        setBusy(false);
        return;
      }
      const bill: BillContext = {
        total: ai.total_a_pagar,
        kwh: ai.consumo_kwh,
        promedio: ai.promedio_kwh,
        meses: ai.historial.length,
        periodo: ai.periodo,
        confianza: ai.confianza,
        path,
        ai,
      };
      const card: ChatCard = { type: 'bill', name: file.name, total: ai.total_a_pagar, kwh: ai.consumo_kwh, promedio: ai.promedio_kwh, historial: ai.historial, confianza: ai.confianza };
      await send('Te envié mi factura de luz. ¿Cuánto puedo ahorrar?', { cards: [card], bill });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No pude leer la factura. Intenta con una foto más clara.');
      setBusy(false);
    }
  };

  const reset = () => setSaved({ turns: [], session: crypto.randomUUID?.() ?? String(Date.now()) });
  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <>
      <AnimatePresence>
        {!open && ready && (
          <motion.div className="sol-launch" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ ease: EASINGS.bounce, duration: 0.6, delay: 0.4 }}>
            <AnimatePresence>
              {teaser && (
                <motion.div className="sol-teaser" initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  <button
                    className="sol-teaser__x"
                    aria-label="Cerrar"
                    onClick={() => {
                      setTeaser(false);
                      sessionStorage.setItem('eh-sol-teased', '1');
                    }}
                  >
                    <X size={14} />
                  </button>
                  <button
                    className="sol-teaser__msg"
                    onClick={() => {
                      setOpen(true);
                      setTeaser(false);
                      sessionStorage.setItem('eh-sol-teased', '1');
                    }}
                  >
                    ¿Cuánto podrías ahorrar en tu factura de LUMA? <b>Pregúntame ☀️</b>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <button className="sol-fab" onClick={() => setOpen(true)} aria-label="Abrir chat con Sol, asistente de Eco House">
              <span className="sol-avatar">
                <Sun size={22} />
              </span>
              <span className="sol-fab__txt">
                <b>Pregúntale a Sol</b>
                <small>Asistente IA · en línea</small>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.section
            className="sol"
            data-lenis-prevent
            role="dialog"
            aria-label="Chat con Sol"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ ease: EASINGS.premium, duration: 0.45 }}
          >
            <header className="sol__head">
              <span className="sol-avatar sol-avatar--lg">
                <Sun size={24} />
              </span>
              <div>
                <strong>Sol</strong>
                <small>
                  <span className="pulse" /> Asistente IA de Eco House
                </small>
              </div>
              {saved.turns.length > 0 && (
                <button className="sol__reset" onClick={reset}>
                  Nueva
                </button>
              )}
              <button className="sol__close" onClick={() => setOpen(false)} aria-label="Cerrar chat">
                <X size={20} />
              </button>
            </header>

            <div className="sol__body" ref={bodyRef}>
              {[WELCOME, ...saved.turns].map((t, i) => (
                <motion.div key={i} className={`sol-msg sol-msg--${t.role}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  {t.content && (
                    <div className="sol-bubble">
                      <Rich text={t.content} />
                    </div>
                  )}
                  {t.cards?.map((c, k) => (
                    <Card key={k} card={c} onSend={send} onGo={go} />
                  ))}
                </motion.div>
              ))}
              {saved.turns.length === 0 && (
                <div className="sol-chips">
                  {CHIPS.map((c) => (
                    <button key={c} onClick={() => send(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              )}
              {busy && (
                <div className="sol-msg sol-msg--assistant">
                  <div className="sol-bubble sol-typing">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              )}
              {err && <p className="sol-err">{err}</p>}
            </div>

            <form
              className="sol__input"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <button type="button" className="sol__attach" onClick={() => fileRef.current?.click()} disabled={busy} aria-label="Enviar foto o PDF de tu factura" title="Enviar mi factura">
                <Camera size={20} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                hidden
                onChange={(e) => {
                  sendBill(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={1200}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Escribe tu pregunta…"
                aria-label="Mensaje para Sol"
              />
              <button type="submit" disabled={!input.trim() || busy} aria-label="Enviar">
                <ArrowUpRight size={20} />
              </button>
            </form>
            <small className="sol__legal">Sol es una IA y puede equivocarse. Los montos son estimados preliminares.</small>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

function Card({ card, onSend, onGo }: { card: ChatCard; onSend: (t: string) => void; onGo: (id: string) => void }) {
  const products = productStore.use();
  const list = quoteList.use();

  switch (card.type) {
    case 'estimate':
      return (
        <div className="scard scard--navy">
          <span className="scard__k">Tu estimado · factura ${card.bill}/mes</span>
          <div className="scard__grid">
            <div>
              <b>{card.kw} kW</b>
              <small>sistema</small>
            </div>
            <div>
              <b>{card.panels}</b>
              <small>placas</small>
            </div>
            <div>
              <b>{money(card.yearlySavings)}</b>
              <small>ahorro/año</small>
            </div>
            <div>
              <b>{card.batteryKwh} kWh</b>
              <small>batería</small>
            </div>
          </div>
          <button className="scard__btn" onClick={() => onGo('cotizar')}>
            Precisarlo con mi factura <ArrowUpRight size={14} />
          </button>
        </div>
      );
    case 'backup':
      return (
        <div className="scard">
          <span className="scard__k">
            Respaldo de {card.hours} h · {card.kwh} kWh · pico {card.peak.toLocaleString('en-US')}W
          </span>
          {card.options.map((o) => {
            const p = products.find((x) => x.id === o.id);
            return (
              <div key={o.id} className="scard__row">
                {p && <ProductImage p={p} className="scard__img" />}
                <div>
                  <strong>
                    {o.units}× {o.name}
                  </strong>
                  <small>
                    {o.total} kWh {o.powerOk ? '· cubre tu potencia' : '· requiere inversor'}
                  </small>
                </div>
                <button className={`scard__add ${list.includes(o.id) ? 'on' : ''}`} onClick={() => toggleQuote(o.id)} aria-label="Añadir a mi cotización">
                  {list.includes(o.id) ? <Check size={14} /> : <Plus size={14} />}
                </button>
              </div>
            );
          })}
        </div>
      );
    case 'products':
      return (
        <div className="scard-scroll">
          {card.ids.map((id) => {
            const p = products.find((x) => x.id === id);
            if (!p) return null;
            return (
              <div key={id} className="sprod">
                <ProductImage p={p} className="sprod__img" />
                <strong>{p.name}</strong>
                <button className={`sprod__add ${list.includes(id) ? 'on' : ''}`} onClick={() => toggleQuote(id)}>
                  {list.includes(id) ? (
                    <>
                      <Check size={13} /> En mi cotización
                    </>
                  ) : (
                    <>
                      <Plus size={13} /> Añadir
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      );
    case 'lead':
      return (
        <div className="scard scard--ok">
          <span className="scard__k">Solicitud registrada</span>
          <div className="scard__code">{card.code}</div>
          <small>Guarda este código para seguir tu proyecto.</small>
          <a className="scard__btn" href={`#/portal?code=${card.code}`}>
            Ver mi proyecto <ArrowUpRight size={14} />
          </a>
        </div>
      );
    case 'slots':
      return (
        <div className="scard">
          <span className="scard__k">{labelOf(card.date)}</span>
          {card.slots.length ? (
            <div className="scard__slots">
              {card.slots.map((s) => (
                <button key={s} onClick={() => onSend(`Agéndame el ${labelOf(card.date)} a las ${s}`)}>
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <small>No quedan horarios ese día.</small>
          )}
        </div>
      );
    case 'visit':
      return (
        <div className="scard scard--ok">
          <span className="scard__k">Visita técnica confirmada</span>
          <strong>
            {labelOf(card.date)} · {card.time}
          </strong>
          <small>Código {card.code}</small>
        </div>
      );
    case 'bill': {
      const max = Math.max(1, ...card.historial.map((h) => h.kwh));
      return (
        <div className="scard scard--bill">
          <span className="scard__k">
            <FileText size={13} /> Factura leída por IA · confianza {card.confianza}
          </span>
          <div className="scard__grid">
            <div>
              <b>{card.total != null ? `$${card.total}` : '—'}</b>
              <small>total del mes</small>
            </div>
            <div>
              <b>{card.promedio ?? card.kwh ?? '—'} kWh</b>
              <small>{card.historial.length > 1 ? `promedio ${card.historial.length} meses` : 'consumo del mes'}</small>
            </div>
          </div>
          {card.historial.length > 1 && (
            <div className="aibill__chart">
              {card.historial.map((h, i) => (
                <div key={i} title={`${h.mes}: ${h.kwh} kWh`}>
                  <span style={{ height: `${(h.kwh / max) * 100}%` }} />
                  <small>{h.mes.slice(0, 1)}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    case 'human':
      return (
        <a className="scard scard--wa" href={card.url} target="_blank" rel="noreferrer">
          <WhatsApp size={20} /> Hablar con un especialista por WhatsApp
        </a>
      );
  }
}
