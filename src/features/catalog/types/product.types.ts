export type ProductStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'HIDDEN';

export interface Category {
  id: number;
  name: string;
  slug: string;
}
export interface Product {
  id: string;
  name: string;
  description: string;
  priceCop: number;
  material: string;
  stock: number;
  imageUrl?: string;
}