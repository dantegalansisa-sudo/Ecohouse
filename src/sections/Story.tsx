import { useRef, useState } from 'react';
import { motion, MotionValue, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';

const SCENES = [
  {
    num: '01',
    kicker: 'Tu factura',
    title: 'Todo empieza con tu factura de LUMA.',
    text: 'Súbela y analizamos tu consumo real. Con esa información diseñamos un sistema a la medida de tu techo — sin adivinanzas, con instalación profesional.',
    img: '/img/plan.webp',
    imgSm: '/img/plan-sm.webp',
    origin: '50% 50%',
    tone: 'cream',
  },
  {
    num: '02',
    kicker: 'Las placas solares',
    title: 'El sol de Puerto Rico, convertido en tu propia energía.',
    text: 'Paneles de alta eficiencia con 25 años de garantía. Energía renovable e ilimitada: cada rayo que cae sobre tu techo se queda en tu casa.',
    img: '/img/panel-close.webp',
    imgSm: '/img/panel-close-sm.webp',
    origin: '85% 15%',
    tone: 'navy',
  },
  {
    num: '03',
    kicker: 'La batería',
    title: 'La energía del día, guardada para cuando más la necesitas.',
    text: 'Tu batería se carga con el sol y entra en acción en milisegundos cuando la red falla. Te mantienes siempre encendido.',
    img: '/img/battery.webp',
    imgSm: '/img/battery-sm.webp',
    origin: '50% 35%',
    tone: 'sage',
  },
];

const N = SCENES.length;

function SceneLayer({ p, i, mobile }: { p: MotionValue<number>; i: number; mobile: boolean }) {
  const s = SCENES[i];
  const start = i / N;
  const end = (i + 1) / N;
  const clip = useTransform(
    p,
    [Math.max(0, start - 0.1), start + 0.02],
    i === 0 ? ['circle(150% at 50% 50%)', 'circle(150% at 50% 50%)'] : [`circle(0% at ${s.origin})`, `circle(150% at ${s.origin})`]
  );
  const scale = useTransform(p, [Math.max(0, start - 0.1), end], [1.25, 1]);
  return (
    <motion.div className={`story__layer story__layer--${s.tone}`} style={{ clipPath: clip, zIndex: i }}>
      <motion.img src={mobile ? s.imgSm : s.img} alt={s.kicker} style={{ scale }} />
      <div className="story__shade" />
      {i === 0 && <Blueprint p={p} />}
      {i === 1 && <SunSweep p={p} />}
      {i === 2 && <Charge p={p} />}
    </motion.div>
  );
}

function SceneText({ p, i }: { p: MotionValue<number>; i: number }) {
  const s = SCENES[i];
  const start = i / N;
  const end = (i + 1) / N;
  const fadeIn = i === 0 ? [0, 0.001] : [start - 0.02, start + 0.06];
  const fadeOut = i === N - 1 ? [0.999, 1] : [end - 0.08, end - 0.02];
  const range = [fadeIn[0], fadeIn[1], fadeOut[0], fadeOut[1]];
  const opacity = useTransform(p, range, [i === 0 ? 1 : 0, 1, 1, i === N - 1 ? 1 : 0]);
  const y = useTransform(p, range, [i === 0 ? 0 : 60, 0, 0, i === N - 1 ? 0 : -60]);
  const pointer = useTransform(opacity, (o) => (o > 0.5 ? 'auto' : 'none'));
  return (
    <motion.article className="story__text" style={{ opacity, y, pointerEvents: pointer }}>
      <span className="story__kicker">
        <b>{s.num}</b> {s.kicker}
      </span>
      <h2>{s.title}</h2>
      <p>{s.text}</p>
    </motion.article>
  );
}

function Blueprint({ p }: { p: MotionValue<number> }) {
  const len = useTransform(p, [0, 0.25], [0, 1]);
  return (
    <svg className="story__blueprint" viewBox="0 0 400 260" preserveAspectRatio="none">
      {[...Array(6)].map((_, k) => (
        <motion.line key={`h${k}`} x1="0" x2="400" y1={40 * k + 20} y2={40 * k + 20} style={{ pathLength: len }} />
      ))}
      {[...Array(9)].map((_, k) => (
        <motion.line key={`v${k}`} y1="0" y2="260" x1={48 * k + 8} x2={48 * k + 8} style={{ pathLength: len }} />
      ))}
    </svg>
  );
}

function SunSweep({ p }: { p: MotionValue<number> }) {
  const x = useTransform(p, [0.3, 0.66], ['-60%', '160%']);
  const watts = useTransform(p, [0.33, 0.62], [0, 7.4]);
  const [w, setW] = useState(0);
  useMotionValueEvent(watts, 'change', (v) => setW(+v.toFixed(1)));
  return (
    <>
      <motion.div className="story__sweep" style={{ left: x }} />
      <div className="story__readout glass">
        <span>Producción en vivo</span>
        <strong>
          {w.toFixed(1)} <small>kW</small>
        </strong>
        <div className="story__bars">
          {[...Array(12)].map((_, k) => (
            <span key={k} style={{ opacity: w / 7.4 > k / 12 ? 1 : 0.15 }} />
          ))}
        </div>
      </div>
    </>
  );
}

function Charge({ p }: { p: MotionValue<number> }) {
  const charge = useTransform(p, [0.68, 0.95], [0, 100]);
  const [c, setC] = useState(0);
  useMotionValueEvent(charge, 'change', (v) => setC(Math.round(v)));
  const h = useTransform(charge, (v) => `${v}%`);
  return (
    <div className="story__charge glass">
      <div className="story__cell">
        <motion.span style={{ height: h }} />
      </div>
      <div>
        <span>Batería</span>
        <strong>{c}%</strong>
        <small>{c < 100 ? 'Cargando con el sol…' : 'Lista para el apagón'}</small>
      </div>
    </div>
  );
}

export default function Story({ mobile }: { mobile: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setActive(Math.min(N - 1, Math.floor(v * N))));
  const rail = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section ref={ref} id="historia" className="story" style={{ height: `${N * 120 + 40}vh` }}>
      <div className="story__sticky">
        {SCENES.map((_, i) => (
          <SceneLayer key={i} p={scrollYProgress} i={i} mobile={mobile} />
        ))}

        <div className="story__ui">
          <div className="story__head">
            <span className="eyebrow">Así funciona tu casa eco-friendly</span>
            <span className="story__count">
              <motion.b key={active} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                {SCENES[active].num}
              </motion.b>
              <i>/ 0{N + 1}</i>
            </span>
          </div>

          <div className="story__texts">
            {SCENES.map((_, i) => (
              <SceneText key={i} p={scrollYProgress} i={i} />
            ))}
          </div>

          <div className="story__rail">
            <motion.span style={{ height: rail }} />
            {SCENES.map((s, i) => (
              <i key={i} className={i <= active ? 'on' : ''} data-label={s.kicker} style={{ top: `${(i / N) * 100}%` }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
