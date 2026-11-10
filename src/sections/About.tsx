import { motion } from 'framer-motion';
import RevealText from '../components/RevealText';
import AnimatedCounter from '../components/AnimatedCounter';
import { useParallax } from '../hooks/useParallax';
import ClipReveal from '../components/ClipReveal';

const STATS = [
  { n: 70, suffix: '%', label: 'de ahorro posible en tu factura' },
  { n: 25, suffix: ' años', label: 'de garantía en paneles y equipos' },
  { n: 78, suffix: '', label: 'municipios donde podemos llegar' },
];

export default function About() {
  const { ref, y } = useParallax(60);
  return (
    <section id="nosotros" className="about">
      <div className="container about__grid">
        <div>
          <span className="eyebrow eyebrow--dark">Nosotros</span>
          <RevealText tag="h2" className="h2" italic={['sostenible.']}>
            Energía solar para un futuro sostenible.
          </RevealText>
          <motion.p
            className="about__text"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Eco House se especializa en soluciones de energía solar y productos sostenibles para tu hogar y tu negocio. Nuestro objetivo es ayudarte a reducir tu factura eléctrica mientras proteges el medio ambiente con energía limpia y renovable.
          </motion.p>
          <div className="about__stats">
            {STATS.map((s) => (
              <div key={s.label}>
                <strong>
                  <AnimatedCounter target={s.n} suffix={s.suffix} />
                </strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <ClipReveal ref={ref} className="about__img" from="inset(0 0 100% 0 round 32px)" to="inset(0 0 0% 0 round 32px)">
          <motion.img src="/img/house-sunset.webp" alt="Casa con sistema solar Eco House" style={{ y, scale: 1.2 }} loading="lazy" />
          <div className="about__badge glass">
            <img src="/img/logo.webp" alt="" />
            <span>Make your house eco-friendly</span>
          </div>
        </ClipReveal>
      </div>
    </section>
  );
}
