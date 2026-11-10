import { useRef, useState } from 'react';
import { motion, MotionValue, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import MagneticButton from '../components/MagneticButton';
import { ArrowUpRight, Sun } from '../components/Icons';
import { scrollToId } from '../utils/scroll';

const CUT = 0.3; // momento del apagón

type Win = [number, number, number, number];
interface HouseDef {
  x: number;
  y: number;
  w: number;
  h: number;
  t: number;
  roof?: 'flat' | 'gable';
  windows: Win[];
  back?: boolean;
}

// fila trasera (colina) + fila delantera (vecinos)
const HOUSES: HouseDef[] = [
  { x: 150, y: 520, w: 80, h: 50, t: 0.42, back: true, roof: 'gable', windows: [[14, 18, 16, 14], [48, 18, 16, 14]] },
  { x: 300, y: 505, w: 70, h: 48, t: 0.37, back: true, windows: [[12, 16, 18, 14], [42, 16, 16, 14]] },
  { x: 470, y: 515, w: 90, h: 46, t: 0.47, back: true, roof: 'gable', windows: [[16, 16, 22, 14], [56, 16, 18, 14]] },
  { x: 640, y: 492, w: 76, h: 44, t: 0.35, back: true, windows: [[14, 14, 18, 14], [46, 14, 16, 14]] },
  { x: 880, y: 498, w: 84, h: 46, t: 0.44, back: true, roof: 'gable', windows: [[14, 16, 20, 14], [52, 16, 18, 14]] },
  { x: 1050, y: 510, w: 72, h: 48, t: 0.39, back: true, windows: [[12, 16, 18, 14], [42, 16, 18, 14]] },
  { x: 1220, y: 500, w: 88, h: 48, t: 0.5, back: true, roof: 'gable', windows: [[16, 16, 20, 14], [54, 16, 18, 14]] },
  { x: 1390, y: 518, w: 74, h: 46, t: 0.41, back: true, windows: [[12, 16, 18, 14], [44, 16, 16, 14]] },
  // delanteras
  { x: 60, y: 560, w: 240, h: 140, t: 0.36, roof: 'gable', windows: [[24, 40, 52, 46], [96, 40, 52, 46], [168, 40, 48, 46]] },
  { x: 330, y: 580, w: 210, h: 120, t: 0.45, windows: [[22, 30, 70, 50], [118, 30, 70, 50]] },
  { x: 1060, y: 575, w: 220, h: 125, t: 0.33, windows: [[24, 32, 60, 50], [104, 32, 40, 50], [160, 32, 40, 50]] },
  { x: 1310, y: 555, w: 250, h: 145, t: 0.52, roof: 'gable', windows: [[26, 44, 54, 46], [100, 44, 54, 46], [174, 44, 54, 46]] },
];

const LAMPS = [320, 560, 1040, 1300];

function flicker(t: number) {
  return [t, t + 0.006, t + 0.012, t + 0.018, t + 0.026];
}

function House({ d, p }: { d: HouseDef; p: MotionValue<number> }) {
  const on = useTransform(p, flicker(d.t), [1, 0.15, 0.85, 0.1, 0]);
  const off = useTransform(on, (v) => (1 - v) * 0.72);
  const roofH = d.back ? 18 : 40;
  return (
    <g className={d.back ? 'bo-house bo-house--back' : 'bo-house'}>
      {!d.back && <motion.ellipse cx={d.x + d.w / 2} cy={d.y + d.h + 6} rx={d.w * 0.7} ry="22" fill="url(#spill)" style={{ opacity: on }} />}
      {d.roof === 'gable' ? (
        <polygon points={`${d.x - 8},${d.y} ${d.x + d.w / 2},${d.y - roofH} ${d.x + d.w + 8},${d.y}`} className="bo-roof" />
      ) : (
        <rect x={d.x - 6} y={d.y - 8} width={d.w + 12} height="10" className="bo-roof" />
      )}
      <rect x={d.x} y={d.y} width={d.w} height={d.h} className="bo-body" />
      {d.windows.map(([wx, wy, ww, wh], k) => (
        <g key={k}>
          <rect x={d.x + wx} y={d.y + wy} width={ww} height={wh} className="bo-win-off" />
          <motion.rect
            x={d.x + wx}
            y={d.y + wy}
            width={ww}
            height={wh}
            className="bo-win"
            style={{ opacity: on }}
          />
        </g>
      ))}
      {!d.back && <rect x={d.x + d.w / 2 - 14} y={d.y + d.h - 46} width="28" height="46" className="bo-door" />}
      <motion.rect x={d.x} y={d.y} width={d.w} height={d.h} className="bo-dark" style={{ opacity: off }} />
    </g>
  );
}

function SolarHouse({ p }: { p: MotionValue<number> }) {
  const lights = useTransform(p, [CUT, CUT + 0.006, CUT + 0.02, CUT + 0.03], [1, 0.25, 0.25, 1]);
  const outline = useTransform(p, [CUT + 0.03, CUT + 0.2], [0.15, 1]);
  const halo = useTransform(p, [CUT + 0.03, 0.75], [0.25, 1]);
  const ring = useTransform(p, [CUT + 0.02, CUT + 0.05], [0.2, 1]);

  return (
    <g className="bo-solar">
      <motion.ellipse cx="800" cy="702" rx="420" ry="60" fill="url(#halo)" style={{ opacity: halo }} />
      <motion.circle cx="800" cy="560" r="330" fill="url(#aura)" style={{ opacity: halo }} />
      {/* panels */}
      <polygon points="655,430 945,430 918,384 682,384" className="bo-panel" />
      {[1, 2, 3, 4, 5, 6, 7].map((k) => (
        <line key={k} x1={655 + k * 36.25} y1="430" x2={682 + k * 29.5} y2="384" className="bo-panel-line" />
      ))}
      <line x1="668" y1="407" x2="932" y2="407" className="bo-panel-line" />
      {/* structure */}
      <rect x="600" y="430" width="400" height="22" className="bo-s-slab" />
      <rect x="630" y="452" width="340" height="98" className="bo-s-wall" />
      <rect x="590" y="550" width="420" height="18" className="bo-s-slab" />
      <rect x="618" y="568" width="364" height="132" className="bo-s-wall" />
      {/* lattice */}
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={884 + c * 19} y={468 + r * 19} width="13" height="13" className="bo-lattice" />)
      )}
      {/* lit glass */}
      <motion.g style={{ opacity: lights }}>
        <rect x="648" y="468" width="216" height="70" className="bo-s-glass" filter="url(#glow)" />
        <rect x="638" y="584" width="236" height="104" className="bo-s-glass" filter="url(#glow)" />
        <rect x="884" y="468" width="70" height="70" className="bo-s-lattice-lit" />
        <circle cx="720" cy="600" r="5" className="bo-lamp-dot" />
        <circle cx="800" cy="600" r="5" className="bo-lamp-dot" />
      </motion.g>
      {[0, 1, 2].map((k) => (
        <line key={k} x1={720 + k * 72} y1="468" x2={720 + k * 72} y2="538" className="bo-mullion" />
      ))}
      {[0, 1, 2].map((k) => (
        <line key={`l${k}`} x1={697 + k * 60} y1="584" x2={697 + k * 60} y2="688" className="bo-mullion" />
      ))}
      <rect x="660" y="640" width="120" height="30" rx="6" className="bo-sofa" />
      <rect x="878" y="568" width="10" height="132" className="bo-column" />
      {/* battery */}
      <rect x="912" y="606" width="40" height="64" rx="4" className="bo-battery" />
      <motion.circle cx="932" cy="626" r="8" className="bo-battery-ring" filter="url(#glow)" style={{ opacity: ring }} />
      {[0, 1, 2].map((k) => (
        <motion.rect key={k} x="924" y={642 + k * 7} width="16" height="3" rx="1.5" className="bo-battery-bar" style={{ opacity: ring }} />
      ))}
      {/* outline glow */}
      <motion.path
        d="M600 430 H1000 V452 H970 V550 H1010 V568 H982 V700 H618 V568 H590 V550 H630 V452 H600 Z"
        className="bo-outline"
        filter="url(#glow-strong)"
        style={{ opacity: outline }}
      />
      <motion.path d="M520 702 H1080" className="bo-outline" filter="url(#glow-strong)" style={{ opacity: outline }} />
    </g>
  );
}

