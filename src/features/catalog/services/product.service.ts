/**
 * @file product.service.ts
 * @description Servicio HTTP para operaciones CRUD sobre productos (joyas)
 * de Joyería KOB. Toda comunicación con el backend pasa por aquí.
 *
 * ## Endpoints que consume
 * - `GET  /products`        → Listado público
 * - `GET  /products?admin=true` → Listado completo para admin
 * - `GET  /products/:id`    → Detalle de un producto
 * - `POST /products`        → Crear nueva joya (multipart/form-data)
 * - `PUT  /products/:id`    → Actualizar joya (multipart/form-data)
 *
 * ## Nota sobre imágenes
 * Tanto la creación como la actualización usan `multipart/form-data` porque
 * el backend requiere archivos de imagen reales junto con los demás campos.
 * La función `buildProductFormData` centraliza la construcción del FormData
 * para evitar duplicación entre `create` y `update`.
 */

import { apiClient } from '@/api/api-client';
import type {
  CreateProductPayload,
  Product,
  UpdateProductPayload,
} from '../types/product.types';

// ─── Tipos de respuesta ───────────────────────────────────────────────────────

interface ProductResponse {
  success: boolean;
  data: Product;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Construye el `FormData` para la actualización de un producto.
 * Solo incluye los campos que están presentes en el payload para
 * permitir actualizaciones parciales.
 *
 * @param payload - Campos a actualizar (todos opcionales).
 * @returns `FormData` listo para enviarse al backend.
 */
function buildUpdateFormData(payload: UpdateProductPayload): FormData {
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

/**
 * Construye el `FormData` para la creación de un nuevo producto.
 * Todos los campos requeridos por el backend se incluyen siempre.
 * Las imágenes se adjuntan como archivos reales bajo la clave `imageFiles`.
 *
 * @param payload - Datos completos del nuevo producto.
 * @returns `FormData` listo para enviarse al backend.
 */
function buildCreateFormData(payload: CreateProductPayload): FormData {
  const formData = new FormData();

  formData.append('name', payload.name);
  formData.append('description', payload.description);
  formData.append('categoryId', String(payload.categoryId));
  formData.append('baseWeight', String(payload.baseWeight));
  formData.append('additionalValue', String(payload.additionalValue));
  formData.append('stock', String(payload.stock));
  formData.append('specifications', JSON.stringify(payload.specifications));

  payload.imageFiles.forEach((file) => {
    formData.append('imageFiles', file);
  });

  return formData;
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const productService = {
  /**
   * Obtiene el listado público de productos, con filtros opcionales.
   *
   * @param filters - Filtros opcionales: `categoryId` para filtrar por categoría.
   * @returns Array de productos visibles en el catálogo público.
   */
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

  /**
   * Obtiene el listado completo de productos para el panel de administración,
   * incluyendo los que están ocultos o sin stock.
   *
   * @returns Array completo de productos.
   */
  async getAll(): Promise<Product[]> {
    const response = await apiClient.get('/products?admin=true');
    return response.data.data ?? [];
  },

  /**
   * Obtiene el detalle completo de un producto por su UUID.
   *
   * @param id - UUID del producto.
   * @returns El producto con todos sus campos y relaciones.
   */
  async getById(id: string): Promise<Product> {
    const response = await apiClient.get<ProductResponse>(`/products/${id}`);
    return response.data.data;
  },

  /**
   * Crea una nueva joya en el catálogo.
   * Envía los datos como `multipart/form-data` para incluir los archivos
   * de imagen. El precio se calcula automáticamente en el backend.
   *
   * @param payload - Datos completos del nuevo producto, incluyendo archivos de imagen.
   * @returns El producto recién creado con su ID, precio calculado y URLs de imágenes.
   *
   * @throws Error del backend si la validación falla o hay un error del servidor.
   *
   * @example
   * ```typescript
   * const newProduct = await productService.create({
   *   name: 'Anillo Solitario',
   *   description: 'Oro 18k con diamante central',
   *   categoryId: 3,
   *   baseWeight: 4.5,
   *   additionalValue: 1200000,
   *   stock: 5,
   *   specifications: { requiresSize: true, hasStones: true },
   *   imageFiles: [file1, file2],
   * });
   * ```
   */
  async create(payload: CreateProductPayload): Promise<Product> {
    const formData = buildCreateFormData(payload);
    const response = await apiClient.post<ProductResponse>(
      '/products',
      formData,
    );
    return response.data.data;
  },

  /**
   * Actualiza una joya existente.
   * Solo los campos incluidos en el payload se modifican en el backend.
   * Si se envían `imageFiles`, se agregan a las existentes (respetando el límite de 5).
   * Si se envía `imagesToDelete`, esas imágenes se eliminan físicamente del servidor.
   *
   * @param id      - UUID del producto a actualizar.
   * @param payload - Campos a modificar (todos opcionales).
   * @returns El producto actualizado con el precio recalculado.
   */
  async update(id: string, payload: UpdateProductPayload): Promise<Product> {
    const formData = buildUpdateFormData(payload);
    const response = await apiClient.put<ProductResponse>(
      `/products/${id}`,
      formData,
    );
    return response.data.data;
  },

  /**
   * Oculta un producto del catálogo público cambiando su estado a `HIDDEN`.
   *
   * @param id - UUID del producto a ocultar.
   * @returns El producto actualizado con el nuevo estado.
   */
  async hide(id: string): Promise<Product> {
    const formData = new FormData();
    formData.append('status', 'HIDDEN');

    const response = await apiClient.put<ProductResponse>(
      `/products/${id}`,
      formData,
    );
    return response.data.data;
  },

  /**
   * Reactiva un producto oculto cambiando su estado a `AVAILABLE`.
   *
   * @param id - UUID del producto a activar.
   * @returns El producto actualizado con el nuevo estado.
   */
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