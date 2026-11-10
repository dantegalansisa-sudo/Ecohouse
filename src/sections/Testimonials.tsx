import { motion } from 'framer-motion';
import RevealText from '../components/RevealText';
import { ArrowUpRight, Check } from '../components/Icons';
import { EASINGS } from '../utils/easings';

const QUOTES = [
  { n: 'María G.', t: 'Desde que instalé los paneles de Eco House, mi factura de LUMA bajó un 75%. ¡Increíble inversión!' },
  { n: 'Carlos R.', t: 'La batería de respaldo me salvó durante el último apagón. Mi familia nunca se quedó sin luz. 100% recomendado.' },
  { n: 'Ana L.', t: 'El equipo de Eco House fue muy profesional. La instalación fue rápida y el ahorro se nota desde el primer mes.' },
];

const PORTAL_STEPS = ['Solicitud recibida', 'Visita técnica', 'Propuesta', 'Permisos LUMA', 'Instalación', 'Encendido'];

export default function Testimonials() {
  return (
    <section id="testimonios" className="testi">
      <div className="container">
        <span className="eyebrow eyebrow--dark">11 · Testimonios</span>
        <RevealText tag="h2" className="h2" italic={['clientes']}>
          Lo que dicen nuestros clientes.
        </RevealText>
        <div className="testi__grid">
          {QUOTES.map((q, i) => (
            <motion.blockquote
              key={q.n}
              className="tcard"
              initial={{ opacity: 0, y: 50, rotate: i % 2 ? 2 : -2 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, delay: i * 0.12, ease: EASINGS.premium }}
              whileHover={{ y: -8 }}
            >
              <span className="tcard__stars">★★★★★</span>
              <p>“{q.t}”</p>
              <footer>
                <span className="tcard__avatar">{q.n[0]}</span>
                <div>
                  <strong>{q.n}</strong>
                  <small>Cliente Eco House</small>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>

        <motion.div
          className="portal-teaser"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease: EASINGS.premium }}
        >
          <div>
            <span className="eyebrow">Nuevo · Portal del cliente</span>
            <h3>
              Sigue tu instalación <em className="serif">paso a paso.</em>
            </h3>
            <p>Con tu código de proyecto ves en qué etapa está tu sistema, tu próxima visita y tus documentos. Sin llamar, sin esperar.</p>
            <a className="btn btn--yellow" href="#/portal">
              Entrar a Mi proyecto <ArrowUpRight size={18} />
            </a>
          </div>
          <ol className="portal-teaser__steps">
            {PORTAL_STEPS.map((s, i) => (
              <motion.li
                key={s}
                className={i < 4 ? 'done' : i === 4 ? 'now' : ''}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <span>{i < 4 ? <Check size={12} /> : i + 1}</span>
                {s}
                {i === 4 && <em>En curso</em>}
              </motion.li>
            ))}
          </ol>
        </motion.div>
      </div>
    </section>
  );
}
