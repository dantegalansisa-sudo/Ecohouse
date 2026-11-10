import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import RevealText from '../components/RevealText';
import { ArrowUpRight, Check, Drop, Plus, Search, WhatsApp, X } from '../components/Icons';
import { CATEGORIES, productStore, type Category, type Product } from '../lib/products';
import { quoteList, toggleQuote } from '../lib/quoteList';
import { CONTACT, EASINGS } from '../utils/easings';
import { scrollToId } from '../utils/scroll';

export function ProductImage({ p, className = '' }: { p: Product; className?: string }) {
  if (!p.img)
    return (
      <div className={`pimg pimg--empty ${className}`}>
        <Drop size={56} />
      </div>
    );
  const cutout = p.img.includes('delta') || p.img.includes('panel-cut');
  return (
    <div className={`pimg ${cutout ? 'pimg--cutout' : ''} ${className}`}>
      <img src={p.img} alt={p.name} loading="lazy" />
    </div>
  );
}

const STOCK = { disponible: 'Disponible', pocas: 'Últimas unidades', agotado: 'Agotado' };

export default function Store() {
  const products = productStore.use();
  const list = quoteList.use();
  const [cat, setCat] = useState<Category | 'todos'>('todos');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Product | null>(null);

  const visible = useMemo(
    () =>
      products.filter(
        (p) =>
          p.visible &&
          (cat === 'todos' || p.category === cat) &&
          (q === '' || `${p.name} ${p.brand} ${p.tagline}`.toLowerCase().includes(q.toLowerCase()))
      ),
    [products, cat, q]
  );

  return (
    <section id="tienda" className="store">
      <div className="container">
        <div className="store__head">
          <div>
            <span className="eyebrow eyebrow--dark">07 · Tienda solar</span>
            <RevealText tag="h2" className="h2" italic={['solar.']}>
              Productos de energía solar.
            </RevealText>
          </div>
          <label className="store__search">
            <Search size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar baterías, marcas…" />
          </label>
        </div>

        <div className="chips" role="tablist">
          {CATEGORIES.map((c) => {
            const count = c.id === 'todos' ? products.filter((p) => p.visible).length : products.filter((p) => p.visible && p.category === c.id).length;
            return (
              <button key={c.id} className={`chip ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}>
                {cat === c.id && <motion.span layoutId="chip-bg" className="chip__bg" />}
                <span>
                  {c.label} <i>{count}</i>
                </span>
              </button>
            );
          })}
        </div>

        <motion.div layout className="pgrid">
          <AnimatePresence mode="popLayout">
            {visible.map((p, i) => {
              const added = list.includes(p.id);
              return (
                <motion.article
                  layout
                  key={p.id}
                  className="pcard"
                  initial={{ opacity: 0, y: 40, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: i * 0.04, ease: EASINGS.premium }}
                  whileHover={{ y: -8 }}
                >
                  <button className="pcard__media" onClick={() => setOpen(p)}>
                    <ProductImage p={p} />
                    {p.badge && <span className="pcard__badge">{p.badge}</span>}
                  </button>
                  <div className="pcard__body">
                    <span className={`stock stock--${p.stock}`}>{STOCK[p.stock]}</span>
                    <small className="pcard__brand">{p.brand}</small>
                    <h3>{p.name}</h3>
                    <p>{p.tagline}</p>
                    <div className="pcard__foot">
                      <span className="pcard__price">{p.price ? `$${p.price.toLocaleString('en-US')}` : 'Precio en cotización'}</span>
                      <button className={`pcard__add ${added ? 'on' : ''}`} onClick={() => toggleQuote(p.id)} aria-label={added ? 'Quitar de la cotización' : 'Añadir a la cotización'}>
                        {added ? <Check size={18} /> : <Plus size={18} />}
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
        {visible.length === 0 && <p className="store__empty">No encontramos productos con esa búsqueda.</p>}

        <AnimatePresence>
          {list.length > 0 && (
            <motion.div className="qbar" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ ease: EASINGS.premium, duration: 0.5 }}>
              <div className="qbar__thumbs">
                {list.slice(0, 4).map((id) => {
                  const p = products.find((x) => x.id === id);
                  return p ? <ProductImage key={id} p={p} className="qbar__thumb" /> : null;
                })}
              </div>
              <span>
                <b>{list.length}</b> {list.length === 1 ? 'producto' : 'productos'} en tu cotización
              </span>
              <button className="btn btn--yellow btn--sm" onClick={() => scrollToId('cotizar')}>
                Cotizar ahora <ArrowUpRight size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)} data-lenis-prevent>
            <motion.div
              className="modal__card pmodal"
              initial={{ y: 60, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ ease: EASINGS.premium, duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal__close" onClick={() => setOpen(null)} aria-label="Cerrar">
                <X size={20} />
              </button>
              <ProductImage p={open} className="pmodal__img" />
              <div className="pmodal__info">
                <small className="pcard__brand">{open.brand}</small>
                <h3>{open.name}</h3>
                <p>{open.tagline}</p>
                <ul>
                  {open.specs.map((s) => (
                    <li key={s}>
                      <Check size={16} /> {s}
                    </li>
                  ))}
                </ul>
                <div className="pmodal__price">{open.price ? `$${open.price.toLocaleString('en-US')}` : 'Precio personalizado en tu cotización'}</div>
                <div className="pmodal__actions">
                  <button className="btn btn--yellow" onClick={() => toggleQuote(open.id)}>
                    {list.includes(open.id) ? (
                      <>
                        <Check size={18} /> En tu cotización
                      </>
                    ) : (
                      <>
                        <Plus size={18} /> Añadir a mi cotización
                      </>
                    )}
                  </button>
                  <a className="btn btn--wa" href={`https://wa.me/${CONTACT.phoneRaw}?text=${encodeURIComponent(`Hola Eco House, me interesa: ${open.name}. ¿Me pueden dar más información?`)}`} target="_blank" rel="noreferrer">
                    <WhatsApp size={18} /> Preguntar
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
