import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CATEGORIES, productStore, type Category, type Product } from '../lib/products';
import { Edit, Eye, EyeOff, Plus, X } from '../components/Icons';
import { ProductImage } from '../sections/Store';
import { EASINGS } from '../utils/easings';

const EMPTY: Product = { id: '', name: '', brand: '', category: 'baterias', tagline: '', specs: [], visible: true, stock: 'disponible' };

export default function ProductsAdmin() {
  const products = productStore.use();
  const [edit, setEdit] = useState<Product | null>(null);

  const save = (p: Product) => {
    if (!p.id) p = { ...p, id: p.name.toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-') + '-' + Date.now().toString(36) };
    productStore.set((all) => (all.some((x) => x.id === p.id) ? all.map((x) => (x.id === p.id ? p : x)) : [...all, p]));
    setEdit(null);
  };

  return (
    <div>
      <div className="padm__bar">
        <p>Lo que edites aquí se refleja al instante en la tienda del sitio.</p>
        <button className="btn btn--dark btn--sm" onClick={() => setEdit({ ...EMPTY })}>
          <Plus size={16} /> Nuevo producto
        </button>
      </div>
      <div className="padm">
        {products.map((p) => (
          <div key={p.id} className={`padm__item ${p.visible ? '' : 'hidden'}`}>
            <ProductImage p={p} className="padm__img" />
            <div className="padm__info">
              <small>
                {p.brand} · {CATEGORIES.find((c) => c.id === p.category)?.label}
              </small>
              <strong>{p.name}</strong>
              <span>{p.price ? `$${p.price.toLocaleString('en-US')}` : 'Sin precio · “Cotizar”'}</span>
              <span className={`stock stock--${p.stock}`}>{p.stock}</span>
            </div>
            <div className="padm__acts">
              <button onClick={() => productStore.set((all) => all.map((x) => (x.id === p.id ? { ...x, visible: !x.visible } : x)))} title={p.visible ? 'Ocultar de la tienda' : 'Mostrar en la tienda'}>
                {p.visible ? <Eye size={17} /> : <EyeOff size={17} />}
              </button>
              <button onClick={() => setEdit(p)} title="Editar">
                <Edit size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {edit && (
          <motion.div className="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEdit(null)}>
            <motion.form
              className="modal__card pform"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ ease: EASINGS.premium }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={(e) => {
                e.preventDefault();
                save(edit);
              }}
            >
              <button type="button" className="modal__close" onClick={() => setEdit(null)} aria-label="Cerrar">
                <X size={20} />
              </button>
              <h3>{edit.id ? 'Editar producto' : 'Nuevo producto'}</h3>
              <div className="pform__grid">
                <Inp label="Nombre" value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} required />
                <Inp label="Marca" value={edit.brand} onChange={(v) => setEdit({ ...edit, brand: v })} />
                <label className="lbl">
                  Categoría
                  <select value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value as Category })}>
                    {CATEGORIES.filter((c) => c.id !== 'todos').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="lbl">
                  Inventario
                  <select value={edit.stock} onChange={(e) => setEdit({ ...edit, stock: e.target.value as Product['stock'] })}>
                    <option value="disponible">Disponible</option>
                    <option value="pocas">Últimas unidades</option>
                    <option value="agotado">Agotado</option>
                  </select>
                </label>
                <Inp label="Precio $ (vacío = Cotizar)" type="number" value={edit.price ? String(edit.price) : ''} onChange={(v) => setEdit({ ...edit, price: +v || undefined })} />
                <Inp label="Capacidad kWh (para la calculadora)" type="number" value={edit.capacityKwh ? String(edit.capacityKwh) : ''} onChange={(v) => setEdit({ ...edit, capacityKwh: +v || undefined })} />
                <Inp label="Etiqueta (ej. Oferta)" value={edit.badge ?? ''} onChange={(v) => setEdit({ ...edit, badge: v || undefined })} />
                <Inp label="Imagen (URL)" value={edit.img ?? ''} onChange={(v) => setEdit({ ...edit, img: v || undefined })} />
              </div>
              <Inp label="Descripción corta" value={edit.tagline} onChange={(v) => setEdit({ ...edit, tagline: v })} />
              <label className="lbl">
                Especificaciones (una por línea)
                <textarea rows={4} value={edit.specs.join('\n')} onChange={(e) => setEdit({ ...edit, specs: e.target.value.split('\n') })} />
              </label>
              <div className="pform__foot">
                {edit.id && (
                  <button
                    type="button"
                    className="btn btn--text pform__del"
                    onClick={() => {
                      productStore.set((all) => all.filter((x) => x.id !== edit.id));
                      setEdit(null);
                    }}
                  >
                    Eliminar
                  </button>
                )}
                <button type="submit" className="btn btn--yellow" disabled={!edit.name.trim()}>
                  Guardar producto
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Inp({ label, value, onChange, type = 'text', required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="lbl">
      {label}
      <input className="inp" type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </label>
  );
}