function Lamp({ x, p }: { x: number; p: MotionValue<number> }) {
  const on = useTransform(p, flicker(CUT - 0.01), [1, 0.2, 0.7, 0.1, 0]);
  return (
    <g>
      <motion.path d={`M${x - 70} 704 L${x - 6} 612 L${x + 6} 612 L${x + 70} 704 Z`} fill="url(#beam)" style={{ opacity: on }} />
      <rect x={x - 2} y="606" width="4" height="96" className="bo-pole" />
      <rect x={x - 12} y="602" width="24" height="6" rx="3" className="bo-pole" />
      <motion.circle cx={x} cy="611" r="4" className="bo-lamp-dot" style={{ opacity: on }} />
    </g>
  );
}

export default function Blackout({ mobile }: { mobile: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  const night = useTransform(p, [0.05, CUT, 0.6], [0, 0.55, 0.92]);
  const flash = useTransform(p, [CUT - 0.03, CUT - 0.025, CUT - 0.018, CUT - 0.012, CUT - 0.005], [0, 0.8, 0.1, 0.55, 0]);
  const stars = useTransform(p, [0.4, 0.7], [0, 1]);
  const zoom = useTransform(p, [0.55, 1], [1, mobile ? 1.06 : 1.12]);
  const sceneY = useTransform(p, [0.55, 1], ['0%', mobile ? '0%' : '13%']);
  const hud = useTransform(p, [0.62, 0.7], [1, 0]);

  const t1 = useTransform(p, [0, 0.04, 0.2, 0.26], [0, 1, 1, 0]);
  const t2 = useTransform(p, [0.28, 0.33, 0.56, 0.62], [0, 1, 1, 0]);
  const t3 = useTransform(p, [0.66, 0.74, 1], [0, 1, 1]);
  const t3y = useTransform(p, [0.66, 0.76], [60, 0]);
  const pe3 = useTransform(t3, (v) => (v > 0.6 ? 'auto' : 'none'));

  const [dark, setDark] = useState(0);
  const [grid, setGrid] = useState(true);
  const [batt, setBatt] = useState(100);
  useMotionValueEvent(p, 'change', (v) => {
    setDark(HOUSES.filter((h) => v > h.t + 0.02).length);
    setGrid(v < CUT);
    setBatt(v < CUT ? 100 : Math.max(94, Math.round(100 - (v - CUT) * 9)));
  });

  return (
    <section ref={ref} id="apagon" className="blackout">
      <div className="blackout__sticky">
        <motion.svg
          className="blackout__svg"
          viewBox={mobile ? '0 -720 1600 1620' : '0 0 1600 900'}
          preserveAspectRatio={mobile ? 'xMidYMax meet' : 'xMidYMid slice'}
          style={{ scale: zoom, y: sceneY }}
        >
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#14243a" />
              <stop offset="0.6" stopColor="#3a4d68" />
              <stop offset="1" stopColor="#c58a5c" />
            </linearGradient>
            <linearGradient id="skyNight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#020308" />
              <stop offset="1" stopColor="#0a0f1a" />
            </linearGradient>
            <radialGradient id="spill">
              <stop offset="0" stopColor="#ffcf5a" stopOpacity="0.45" />
              <stop offset="1" stopColor="#ffcf5a" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="halo">
              <stop offset="0" stopColor="#ffd84d" stopOpacity="0.6" />
              <stop offset="1" stopColor="#ffd84d" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="aura">
              <stop offset="0" stopColor="#ffd84d" stopOpacity="0.22" />
              <stop offset="0.6" stopColor="#ffb84d" stopOpacity="0.06" />
              <stop offset="1" stopColor="#ffb84d" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffe6a0" stopOpacity="0.5" />
              <stop offset="1" stopColor="#ffe6a0" stopOpacity="0" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-strong" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="7" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect y="-720" width="1600" height="1620" fill="url(#sky)" />
          <motion.rect y="-720" width="1600" height="1620" fill="url(#skyNight)" style={{ opacity: night }} />
          <motion.g style={{ opacity: stars }}>
            {STARS.map(([x, y, r], k) => (
              <circle key={k} cx={x} cy={y} r={r} fill="#fff" opacity={0.4 + (k % 5) * 0.12} />
            ))}
          </motion.g>
          <circle cx="1270" cy="170" r="34" fill="#f3ead7" opacity="0.85" />
          <circle cx="1284" cy="160" r="32" fill="#14243a" opacity="0.9" />

          <path d="M0 520 C 180 400, 330 430, 480 470 S 760 380, 900 430 S 1220 360, 1360 440 S 1540 450, 1600 430 V900 H0 Z" className="bo-hill-far" />
          <path d="M0 580 C 220 500, 420 540, 640 540 S 1040 500, 1200 540 S 1500 520, 1600 540 V900 H0 Z" className="bo-hill" />

          {/* power lines */}
          <path d="M0 470 Q 200 500 400 470 T 800 470 T 1200 470 T 1600 470" className="bo-wire" />
          <path d="M0 480 Q 200 510 400 480 T 800 480 T 1200 480 T 1600 480" className="bo-wire" />

          {HOUSES.filter((h) => h.back).map((h, k) => (
            <House key={k} d={h} p={p} />
          ))}

          <rect y="700" width="1600" height="200" className="bo-ground" />
          <rect y="740" width="1600" height="40" className="bo-street" />
          {[...Array(16)].map((_, k) => (
            <rect key={k} x={k * 110 + 20} y="758" width="50" height="4" className="bo-lane" />
          ))}

          {LAMPS.map((x) => (
            <Lamp key={x} x={x} p={p} />
          ))}
          {HOUSES.filter((h) => !h.back).map((h, k) => (
            <House key={k} d={h} p={p} />
          ))}
          <SolarHouse p={p} />

          <motion.rect y="-720" width="1600" height="1620" fill="#dfe8ff" style={{ opacity: flash }} />
        </motion.svg>

        <motion.div className="blackout__hud" style={{ opacity: hud }}>
          <div className={`hud ${grid ? '' : 'hud--down'}`}>
            <span className="hud__dot" />
            <span>Red eléctrica</span>
            <b>{grid ? 'Activa' : 'Caída'}</b>
          </div>
          <div className="hud">
            <span className="hud__dot hud__dot--sun" />
            <span>Casas sin luz</span>
            <b>
              {dark}/{HOUSES.length}
            </b>
          </div>
          <div className="hud hud--yellow">
            <Sun size={14} />
            <span>Tu casa</span>
            <b>{grid ? 'Conectada' : `Batería ${batt}%`}</b>
          </div>
        </motion.div>

        <motion.div className="blackout__copy" style={{ opacity: t1 }}>
          <span className="eyebrow">04 · El momento de la verdad</span>
          <h2>
            7:48 PM. Una noche <em className="serif">normal</em> en tu sector.
          </h2>
        </motion.div>
        <motion.div className="blackout__copy" style={{ opacity: t2 }}>
          <span className="eyebrow eyebrow--red">Apagón</span>
          <h2>
            Se va la luz. <em className="serif">Otra vez.</em>
          </h2>
          <p>Neveras, abanicos, internet, trabajo… todo se detiene en el vecindario.</p>
        </motion.div>
        <motion.div className="blackout__copy blackout__copy--final" style={{ opacity: t3, y: t3y, pointerEvents: pe3 }}>
          <h2 className="blackout__big">
            Mientras todo se apaga,
            <br />
            <span className="glow-text">tu casa sigue encendida.</span>
          </h2>
          <p>Con placas solares y batería de respaldo de Eco House, te mantienes siempre encendido.</p>
          <MagneticButton className="btn btn--yellow" onClick={() => scrollToId('cotizar')}>
            Quiero esa tranquilidad <ArrowUpRight size={20} />
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}

const STARS: [number, number, number][] = Array.from({ length: 110 }, (_, k) => {
  const x = (k * 233.7) % 1600;
  const y = ((k * 97.3) % 1000) - 600;
  return [x, y, k % 7 === 0 ? 1.8 : 1];
});
