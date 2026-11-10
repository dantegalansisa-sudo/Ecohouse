import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { EASINGS } from '../utils/easings';

export default function Preloader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1700);
      setPct(Math.round(100 * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setTimeout(onDone, 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <motion.div
      className="preloader"
      initial={{ clipPath: 'inset(0 0 0% 0)' }}
      exit={{ clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: 1, ease: EASINGS.cinematic }}
    >
      <motion.img
        src="/img/logo.webp"
        alt=""
        className="preloader__bolt"
        initial={{ scale: 0.4, rotate: -40, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: EASINGS.bounce }}
      />
      <div className="preloader__meta">
        <span>Haz tu casa eco-friendly</span>
        <span className="preloader__pct">{pct}%</span>
      </div>
      <div className="preloader__bar">
        <span style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
    </motion.div>
  );
}
