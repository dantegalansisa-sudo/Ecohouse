import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import RevealText from '../components/RevealText';
import { useParallax } from '../hooks/useParallax';
import { EASINGS } from '../utils/easings';
import ClipReveal from '../components/ClipReveal';

const STEPS = [
  { t: 'Sube tu factura', d: 'Envía tu factura de LUMA desde el celular. Recibes un estimado al instante y tu código de proyecto.' },
  { t: 'Evaluación y visita técnica', d: 'Analizamos tu consumo real y visitamos tu propiedad para medir el techo y la instalación eléctrica.' },
  { t: 'Propuesta clara', d: 'Te enviamos tu diseño, equipos, ahorro estimado y opciones de pago. Sin letra pequeña.' },
  { t: 'Permisos con LUMA', d: 'Nos encargamos de los trámites y permisos para que tu sistema quede en regla.' },
  { t: 'Instalación y encendido', d: 'Instalación profesional y activación. Sigues cada paso desde el portal "Mi proyecto".' },
]

export default function Process() {
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 75%', 'end 55%'] });
  const fill = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const { ref: pRef, y } = useParallax(70);

  return (
    <section id="proceso" className="process">
      <div className="container process__grid">
        <div className="process__left">
          <span className="eyebrow eyebrow--dark">09 · Cómo funciona</span>
          <RevealText tag="h2" className="h2" italic={['pasos.']}>
            De tu factura a tu propia energía en cinco pasos.
          </RevealText>
          <ClipReveal ref={pRef} className="process__img" from="inset(0 100% 0 0 round 28px)" to="inset(0 0% 0 0 round 28px)">
            <motion.img src="/img/plan-sm.webp" alt="Planificación de sistema solar" style={{ y, scale: 1.2 }} loading="lazy" />
          </ClipReveal>
        </div>

        <ol ref={listRef} className="process__list">
          <span className="process__line">
            <motion.span style={{ height: fill }} />
          </span>
          {STEPS.map((s, i) => (
            <motion.li
              key={s.t}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.8, ease: EASINGS.premium }}
            >
              <span className="process__num">0{i + 1}</span>
              <div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
