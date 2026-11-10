import { createStore } from './createStore';

export type Category = 'baterias' | 'offgrid' | 'ofertas' | 'agua' | 'solar';

export const CATEGORIES: { id: Category | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'solar', label: 'Sistemas solares' },
  { id: 'baterias', label: 'Baterías' },
  { id: 'offgrid', label: 'Off-Grid' },
  { id: 'ofertas', label: 'Ofertas' },
  { id: 'agua', label: 'Cisternas y calentadores' },
];

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: Category;
  img?: string;
  tagline: string;
  specs: string[];
  capacityKwh?: number;
  outputW?: number;
  price?: number;
  badge?: string;
  visible: boolean;
  stock: 'disponible' | 'pocas' | 'agotado';
}

// Especificaciones marcadas "por confirmar" quedan editables desde el panel.
const DEFAULT: Product[] = [
  {
    id: 'sistema-solar',
    name: 'Sistema Solar Residencial',
    brand: 'Eco House',
    category: 'solar',
    img: '/img/panel-cut.webp',
    tagline: 'Placas de alta eficiencia diseñadas para tu techo y tu factura de LUMA.',
    specs: ['Diseño a la medida de tu consumo', 'Hasta 70% de ahorro en tu factura', '25 años de garantía en paneles', 'Instalación residencial y comercial'],
    visible: true,
    stock: 'disponible',
    badge: 'Más pedido',
  },
  {
    id: 'gendome',
    name: 'Gendome Power Station',
    brand: 'Gendome',
    category: 'baterias',
    img: '/img/p-gendome.webp',
    tagline: 'Estación de energía de respaldo con pantalla inteligente y ruedas.',
    specs: ['Respaldo silencioso durante apagones', 'Salidas AC y USB frontales', 'Compatible con carga solar', 'Capacidad: por confirmar'],
    visible: true,
    stock: 'disponible',
  },
  {
    id: 'fortress-eflex',
    name: 'Fortress Power eFlex 5.4',
    brand: 'Fortress Power',
    category: 'offgrid',
    img: '/img/p-fortress.webp',
    tagline: 'Batería de litio LiFePO4 para sistemas solares híbridos y off-grid.',
    specs: ['5.4 kWh por módulo', 'Química LiFePO4 de larga vida', 'Apilable para más capacidad', 'Ideal para sistemas off-grid'],
    capacityKwh: 5.4,
    visible: true,
    stock: 'disponible',
  },
  {
    id: 'sunbeat-combo',
    name: 'Combo Sunbeat Inversor + Batería',
    brand: 'Sunbeat',
    category: 'ofertas',
    img: '/img/p-sunbeat.webp',
    tagline: 'Inversor solar con pantalla y batería de pared en un solo paquete.',
    specs: ['Inversor híbrido con pantalla', 'Batería de pared compacta', 'Instalación incluida en la oferta', 'Capacidad: por confirmar'],
    visible: true,
    stock: 'pocas',
    badge: 'Oferta',
  },
  {
    id: 'delta-pro-3',
    name: 'EcoFlow DELTA Pro 3',
    brand: 'EcoFlow',
    category: 'baterias',
    img: '/img/delta-pro-3.webp',
    tagline: 'Respaldo portátil de nueva generación, expandible para todo el hogar.',
    specs: ['4 kWh de capacidad base', '4,000W de salida AC', 'Expandible hasta 48 kWh', 'Batería LFP'],
    capacityKwh: 4,
    outputW: 4000,
    visible: true,
    stock: 'disponible',
  },
  {
    id: 'delta-pro',
    name: 'EcoFlow DELTA Pro',
    brand: 'EcoFlow',
    category: 'baterias',
    img: '/img/delta-pro.webp',
    tagline: 'El clásico del respaldo en Puerto Rico. Potente y expandible.',
    specs: ['3.6 kWh de capacidad base', '3,600W de salida AC', 'Expandible', 'Batería LFP'],
    capacityKwh: 3.6,
    outputW: 3600,
    visible: true,
    stock: 'disponible',
  },
  {
    id: 'calentador-solar',
    name: 'Calentador Solar de Agua',
    brand: 'Eco House',
    category: 'agua',
    img: '/img/p-calentador.webp',
    tagline: 'Colectores solares con tanque termosifón en acero inoxidable.',
    specs: ['Agua caliente sin electricidad', 'Tanque en acero inoxidable', 'Sistema termosifón', 'Galones: por confirmar'],
    visible: true,
    stock: 'disponible',
  },
  {
    id: 'cisterna',
    name: 'Cisterna con Bomba',
    brand: 'Eco House',
    category: 'agua',
    tagline: 'Agua siempre disponible, aunque se vaya el servicio.',
    specs: ['Tanque presurizado', 'Bomba y filtro', 'Entrega e instalación', 'Galones: por confirmar'],
    visible: true,
    stock: 'disponible',
  },
];

export const productStore = createStore<Product[]>('eh-products-v1', DEFAULT);
export const resetProducts = () => productStore.set(DEFAULT);
