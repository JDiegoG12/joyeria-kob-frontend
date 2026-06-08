/**
 * @file promo-banner.service.ts
 * @description Servicio HTTP para el CRUD de banners de promoción del carrusel.
 * Toda comunicación con `/api/promo-banners` pasa por aquí.
 *
 * ## Endpoints
 * - `GET    /promo-banners`         → Listado público ordenado por posición.
 * - `POST   /promo-banners`         → Crear banner (multipart/form-data).
 * - `PUT    /promo-banners/:id`     → Actualizar banner (multipart/form-data).
 * - `DELETE /promo-banners/:id`     → Eliminar banner.
 * - `PUT    /promo-banners/reorder` → Reordenar (JSON `{ items }`).
 *
 * ## Imágenes
 * El campo de archivo se llama `image` (igual que el contenido social). El
 * backend devuelve `imageUrl` como ruta relativa; se resuelve con `SERVER_URL`
 * en el punto de render.
 */

import { apiClient } from '@/api/api-client';
import type {
  PromoBanner,
  CreatePromoBannerPayload,
  UpdatePromoBannerPayload,
  ReorderPromoBannerItem,
} from '../types/promotion.types';

/**
 * Adjunta los campos de enlace al FormData según el tipo seleccionado.
 * Para `NONE` no se adjunta ningún id de destino.
 */
function appendLinkFields(
  formData: FormData,
  linkType: PromoBanner['linkType'],
  linkProductId?: string | null,
  linkCategoryId?: number | null,
): void {
  formData.append('linkType', linkType);
  if (linkType === 'PRODUCT' && linkProductId) {
    formData.append('linkProductId', linkProductId);
  }
  if (linkType === 'CATEGORY' && linkCategoryId != null) {
    formData.append('linkCategoryId', String(linkCategoryId));
  }
}

export const promoBannerService = {
  /** Obtiene todos los banners de promoción ordenados por posición. */
  async getAll(): Promise<PromoBanner[]> {
    const response = await apiClient.get<{ success: boolean; data: PromoBanner[] }>(
      '/promo-banners',
    );
    return response.data.data ?? [];
  },

  /** Crea un nuevo banner de promoción. */
  async create(payload: CreatePromoBannerPayload): Promise<PromoBanner> {
    const formData = new FormData();
    formData.append('image', payload.imageFile);
    if (payload.title !== undefined) formData.append('title', payload.title);
    if (payload.subtitle !== undefined) {
      formData.append('subtitle', payload.subtitle);
    }
    appendLinkFields(
      formData,
      payload.linkType,
      payload.linkProductId,
      payload.linkCategoryId,
    );

    const response = await apiClient.post<{ success: boolean; data: PromoBanner }>(
      '/promo-banners',
      formData,
    );
    return response.data.data;
  },

  /** Actualiza un banner existente. Solo envía los campos presentes. */
  async update(
    id: number,
    payload: UpdatePromoBannerPayload,
  ): Promise<PromoBanner> {
    const formData = new FormData();
    if (payload.imageFile) formData.append('image', payload.imageFile);
    if (payload.title !== undefined) formData.append('title', payload.title);
    if (payload.subtitle !== undefined) {
      formData.append('subtitle', payload.subtitle);
    }
    if (payload.linkType !== undefined) {
      appendLinkFields(
        formData,
        payload.linkType,
        payload.linkProductId,
        payload.linkCategoryId,
      );
    }

    const response = await apiClient.put<{ success: boolean; data: PromoBanner }>(
      `/promo-banners/${id}`,
      formData,
    );
    return response.data.data;
  },

  /** Elimina un banner de promoción. */
  async remove(id: number): Promise<void> {
    await apiClient.delete(`/promo-banners/${id}`);
  },

  /** Reordena la totalidad de los banners y devuelve la lista resultante. */
  async reorder(items: ReorderPromoBannerItem[]): Promise<PromoBanner[]> {
    const response = await apiClient.put<{ success: boolean; data: PromoBanner[] }>(
      '/promo-banners/reorder',
      { items },
    );
    return response.data.data ?? [];
  },
};
