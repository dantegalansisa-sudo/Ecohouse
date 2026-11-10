import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import RevealText from '../components/RevealText';
import { ArrowUpRight, Battery, Check, Drop, Gauge, Home, Leaf, Sun } from '../components/Icons';
import { scrollToId } from '../utils/scroll';

const ITEMS = [
  {
    icon: Home,
    tag: 'Energía Solar',
    title: 'Sistemas residenciales y comerciales de alta eficiencia.',
    text: 'Instalación profesional de placas solares diseñadas a partir de tu factura y tu techo.',
    points: ['Diseño a la medida', 'Residencial y comercial', '25 años de garantía'],
    img: '/img/house-sunset.webp',
    imgSm: '/img/house-sunset-sm.webp',
  },
  {
    icon: Battery,
    tag: 'Baterías de respaldo',
    title: 'Tu casa encendida durante los apagones.',
    text: 'Respaldo automático y silencioso. Sin planta, sin gasolina, sin ruido.',
    points: ['Cambio automático', 'Cero ruido y cero humo', 'Expandible'],
    img: '/img/battery.webp',
    imgSm: '/img/battery-sm.webp',
  },
  {
    icon: Sun,
    tag: 'Sistemas Off-Grid',
    title: 'Independencia total de la red eléctrica.',
    text: 'Paneles, inversor y baterías LiFePO4 para vivir o trabajar sin depender de LUMA.',
    points: ['Baterías de litio', 'Ideal para zonas remotas', 'Monitoreo inteligente'],
    img: '/img/panel-close.webp',
    imgSm: '/img/panel-close-sm.webp',
  },
  {
    icon: Drop,
    tag: 'Cisternas y calentadores',
    title: 'Agua siempre y agua caliente con el sol.',
    text: 'Cisternas con bomba y calentadores solares de agua que no gastan electricidad.',
    points: ['Tanque presurizado', 'Calentador termosifón', 'Instalación incluida'],
    img: '/img/p-calentador.webp',
    imgSm: '/img/p-calentador.webp',
  },
  {
    icon: Gauge,
    tag: 'Eficiencia energética',
    title: 'Soluciones inteligentes para maximizar tu ahorro.',
    text: 'Evaluamos cómo consumes y te recomendamos dónde ahorrar más, antes y después de instalar.',
    points: ['Análisis de consumo', 'Recomendaciones claras', 'Negocios y hogares'],
    img: '/img/commercial.webp',
    imgSm: '/img/commercial-sm.webp',
  },
];

function Card({ item, i, mobile }: { item: (typeof ITEMS)[number]; i: number; mobile: boolean }) {
  const Icon = item.icon;
  return (
    <article className="sol-card" data-cursor="Ver">
      <div className="sol-card__img">
        <img src={mobile ? item.imgSm : item.img} alt={item.tag} loading="lazy" />
      </div>
      <div className="sol-card__body">
        <div className="sol-card__top">
          <span className="sol-card__tag">
            <Icon size={16} /> {item.tag}
          </span>
          <span className="sol-card__idx">0{i + 1}</span>
        </div>
        <h3>{item.title}</h3>
        <p>{item.text}</p>
        <ul>
          {item.points.map((pt) => (
            <li key={pt}>
              <Check size={14} /> {pt}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function CtaCard() {
  return (
    <article className="sol-card sol-card--cta">
      <img src="/img/wall-sm.webp" alt="" className="sol-card__wall" loading="lazy" />
      <div className="sol-card__cta-body">
        <span className="eyebrow eyebrow--dark">
          <Leaf size={14} /> Sostenibilidad
        </span>
        <h3>
          Productos que cuidan <em className="serif">el planeta.</em>
        </h3>
        <p>Cada sistema que instalamos es menos energía fósil y un futuro mejor para Puerto Rico.</p>
        <button className="btn btn--dark" onClick={() => scrollToId('cotizar')}>
          Solicitar cotización <ArrowUpRight size={18} />
        </button>
      </div>
    </article>
  );
}

function Intro() {
  return (
    <div className="sol-intro">
      <span className="eyebrow">06 · Servicios</span>
      <RevealText tag="h2" className="h2" italic={['casa,', 'negocio.']}>
        Todo lo que necesita tu casa, tu negocio.
      </RevealText>
      <p>Energía solar, respaldo, off-grid, agua y eficiencia. Una sola empresa, un solo equipo.</p>
    </div>
  );
}

export default function Services({ mobile }: { mobile: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist]);
  const bar = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const [active, setActive] = useState(0);

  useLayoutEffect(() => {
    if (mobile) return;
    const measure = () => trackRef.current && setDist(trackRef.current.scrollWidth - window.innerWidth);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [mobile]);

  if (mobile) {
    return (
      <section id="servicios" className="solutions solutions--m">
        <Intro />
        <div className="snap" onScroll={(e) => setActive(Math.round(e.currentTarget.scrollLeft / (e.currentTarget.firstElementChild as HTMLElement).offsetWidth))}>
          {ITEMS.map((it, i) => (
            <Card key={it.tag} item={it} i={i} mobile />
          ))}
          <CtaCard />
        </div>
        <div className="dots">
          {[...ITEMS, 0].map((_, i) => (
            <span key={i} className={i === active ? 'on' : ''} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} id="servicios" className="solutions" style={{ height: `${Math.max(250, (dist / window.innerHeight) * 100 + 100)}vh` }}>
      <div className="solutions__sticky">
        <motion.div ref={trackRef} className="solutions__track" style={{ x }}>
          <Intro />
          {ITEMS.map((it, i) => (
            <Card key={it.tag} item={it} i={i} mobile={false} />
          ))}
          <CtaCard />
        </motion.div>
        <div className="solutions__progress">
          <motion.span style={{ width: bar }} />
        </div>
      </div>
    </section>
  );
}
