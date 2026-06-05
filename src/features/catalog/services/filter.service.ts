/**
 * @file filter.service.ts
 * @description Servicio que provee las categorías y subcategorías
 * disponibles para el sidebar de filtros del catálogo.
 *
 * ## Modo mock
 * `USE_MOCK = true` devuelve datos simulados sin petición HTTP.
 * Cuando el backend esté listo, cambia a `false` — el sidebar
 * y el store no necesitan ningún cambio.
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

/**
 * Controla si el servicio usa datos simulados o llama al backend real.
 * - `true`  → Usa mocks locales (backend en desarrollo).
 * - `false` → Llama a los endpoints reales del backend.
 */
const USE_MOCK = true;

// ─── Datos mock ───────────────────────────────────────────────────────────────

/**
 * Categorías y subcategorías de ejemplo.
 * Reemplazar con los datos reales del backend cuando estén disponibles.
 */
const MOCK_CATEGORIES: JewelryCategory[] = [
    {
        id: 'anillos',
        label: 'Anillos',
        subCategories: [
            { id: 'compromiso', label: 'Compromiso' },
            { id: 'matrimonio', label: 'Matrimonio' },
            { id: 'solitarios', label: 'Solitarios' },
            { id: 'eternidad', label: 'Eternidad' },
        ],
    },
    {
        id: 'collares',
        label: 'Collares',
        subCategories: [
            { id: 'cadenas', label: 'Cadenas' },
            { id: 'colgantes', label: 'Colgantes' },
            { id: 'chokers', label: 'Chokers' },
        ],
    },
    {
        id: 'aretes',
        label: 'Aretes',
        subCategories: [
            { id: 'dormilonas', label: 'Dormilonas' },
            { id: 'argollas', label: 'Argollas' },
            { id: 'colgantes-aretes', label: 'Colgantes' },
        ],
    },
    {
        id: 'pulseras',
        label: 'Pulseras',
        subCategories: [
            { id: 'rigidas', label: 'Rígidas' },
            { id: 'cadena-pul', label: 'De cadena' },
            { id: 'charm', label: 'Charm' },
        ],
    },
];

// ─── Servicio ─────────────────────────────────────────────────────────────────

/** Servicio de categorías y filtros del catálogo. */
export const FilterService = {
    /**
     * Obtiene todas las categorías principales con sus subcategorías.
     *
     * @returns Lista de categorías disponibles para el sidebar de filtros.
     *
     * @example
     * ```typescript
     * const categories = await FilterService.getCategories();
     * ```
     */
    getCategories: async (): Promise<JewelryCategory[]> => {
        if (USE_MOCK) {
            await new Promise((resolve) => setTimeout(resolve, 400));
            return MOCK_CATEGORIES;
        }

        const response = await apiClient.get<JewelryCategory[]>('/categories');
        return response.data;
    },
};