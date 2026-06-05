/**
 * @file category.service.ts
 * @description Servicio de categorías del panel de administración de Joyería KOB.
 * Conecta directamente con el backend real usando `apiClient`.
 *
 * ## Endpoints que consume
 * - `GET    /categories`       → Listado completo con hijos anidados
 * - `GET    /categories/:id`   → Detalle de una categoría
 * - `POST   /categories`       → Crear nueva categoría o subcategoría
 * - `PUT    /categories/:id`   → Actualizar campos de una categoría
 * - `DELETE /categories/:id`   → Eliminar (falla si tiene hijos o productos)
 *
 * ## Uso desde el store
 * ```typescript
 * import { CategoryService } from '@/features/categories/services/category.service';
 *
 * const categories = await CategoryService.getAll();
 * ```
 */

import { apiClient } from '@/api/api-client';
import type {
    ApiSuccess,
    Category,
    CategoryCreateInput,
    CategoryUpdateInput,
} from '@/features/categories/types/category.types';

export const CategoryService = {
    /**
     * Obtiene todas las categorías con sus hijos anidados.
     * Úsalo para poblar el grid de la página de gestión.
     *
     * @returns Array de categorías raíz, cada una con su array `children`.
     */
    getAll: async (): Promise<Category[]> => {
        const response = await apiClient.get<ApiSuccess<Category[]>>('/categories');
        return response.data.data;
    },

    /**
     * Obtiene el detalle completo de una categoría por ID.
     *
     * @param id - ID numérico de la categoría.
     * @returns La categoría con sus relaciones `parent` y `children`.
     */
    getById: async (id: number): Promise<Category> => {
        const response = await apiClient.get<ApiSuccess<Category>>(
            `/categories/${id}`,
        );
        return response.data.data;
    },

    /**
     * Crea una nueva categoría o subcategoría.
     * Para crear subcategoría, incluye `parentId` en el payload.
     *
     * @param data - Datos de la nueva categoría. `name` y `slug` son obligatorios.
     * @returns La categoría recién creada con su ID asignado.
     *
     * @throws `SLUG_ALREADY_EXISTS` si el slug ya está en uso.
     * @throws `MISSING_FIELDS` si faltan `name` o `slug`.
     */
    create: async (data: CategoryCreateInput): Promise<Category> => {
        const response = await apiClient.post<ApiSuccess<Category>>(
            '/categories',
            data,
        );
        return response.data.data;
    },

    /**
     * Actualiza los campos de una categoría existente.
     * Solo se envían los campos que cambian.
     *
     * @param id   - ID de la categoría a actualizar.
     * @param data - Campos a modificar (todos opcionales).
     * @returns La categoría actualizada.
     *
     * @throws `CATEGORY_NOT_FOUND` si el ID no existe.
     * @throws `SLUG_ALREADY_EXISTS` si el nuevo slug ya está en uso.
     */
    update: async (id: number, data: CategoryUpdateInput): Promise<Category> => {
        const response = await apiClient.put<ApiSuccess<Category>>(
            `/categories/${id}`,
            data,
        );
        return response.data.data;
    },

    /**
     * Elimina permanentemente una categoría.
     * El backend rechaza la operación si la categoría tiene hijos o productos.
     *
     * @param id - ID de la categoría a eliminar.
     *
     * @throws `CATEGORY_HAS_CHILDREN` si tiene subcategorías asociadas.
     * @throws `CATEGORY_HAS_PRODUCTS` si tiene productos asociados.
     * @throws `CATEGORY_NOT_FOUND` si el ID no existe.
     */
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/categories/${id}`);
    },
};