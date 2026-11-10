import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import RevealText from '../components/RevealText';
import AnimatedCounter from '../components/AnimatedCounter';
import MagneticButton from '../components/MagneticButton';
import { ArrowUpRight, Battery, Leaf, Shield, Sun, Wallet } from '../components/Icons';
import { EASINGS } from '../utils/easings';
import { estimate, SAVINGS_PCT } from '../lib/estimate';
import { scrollToId } from '../utils/scroll';

function Money({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 90, damping: 20 });
  const text = useTransform(spring, (v) => `$${Math.round(v).toLocaleString('en-US')}`);
  useEffect(() => spring.set(value), [value, spring]);
  return <motion.span>{text}</motion.span>;
}

const REASONS = [
  { icon: Wallet, t: 'Ahorro en tu factura de LUMA', d: 'Reduce drásticamente el costo mensual de electricidad con energía solar.' },
  { icon: Battery, t: 'Te mantienes siempre encendido', d: 'Con baterías de respaldo, tu hogar nunca se queda sin energía.' },
  { icon: Leaf, t: 'Menos perjudicial para la naturaleza', d: 'Energía limpia y renovable que protege el medio ambiente.' },
];

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } };
const card = {
  hidden: { opacity: 0, y: 48, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASINGS.premium } },
};

export default function Programs() {
  const [bill, setBill] = useState(250);
  const est = estimate(bill);
  const pct = ((bill - 60) / (800 - 60)) * 100;
  const after = bill - est.monthlySavings;

  return (
    <section id="programas" className="savings">
      <div className="container">
        <div className="savings__head">
          <span className="eyebrow eyebrow--dark">05 · Programas de Energía</span>
          <RevealText tag="h2" className="h2" italic={['programas', 'energía?']}>
            ¿Por qué escoger programas de energía?
          </RevealText>
        </div>

        <motion.div className="reasons" variants={container} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          {REASONS.map(({ icon: Icon, t, d }, i) => (
            <motion.div key={t} className="reason" variants={card}>
              <span className="reason__n">0{i + 1}</span>
              <Icon size={28} />
              <h3>{t}</h3>
              <p>{d}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="calc" initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1, ease: EASINGS.premium }}>
          <div className="calc__input">
            <label htmlFor="bill">¿Cuánto pagas a LUMA al mes?</label>
            <div className="calc__bill">
              <Money value={bill} />
              <small>/mes</small>
            </div>
            <input id="bill" type="range" min={60} max={800} step={5} value={bill} onChange={(e) => setBill(+e.target.value)} style={{ ['--pct' as string]: `${pct}%` }} data-cursor="Desliza" />
            <div className="calc__scale">
              <span>$60</span>
              <span>$800+</span>
            </div>
            <div className="calc__sys">
              <div>
                <Sun size={18} />
                <b>{est.kw} kW</b>
                <span>sistema sugerido</span>
              </div>
              <div>
                <Grid4 />
                <b>{est.panels}</b>
                <span>placas aprox.</span>
              </div>
              <div>
                <Battery size={18} />
                <b>{est.batteryKwh} kWh</b>
                <span>batería sugerida</span>
              </div>
            </div>
          </div>

          <div className="calc__out">
            <div className="calc__compare">
              <div>
                <span>Hoy pagas</span>
                <div className="calc__bar calc__bar--red">
                  <motion.span animate={{ width: '100%' }} />
                </div>
                <b>${bill}</b>
              </div>
              <div>
                <span>Con Eco House</span>
                <div className="calc__bar">
                  <motion.span animate={{ width: `${(1 - SAVINGS_PCT) * 100}%` }} transition={{ type: 'spring', stiffness: 80, damping: 18 }} />
                </div>
                <b>~${Math.round(after)}</b>
              </div>
            </div>
            <div className="calc__result">
              <div>
                <span>Ahorro al año</span>
                <strong>
                  <Money value={est.yearlySavings} />
                </strong>
              </div>
              <div>
                <span>En 25 años</span>
                <strong>
                  <Money value={est.yearlySavings * 25} />
                </strong>
              </div>
            </div>
            <MagneticButton className="btn btn--yellow" onClick={() => scrollToId('cotizar')}>
              Quiero mi cotización exacta <ArrowUpRight size={18} />
            </MagneticButton>
            <small className="calc__note">*Estimado preliminar basado en un ahorro de hasta 70% y consumo promedio. Tu cotización final depende de la evaluación de tu factura y tu techo.</small>
          </div>
        </motion.div>

        <motion.div className="bento" variants={container} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
          <motion.div className="bento__card bento__card--dark bento__card--big" variants={card} whileHover={{ y: -8 }}>
            <Wallet size={26} />
            <span className="bento__label">Ahorro garantizado</span>
            <strong className="bento__num">
              <AnimatedCounter target={70} suffix="%" />
            </strong>
            <p>Reduce hasta un 70% en tu factura de electricidad.</p>
          </motion.div>
          <motion.div className="bento__card bento__card--white" variants={card} whileHover={{ y: -8 }}>
            <Shield size={26} />
            <span className="bento__label">Garantía extendida</span>
            <strong className="bento__num">
              <AnimatedCounter target={25} />
              <small> años</small>
            </strong>
            <p>En paneles solares y equipos.</p>
          </motion.div>
          <motion.div className="bento__card bento__card--white" variants={card} whileHover={{ y: -8 }}>
            <Sun size={26} />
            <span className="bento__label">Energía renovable</span>
            <p>Aprovecha la energía solar ilimitada de Puerto Rico para tu hogar.</p>
          </motion.div>
          <motion.div className="bento__card bento__card--blue" variants={card} whileHover={{ y: -8 }}>
            <Battery size={26} />
            <span className="bento__label">Siempre encendido</span>
            <strong className="bento__num bento__num--sm">0 apagones en casa</strong>
            <p>Baterías de respaldo para que nunca te quedes sin luz, aunque falle la red.</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Grid4() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 6h16l-2 12H6z M5 12h14 M12 6v12" />
    </svg>
  );
}
