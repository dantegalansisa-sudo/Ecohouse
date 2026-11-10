import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import MagneticButton from '../components/MagneticButton';
import { ArrowUpRight, Bag, Battery, Sun, Target, Upload } from '../components/Icons';
import { EASINGS } from '../utils/easings';
import { scrollToId } from '../utils/scroll';

const MARQUEE = ['Energía solar residencial', 'Comercial', 'Baterías de respaldo', 'Sistemas Off-Grid', 'Cisternas y calentadores', 'Hasta 70% de ahorro', '25 años de garantía', 'Puerto Rico'];

const ACTIONS = [
  { id: 'cotizar', icon: Upload, title: 'Sube tu factura', text: 'Cotización gratis en minutos', tone: 'yellow' },
  { id: 'respaldo', icon: Battery, title: 'Calcula tu respaldo', text: '¿Qué batería necesitas?', tone: 'glass' },
  { id: 'tienda', icon: Bag, title: 'Tienda solar', text: 'Baterías, off-grid y más', tone: 'glass' },
  { id: 'programas', icon: Target, title: 'Calcula tu ahorro', text: 'Tu factura de LUMA, menor', tone: 'glass' },
];

function Line({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="reveal__mask">
      <motion.span className="reveal__word" initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 1.1, delay, ease: EASINGS.cinematic }}>
        {children}
      </motion.span>
    </span>
  );
}

export function HeroDesktop({ ready }: { ready: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.04, 1.25]);
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const fade = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const dim = useTransform(scrollYProgress, [0, 1], [0, 0.7]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 20 });
  const smy = useSpring(my, { stiffness: 60, damping: 20 });
  const houseX = useTransform(smx, (v) => v * -14);
  const houseY = useTransform(smy, (v) => v * -10);
  const sunR = useTransform(smx, (v) => v * 40);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mx, my]);

  return (
    <section ref={ref} id="inicio" className="hero">
      <motion.div className="hero__bg" style={{ scale, y: bgY }}>
        <motion.div
          className="hero__frame"
          style={{ x: houseX, y: houseY }}
          initial={{ scale: 1.25, filter: 'brightness(0.3) blur(8px)' }}
          animate={ready ? { scale: 1, filter: 'brightness(1) blur(0px)' } : {}}
          transition={{ duration: 2.2, ease: EASINGS.smooth }}
        >
          <img src="/img/house-glow.webp" alt="Casa eco-friendly con placas solares y batería en Puerto Rico" />
        </motion.div>
      </motion.div>
      <motion.div className="hero__dim" style={{ opacity: dim }} />
      <div className="hero__vignette" />

      <motion.div className="hero__content" style={{ y: contentY, opacity: fade }}>
        <motion.span
          className="hero__tag"
          initial={{ opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <motion.span className="hero__sun" style={{ rotate: sunR }}>
            <Sun size={16} />
          </motion.span>
          Solución Solar, Vida Mejor · Puerto Rico
        </motion.span>
        {ready && (
          <h1 className="hero__title" aria-label="Haz tu casa Eco-Friendly">
            <Line delay={0.15}>Haz tu casa</Line>
            <Line delay={0.3}>
              <em className="serif">Eco-Friendly.</em>
            </Line>
          </h1>
        )}

        <div className="hero__row">
          <motion.div
            className="hero__actions"
            initial="h"
            animate={ready ? 'v' : 'h'}
            variants={{ h: {}, v: { transition: { staggerChildren: 0.08, delayChildren: 1 } } }}
          >
            {ACTIONS.map(({ id, icon: Icon, title, text, tone }) => (
              <motion.button
                key={id}
                className={`qa qa--${tone}`}
                onClick={() => scrollToId(id)}
                variants={{ h: { opacity: 0, y: 40 }, v: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASINGS.premium } } }}
                whileHover={{ y: -6 }}
              >
                <span className="qa__icon">
                  <Icon size={20} />
                </span>
                <strong>{title}</strong>
                <small>{text}</small>
                <ArrowUpRight size={16} />
              </motion.button>
            ))}
          </motion.div>

          <motion.div
            className="hero__side"
            initial={{ opacity: 0, x: 40 }}
            animate={ready ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 1.15, ease: EASINGS.premium }}
          >
            <p className="hero__lead">
              Soluciones de energía solar y productos sostenibles diseñados para <span>reducir tu factura eléctrica</span> y tu huella ambiental.
            </p>
            <div className="hero__ctas">
              <MagneticButton className="btn btn--yellow" onClick={() => scrollToId('cotizar')}>
                Solicitar cotización gratis <ArrowUpRight size={20} />
              </MagneticButton>
              <button className="btn btn--line" onClick={() => scrollToId('tienda')}>
                Ver productos solares
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="marquee">
        <div className="marquee__track">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE].map((t, i) => (
            <span key={i}>
              {t} <Sun size={14} />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function HeroMobile({ ready }: { ready: boolean }) {
  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 40 },
    animate: ready ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.9, delay: 0.15 + i * 0.1, ease: EASINGS.premium },
  });

  return (
    <section id="inicio" className="mhero">
      <motion.p className="mhero__hello" {...stagger(0)}>
        {greeting()}, Puerto Rico <Sun size={16} />
      </motion.p>
      {ready && (
        <h1 className="mhero__title">
          <Line delay={0.2}>Haz tu casa</Line>
          <Line delay={0.32}>
            <em className="serif">Eco-Friendly.</em>
          </Line>
        </h1>
      )}

      <motion.div className="mhero__card" {...stagger(2)}>
        <motion.img src="/img/house-glow-sm.webp" alt="Casa con placas solares" initial={{ scale: 1.3 }} animate={ready ? { scale: 1 } : {}} transition={{ duration: 2, ease: EASINGS.smooth }} />
        <span className="mhero__chip">
          <span className="pulse" /> Hasta 70% de ahorro
        </span>
        <span className="mhero__ping" style={{ left: '58%', top: '38%' }} />
        <span className="mhero__ping" style={{ left: '63%', top: '62%' }} />
      </motion.div>

      <div className="mhero__grid">
        {ACTIONS.map(({ id, icon: Icon, title, text, tone }, i) => (
          <motion.button key={id} className={`tile tile--${tone}`} onClick={() => scrollToId(id)} {...stagger(3 + i * 0.5)}>
            <span className="tile__icon">
              <Icon size={20} />
            </span>
            <strong>{title}</strong>
            <small>{text}</small>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
