import { useEffect, useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import Logo from './Logo';
import MagneticButton from './MagneticButton';
import { ArrowUpRight, Bag, Battery, Home, Target, Upload } from './Icons';
import { scrollToId } from '../utils/scroll';
import { EASINGS } from '../utils/easings';
import { quoteList } from '../lib/quoteList';

const LINKS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'nosotros', label: 'Nosotros' },
  { id: 'programas', label: 'Energía' },
  { id: 'tienda', label: 'Tienda' },
  { id: 'respaldo', label: 'Calculadora' },
  { id: 'contacto', label: 'Contacto' },
];

export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [ids.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  return active;
}

const go = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  scrollToId(id);
};

export function DesktopNav({ ready }: { ready: boolean }) {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const active = useActiveSection([...LINKS.map((l) => l.id), 'cotizar']);
  const list = quoteList.use();

  useMotionValueEvent(scrollY, 'change', (v) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(v > prev && v > 500);
    setSolid(v > 60);
  });

  return (
    <motion.header
      className={`dnav ${solid ? 'dnav--solid' : ''}`}
      initial={{ y: -120, opacity: 0 }}
      animate={ready ? { y: hidden ? -120 : 0, opacity: 1 } : {}}
      transition={{ duration: 0.8, ease: EASINGS.premium }}
    >
      <a href="#/" onClick={go('inicio')} aria-label="Eco House inicio">
        <Logo size={44} />
      </a>
      <nav className="dnav__links">
        {LINKS.map((l) => (
          <a key={l.id} href={`#${l.id}`} onClick={go(l.id)} className={active === l.id ? 'is-active' : ''}>
            {l.label}
            {active === l.id && <motion.span layoutId="dnav-dot" className="dnav__dot" />}
          </a>
        ))}
      </nav>
      <div className="dnav__right">
        <a className="dnav__portal" href="#/portal">
          Mi proyecto
        </a>
        {list.length > 0 && (
          <button className="dnav__bag" onClick={() => scrollToId('cotizar')} aria-label="Productos en tu cotización">
            <Bag size={18} />
            <b>{list.length}</b>
          </button>
        )}
        <MagneticButton className="btn btn--yellow btn--sm" onClick={() => scrollToId('cotizar')}>
          Cotización gratis <ArrowUpRight size={18} />
        </MagneticButton>
      </div>
    </motion.header>
  );
}

export function MobileAppBar({ ready }: { ready: boolean }) {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const list = quoteList.use();
  useMotionValueEvent(scrollY, 'change', (v) => setSolid(v > 40));
  return (
    <motion.div
      className={`appbar ${solid ? 'appbar--solid' : ''}`}
      initial={{ y: -80 }}
      animate={ready ? { y: 0 } : {}}
      transition={{ duration: 0.7, ease: EASINGS.premium, delay: 0.2 }}
    >
      <Logo size={34} />
      <div className="appbar__right">
        {list.length > 0 && (
          <a className="appbar__bag" href="#cotizar" onClick={go('cotizar')}>
            <Bag size={16} /> {list.length}
          </a>
        )}
        <a className="appbar__status" href="#/portal">
          <span className="pulse" /> Mi proyecto
        </a>
      </div>
    </motion.div>
  );
}

const TABS = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'tienda', label: 'Tienda', icon: Bag },
  { id: 'cotizar', label: 'Cotizar', icon: Upload, fab: true },
  { id: 'respaldo', label: 'Respaldo', icon: Battery },
  { id: 'programas', label: 'Ahorro', icon: Target },
];

export function TabBar({ ready }: { ready: boolean }) {
  const active = useActiveSection(['inicio', 'historia', 'apagon', 'nosotros', 'programas', 'servicios', 'tienda', 'respaldo', 'proceso', 'cotizar', 'testimonios', 'contacto']);
  const map: Record<string, string> = { historia: 'inicio', apagon: 'inicio', nosotros: 'programas', servicios: 'tienda', proceso: 'respaldo', testimonios: 'cotizar', contacto: 'cotizar' };
  const current = map[active] ?? active;

  return (
    <motion.nav
      className="tabbar"
      initial={{ y: 120 }}
      animate={ready ? { y: 0 } : {}}
      transition={{ duration: 0.8, ease: EASINGS.premium, delay: 0.35 }}
    >
      {TABS.map(({ id, label, icon: Icon, fab }) => (
        <a key={id} href={`#${id}`} onClick={go(id)} className={`tabbar__item ${fab ? 'tabbar__fab' : ''} ${current === id ? 'is-active' : ''}`}>
          {current === id && !fab && <motion.span layoutId="tab-pill" className="tabbar__pill" />}
          <span className="tabbar__icon">
            <Icon size={fab ? 24 : 21} />
          </span>
          <span className="tabbar__label">{label}</span>
        </a>
      ))}
    </motion.nav>
  );
}
