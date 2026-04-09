import { apiClient } from '@/api/api-client';
import type { Product } from '../types/product.types';

interface ProductsResponse {
  success: boolean;
  data: Product[];
}

interface ProductResponse {
  success: boolean;
  data: Product;
}

export const productService = {
  async getAll(): Promise<Product[]> {
    const response = await apiClient.get<ProductsResponse>('/products');
    console.log('RESPUESTA API:', response.data);
    return response.data.data ?? [];
  },

  async getById(id: string): Promise<Product> {
    const response = await apiClient.get<ProductResponse>(`/products/${id}`);
    return response.data.data;
  },
};