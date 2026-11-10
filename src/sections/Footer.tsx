import { useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import Logo from '../components/Logo';
import { Mail, Phone, WhatsApp, X } from '../components/Icons';
import { CONTACT, EASINGS } from '../utils/easings';
import { scrollToId } from '../utils/scroll';

const LEGAL = {
  'Política de Servicios': [
    'Eco House ofrece evaluaciones y cotizaciones gratuitas sin compromiso de compra.',
    'Los estimados mostrados en la web son preliminares y se confirman tras la evaluación de la factura y la visita técnica.',
    'Las garantías de paneles y equipos dependen del fabricante y se detallan en cada propuesta.',
    'La información que compartes (nombre, teléfono, email, ubicación y factura) se usa únicamente para preparar tu cotización y darle seguimiento a tu proyecto.',
  ],
  'Términos de Servicios': [
    'Precios, ofertas y disponibilidad pueden cambiar sin previo aviso.',
    'La instalación está sujeta a la aprobación de permisos y a las condiciones de la propiedad.',
    'Los ahorros dependen del consumo, la orientación del techo y las tarifas vigentes de LUMA.',
    'Al enviar un formulario aceptas ser contactado por Eco House sobre tu solicitud.',
  ],
};

export default function Footer() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const y = useTransform(scrollYProgress, [0, 1], ['40%', '0%']);
  const glow = useTransform(scrollYProgress, [0.3, 1], [0, 1]);
  const [legal, setLegal] = useState<keyof typeof LEGAL | null>(null);

  return (
    <footer ref={ref} className="footer">
      <div className="container">
        <div className="footer__top">
          <div>
            <Logo size={86} />
            <p>Haz tu casa Eco-Friendly. Energía solar residencial y comercial, baterías de respaldo, sistemas off-grid y productos sostenibles en Puerto Rico.</p>
          </div>
          <div className="footer__cols">
            <div>
              <small>Contacto</small>
              <a href={`tel:+${CONTACT.phoneRaw}`}>
                <Phone size={16} /> {CONTACT.phone}
              </a>
              <a href={`https://wa.me/${CONTACT.phoneRaw}`} target="_blank" rel="noreferrer">
                <WhatsApp size={16} /> WhatsApp
              </a>
              <a href={`mailto:${CONTACT.email}`}>
                <Mail size={16} /> {CONTACT.email}
              </a>
            </div>
            <div>
              <small>Enlaces</small>
              {[
                ['inicio', 'Home'],
                ['nosotros', 'Nosotros'],
                ['programas', 'Energía'],
                ['tienda', 'Tienda'],
                ['cotizar', 'Cotización gratis'],
              ].map(([id, l]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToId(id);
                  }}
                >
                  {l}
                </a>
              ))}
            </div>
            <div>
              <small>Clientes</small>
              <a href="#/portal">Mi proyecto</a>
              <a href="#/admin">Panel Eco House</a>
              {(Object.keys(LEGAL) as (keyof typeof LEGAL)[]).map((k) => (
                <button key={k} className="footer__link" onClick={() => setLegal(k)}>
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="footer__giant">
        <motion.span style={{ y }}>ECO HOUSE</motion.span>
        <motion.div className="footer__glow" style={{ opacity: glow }} />
      </div>
      <div className="container footer__bottom">
        <span>© {new Date().getFullYear()} Eco House. Todos los derechos reservados.</span>
        <span>
          Diseñado y desarrollado por <b>NEXIX Tech Studio</b>
        </span>
      </div>

      <AnimatePresence>
        {legal && (
          <motion.div className="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLegal(null)} data-lenis-prevent>
            <motion.div className="modal__card legal" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ ease: EASINGS.premium }} onClick={(e) => e.stopPropagation()}>
              <button className="modal__close" onClick={() => setLegal(null)} aria-label="Cerrar">
                <X size={20} />
              </button>
              <h3>{legal}</h3>
              <ol>
                {LEGAL[legal].map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
              <small>Borrador para revisión de Eco House.</small>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}
