import { motion } from 'framer-motion';
import { EASINGS } from '../utils/easings';

interface RevealTextProps {
  children: string;
  className?: string;
  delay?: number;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  italic?: string[];
}

const word = {
  hidden: { y: '115%', rotate: 3 },
  visible: (i: number) => ({
    y: 0,
    rotate: 0,
    transition: { duration: 0.9, delay: i * 0.07, ease: EASINGS.premium },
  }),
};

export default function RevealText({ children, className = '', delay = 0, tag = 'h2', italic = [] }: RevealTextProps) {
  const Tag = motion[tag];
  const words = children.split(' ');

  // el observer vive en el contenedor: las palabras arrancan ocultas por la máscara
  return (
    <Tag
      className={`reveal ${className}`}
      aria-label={children}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      transition={{ delayChildren: delay }}
    >
      {words.map((w, i) => (
        <span key={i} className="reveal__mask" aria-hidden>
          <motion.span className={italic.includes(w) ? 'reveal__word serif' : 'reveal__word'} variants={word} custom={i + delay / 0.07}>
            {w}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
