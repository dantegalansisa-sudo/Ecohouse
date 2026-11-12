import { createStore } from './createStore';
import { DEFAULT_PRODUCTS as DEFAULT, type Product } from '../../api/_lib/catalog.js';

export { CATEGORIES, type Category, type Product } from '../../api/_lib/catalog.js';

export const productStore = createStore<Product[]>('eh-products-v1', DEFAULT);
export const resetProducts = () => productStore.set(DEFAULT);
