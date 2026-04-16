import { apiClient } from '@/api/api-client';
import type { Product, UpdateProductPayload } from '../types/product.types';

interface ProductResponse {
  success: boolean;
  data: Product;
}

function buildProductFormData(payload: UpdateProductPayload): FormData {
  const formData = new FormData();

  if (payload.name !== undefined) {
    formData.append('name', payload.name);
  }

  if (payload.description !== undefined) {
    formData.append('description', payload.description);
  }

  if (payload.categoryId !== undefined) {
    formData.append('categoryId', String(payload.categoryId));
  }

  if (payload.baseWeight !== undefined) {
    formData.append('baseWeight', String(payload.baseWeight));
  }

  if (payload.additionalValue !== undefined) {
    formData.append('additionalValue', String(payload.additionalValue));
  }

  if (payload.stock !== undefined) {
    formData.append('stock', String(payload.stock));
  }

  if (payload.status !== undefined) {
    formData.append('status', payload.status);
  }

  if (payload.specifications !== undefined) {
    formData.append('specifications', JSON.stringify(payload.specifications));
  }

  if (payload.imageFiles?.length) {
    payload.imageFiles.forEach((file) => {
      formData.append('imageFiles', file);
    });
  }

  if (payload.imagesToDelete?.length) {
    formData.append('imagesToDelete', JSON.stringify(payload.imagesToDelete));
  }

  return formData;
}

export const productService = {
  async getPublic(filters?: {
    categoryId?: number | null;
  }): Promise<Product[]> {
    const params = new URLSearchParams();

    if (filters?.categoryId) {
      params.set('categoryId', String(filters.categoryId));
    }

    const query = params.toString();
    const response = await apiClient.get(
      `/products${query ? `?${query}` : ''}`,
    );
    return response.data.data ?? [];
  },

  async getAll(): Promise<Product[]> {
    const response = await apiClient.get('/products?admin=true');
    return response.data.data ?? [];
  },

  async getById(id: string): Promise<Product> {
    const response = await apiClient.get<ProductResponse>(`/products/${id}`);
    return response.data.data;
  },

  async update(id: string, payload: UpdateProductPayload): Promise<Product> {
    const formData = buildProductFormData(payload);
    const response = await apiClient.put<ProductResponse>(
      `/products/${id}`,
      formData,
    );
    return response.data.data;
  },

  async hide(id: string): Promise<Product> {
    const formData = new FormData();
    formData.append('status', 'HIDDEN');

    const response = await apiClient.put<ProductResponse>(
      `/products/${id}`,
      formData,
    );
    return response.data.data;
  },

  async activate(id: string): Promise<Product> {
    const formData = new FormData();
    formData.append('status', 'AVAILABLE');

    const response = await apiClient.put<ProductResponse>(
      `/products/${id}`,
      formData,
    );
    return response.data.data;
  },
};
