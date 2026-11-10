import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { EASINGS } from '../utils/easings';

// El observer vive en el contenedor: un elemento recortado al 100% nunca "entra" en pantalla
const ClipReveal = forwardRef<HTMLDivElement, { className?: string; from: string; to: string; children: React.ReactNode }>(function ClipReveal(
  { className = '', from, to, children },
  ref
) {
  return (
    <motion.div ref={ref} initial="h" whileInView="v" viewport={{ once: true, amount: 0.25 }}>
      <motion.div
        className={className}
        variants={{ h: { clipPath: from }, v: { clipPath: to, transition: { duration: 1.3, ease: EASINGS.premium } } }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
});

export default ClipReveal;
