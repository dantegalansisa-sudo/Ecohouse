import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from '../components/Logo';
import { Calendar, Columns, Grid, Home, LogOut, Plus, Refresh, Search, Users, Bag } from '../components/Icons';
import { crm, resetCrm, type Lead } from '../lib/crm';
import { resetProducts } from '../lib/products';
import { clearFiles } from '../lib/files';
import Dashboard from './Dashboard';
import Pipeline from './Pipeline';
import Clients from './Clients';
import Appointments from './Appointments';
import ProductsAdmin from './ProductsAdmin';
import LeadDrawer from './LeadDrawer';
import NewLead from './NewLead';
import { EASINGS } from '../utils/easings';

const VIEWS = [
  { id: 'resumen', label: 'Resumen', icon: Grid },
  { id: 'pipeline', label: 'Pipeline', icon: Columns },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'citas', label: 'Citas', icon: Calendar },
  { id: 'productos', label: 'Productos', icon: Bag },
] as const;
type View = (typeof VIEWS)[number]['id'] | 'ajustes';

const SESSION = 'eh-admin-session';

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION) === '1');
  const [view, setView] = useState<View>('resumen');
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState('');
  const leads = crm.use();
  const newCount = leads.filter((l) => l.stage === 'nuevo' && !l.lost).length;

  if (!authed)
    return (
      <div className="adm-login">
        <motion.div className="adm-login__card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: EASINGS.premium, duration: 0.8 }}>
          <Logo size={110} />
          <h1>Panel Eco House</h1>
          <p>Clientes, facturas, citas, pipeline de ventas y tienda. Todo en un solo lugar.</p>
          <button
            className="btn btn--yellow btn--block"
            onClick={() => {
              sessionStorage.setItem(SESSION, '1');
              setAuthed(true);
            }}
          >
            Entrar en modo demo
          </button>
          <small>Demo sin contraseña. En producción el acceso es con usuario y roles para cada vendedor.</small>
          <a href="#/" className="adm-login__back">
            ← Volver al sitio
          </a>
        </motion.div>
      </div>
    );

  const open = (l: Lead) => setOpenId(l.id);
  const current = leads.find((l) => l.id === openId) ?? null;

  return (
    <div className="adm" data-lenis-prevent>
      <aside className="adm-side">
        <div className="adm-side__logo">
          <Logo size={52} />
          <span>CRM</span>
        </div>
        <nav>
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={view === id ? 'on' : ''} onClick={() => setView(id)}>
              {view === id && <motion.span layoutId="adm-nav" className="adm-side__pill" />}
              <Icon size={19} />
              <span>{label}</span>
              {id === 'pipeline' && newCount > 0 && <i>{newCount}</i>}
            </button>
          ))}
        </nav>
        <div className="adm-side__foot">
          <button className={view === 'ajustes' ? 'on' : ''} onClick={() => setView('ajustes')}>
            <Refresh size={18} /> <span>Ajustes</span>
          </button>
          <a href="#/">
            <Home size={18} /> <span>Ver sitio</span>
          </a>
          <button
            onClick={() => {
              sessionStorage.removeItem(SESSION);
              setAuthed(false);
            }}
          >
            <LogOut size={18} /> <span>Salir</span>
          </button>
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-top">
          <div>
            <h1>{view === 'ajustes' ? 'Ajustes' : VIEWS.find((v) => v.id === view)?.label}</h1>
            <span className="adm-top__demo">Modo demo · datos de ejemplo + los que envíes desde el sitio</span>
          </div>
          <label className="adm-search">
            <Search size={17} />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                if (e.target.value && view !== 'clientes') setView('clientes');
              }}
              placeholder="Buscar cliente, teléfono, código…"
            />
          </label>
          <button className="btn btn--yellow btn--sm" onClick={() => setCreating(true)}>
            <Plus size={17} /> Nuevo cliente
          </button>
        </header>

        <AnimatePresence mode="wait">
          <motion.div key={view} className="adm-view" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            {view === 'resumen' && <Dashboard leads={leads} onOpen={open} onGo={setView} />}
            {view === 'pipeline' && <Pipeline leads={leads} onOpen={open} />}
            {view === 'clientes' && <Clients leads={leads} onOpen={open} query={q} setQuery={setQ} />}
            {view === 'citas' && <Appointments leads={leads} onOpen={open} />}
            {view === 'productos' && <ProductsAdmin />}
            {view === 'ajustes' && <Settings />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>{current && <LeadDrawer lead={current} onClose={() => setOpenId(null)} />}</AnimatePresence>
      <AnimatePresence>{creating && <NewLead onClose={() => setCreating(false)} onCreated={(l) => { setCreating(false); setOpenId(l.id); }} />}</AnimatePresence>
    </div>
  );
}

function Settings() {
  const [done, setDone] = useState('');
  const INTEGRATIONS = [
    ['WhatsApp Business', 'Recibe cada lead y responde desde el panel.'],
    ['Google Calendar', 'Las visitas técnicas se sincronizan con el calendario del equipo.'],
    ['Notificaciones por email', 'Aviso inmediato a ventas@ cuando entra una factura.'],
    ['Lectura automática de factura', 'Extrae kWh y total de la foto de la factura (OCR).'],
    ['Pagos y depósitos en línea', 'Cobra el depósito de la tienda con tarjeta o ATH Móvil.'],
    ['Roles de usuario', 'Accesos separados para ventas, instaladores y administración.'],
  ];
  return (
    <div className="adm-settings">
      <div className="adm-card">
        <h3>Datos de demostración</h3>
        <p>Restablece el CRM y la tienda a su estado inicial. Las solicitudes enviadas desde el sitio se borran.</p>
        <div className="adm-settings__row">
          <button
            className="btn btn--ghost"
            onClick={() => {
              resetCrm();
              clearFiles();
              setDone('CRM restablecido');
            }}
          >
            Restablecer clientes
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => {
              resetProducts();
              setDone('Tienda restablecida');
            }}
          >
            Restablecer productos
          </button>
          {done && <span className="adm-ok">{done} ✓</span>}
        </div>
      </div>
      <div className="adm-card">
        <h3>Integraciones</h3>
        <p>Listas para activar en la versión de producción.</p>
        <div className="integ">
          {INTEGRATIONS.map(([t, d]) => (
            <div key={t} className="integ__item">
              <div>
                <strong>{t}</strong>
                <small>{d}</small>
              </div>
              <span className="integ__soon">Fase 2</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
