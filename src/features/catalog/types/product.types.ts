export type ProductStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'HIDDEN';

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface ProductSpecifications {
  requiresSize?: boolean;
  sizes?: string[];
  stones?: string[];
  [key: string]: unknown;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: number;
  category?: Category;
  baseWeight: number;
  additionalValue: number;
  calculatedPrice: number;
  stock: number;
  status: ProductStatus;
  images: string[];
  specifications: ProductSpecifications;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  categoryId?: number;
  baseWeight?: number;
  additionalValue?: number;
  stock?: number;
  status?: ProductStatus;
  specifications?: ProductSpecifications;
  imageFiles?: File[];
  imagesToDelete?: string[];
}