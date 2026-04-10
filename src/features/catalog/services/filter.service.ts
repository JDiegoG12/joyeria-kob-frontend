/**
 * @file filter.service.ts
 * @description Servicio que provee las categorías y subcategorías
 * disponibles para el sidebar de filtros del catálogo público.
 *
 * ## Conexión con el backend
 * Consume `GET /categories` que devuelve el árbol completo de categorías
 * con el modelo `Category` del backend (id: number, name, slug, children).
 *
 * ## Transformación de datos
 * El backend devuelve `Category` (modelo técnico con `id: number`, `name`,
 * `slug`, `children`). El sidebar del catálogo espera `JewelryCategory`
 * (modelo de UI con `id: string`, `label`, `subCategories`).
 *
 * Esta transformación ocurre aquí, en el servicio, de forma que ni el
 * `filter.store.ts` ni los componentes del sidebar necesitan cambios.
 *
 * ## Filtrado
 * Solo se exponen en el sidebar las categorías raíz (`parentId === null`)
 * que tienen al menos un hijo. Las categorías hoja sin subcategorías se
 * muestran igual pero con `subCategories: []`.
 *
 * ## Uso desde el store de filtros
 * ```typescript
 * import { FilterService } from '@/features/catalog/services/filter.service';
 *
 * const categories = await FilterService.getCategories();
 * ```
 */

import { apiClient } from '@/api/api-client';
import type { JewelryCategory } from '@/features/catalog/types/filter.types';

// ─── Tipo mínimo del backend que necesitamos ──────────────────────────────────

/**
 * Subconjunto de la respuesta del backend que necesita el transformador.
 * No importamos `Category` completo de `category.types.ts` para evitar
 * acoplar la feature de catálogo con la de administración.
 */
interface BackendCategory {
    id: number;
    name: string;
    slug: string;
    parentId: number | null;
    children: BackendCategory[];
}

interface BackendResponse {
    success: boolean;
    data: BackendCategory[];
}

// ─── Transformador ────────────────────────────────────────────────────────────

/**
 * Convierte una `BackendCategory` raíz en `JewelryCategory` para el sidebar.
 *
 * - `id`           → `String(category.id)` para mantener el tipo `string` del store
 * - `name`         → `label`
 * - `children`     → `subCategories` (solo primer nivel)
 *
 * @param category - Categoría raíz devuelta por el backend.
 * @returns Categoría en el formato que espera el sidebar del catálogo.
 */
const toJewelryCategory = (category: BackendCategory): JewelryCategory => ({
    id: String(category.id),
    label: category.name,
    subCategories: category.children.map((child) => ({
        id: String(child.id),
        label: child.name,
    })),
});

// ─── Servicio ─────────────────────────────────────────────────────────────────

/** Servicio de categorías para el sidebar de filtros del catálogo público. */
export const FilterService = {
    /**
     * Obtiene todas las categorías raíz con sus subcategorías directas
     * y las transforma al formato que espera el `filter.store`.
     *
     * Solo se incluyen categorías cuyo `parentId` es `null` (raíces).
     * Las subcategorías anidadas más de un nivel no se exponen en el sidebar.
     *
     * @returns Lista de categorías listas para el sidebar de filtros.
     *
     * @throws Error de red o de servidor si el backend no responde.
     *
     * @example
     * ```typescript
     * const categories = await FilterService.getCategories();
     * // [{ id: '1', label: 'Anillos', subCategories: [...] }, ...]
     * ```
     */
    getCategories: async (): Promise<JewelryCategory[]> => {
        const response = await apiClient.get<BackendResponse>('/categories');
        const all = response.data.data;

        // Solo categorías raíz — el backend ya incluye children anidados
        const roots = all.filter((cat) => cat.parentId === null);

        return roots.map(toJewelryCategory);
    },
};