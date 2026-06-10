/**
 * @file featured-product.store.ts
 * @description Store de Zustand para gestionar la lista de productos destacados
 * de Joyería KOB.
 *
 * ## Responsabilidades
 * - Cachear los destacados consumidos por la home y la tarjeta admin.
 * - Exponer acciones idempotentes que envuelven a `FeaturedProductService`:
 *   `fetchFeatured`, `addFeatured`, `removeFeatured`, `reorderFeatured`.
 * - Manejar **actualizaciones optimistas** en el reorder para que el admin
 *   vea el cambio instantáneo y, si el backend falla, se revierta al estado
 *   anterior con un toast de error.
 *
 * ## Ciclo de vida del dato
 * ```
 * HomePage / AdminGeneralPage monta
 *   → fetchFeatured()
 *     → GET /featured-products
 *       → ok → hydrata `items`
 *       → error → expone `fetchError`
 *
 * Admin agrega/quita/reordena
 *   → addFeatured / removeFeatured / reorderFeatured
 *     → mutación + refetch optimista (para reorder) o re-hidratación tras éxito
 * ```
 *
 * ## Sobre el reorder optimista
 * El endpoint `PUT /featured-products/reorder` exige enviar TODOS los destacados.
 * El store se encarga de construir el payload completo a partir del estado
 * actual y del orden deseado, de manera que la UI solo necesite indicar
 * "mueve este id a esta posición" sin preocuparse de la regla del backend.
 *
 * ## Uso
 * ```tsx
 * // En la home:
 * const { items, isFetching, fetchFeatured } = useFeaturedProductStore();
 * useEffect(() => { void fetchFeatured(); }, [fetchFeatured]);
 *
 * // En el admin:
 * const { addFeatured, removeFeatured, reorderFeatured, isSaving } =
 *   useFeaturedProductStore();
 * ```
 */

import { create } from 'zustand';
import { FeaturedProductService } from '@/features/featured-products/services/featured-product.service';
import type {
  FeaturedProductWithProduct,
  ReorderFeaturedProductsPayload,
} from '@/features/featured-products/types/featured-product.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Construye un payload de reorder a partir de un array ya ordenado.
 * Asigna posiciones 1..N en el orden recibido.
 *
 * @param ordered - Array de destacados en el orden visual deseado.
 * @returns Payload listo para enviar a `PUT /featured-products/reorder`.
 */
const buildReorderPayload = (
  ordered: FeaturedProductWithProduct[],
): ReorderFeaturedProductsPayload =>
  ordered.map((item, index) => ({
    productId: item.productId,
    position: index + 1,
  }));

/**
 * Devuelve una copia del array con las posiciones reasignadas 1..N en el
 * orden actual. Útil para mantener `position` coherente tras un reorden local.
 */
const reassignPositions = (
  ordered: FeaturedProductWithProduct[],
): FeaturedProductWithProduct[] =>
  ordered.map((item, index) => ({ ...item, position: index + 1 }));

// ─── Forma del estado ─────────────────────────────────────────────────────────

interface FeaturedProductState {
  // ── Datos ─────────────────────────────────────────────────────────────────

  /**
   * Lista ordenada de destacados.
   * Siempre se mantiene ordenada por `position` ascendente.
   */
  items: FeaturedProductWithProduct[];

  // ── Estado de carga ───────────────────────────────────────────────────────

  /** `true` mientras se ejecuta la petición GET inicial. */
  isFetching: boolean;
  /** Mensaje de error de la última carga, o `null` si fue exitosa. */
  fetchError: string | null;

  // ── Estado de mutaciones ──────────────────────────────────────────────────

  /**
   * `true` mientras hay una mutación (agregar/quitar/reordenar) en curso.
   * Permite a la UI deshabilitar botones para evitar dobles envíos.
   */
  isSaving: boolean;
  /** Mensaje de error de la última mutación, o `null` si fue exitosa. */
  saveError: string | null;

  // ── Acciones ──────────────────────────────────────────────────────────────

  /**
   * Carga los destacados desde el backend y reemplaza `items`.
   * Limpia errores previos al iniciar.
   */
  fetchFeatured: () => Promise<void>;

  /**
   * Agrega un producto a la lista de destacados.
   * Refresca la lista completa tras éxito para sincronizar posiciones.
   *
   * @param productId - UUID del producto a destacar.
   * @returns `true` si la operación fue exitosa, `false` en caso contrario.
   */
  addFeatured: (productId: string) => Promise<boolean>;

  /**
   * Elimina un producto de los destacados.
   * Refresca la lista para reflejar la recompactación de posiciones del backend.
   *
   * @param productId - UUID del producto a quitar.
   * @returns `true` si la operación fue exitosa, `false` en caso contrario.
   */
  removeFeatured: (productId: string) => Promise<boolean>;

  /**
   * Aplica un reorden completo a partir de la lista ya ordenada en la UI.
   *
   * Estrategia **optimista**:
   * 1. Guarda una copia del estado actual.
   * 2. Aplica el nuevo orden localmente y actualiza `position` (1..N).
   * 3. Envía el payload completo al backend.
   * 4. Si el backend responde ok → reemplaza con el resultado del servidor.
   * 5. Si falla → revierte al estado previo y expone `saveError`.
   *
   * @param ordered - Lista en el orden visual deseado.
   * @returns `true` si la operación fue exitosa, `false` en caso contrario.
   */
  reorderFeatured: (
    ordered: FeaturedProductWithProduct[],
  ) => Promise<boolean>;
}

// ─── Mensajes de error legibles ───────────────────────────────────────────────

/**
 * Traduce un error de Axios al mensaje en español que se muestra al admin.
 * Mira primero el `message` que envía el backend; si no hay, usa un fallback.
 */
const extractErrorMessage = (error: unknown, fallback: string): string => {
  const apiMessage = (
    error as { response?: { data?: { message?: string } } }
  )?.response?.data?.message;
  return apiMessage ?? fallback;
};

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * Store global de productos destacados.
 * No persiste en localStorage — los datos vienen siempre del backend para
 * garantizar consistencia entre el cliente y el panel admin.
 */
export const useFeaturedProductStore = create<FeaturedProductState>()(
  (set, get) => ({
    // ── Estado inicial ───────────────────────────────────────────────────────
    items: [],

    isFetching: false,
    fetchError: null,

    isSaving: false,
    saveError: null,

    // ── fetchFeatured ────────────────────────────────────────────────────────
    fetchFeatured: async () => {
      set({ isFetching: true, fetchError: null });

      try {
        const items = await FeaturedProductService.getAll();
        // Defensa: orden por position ascendente aunque el backend ya lo haga.
        const sorted = [...items].sort((a, b) => a.position - b.position);
        set({ items: sorted, isFetching: false });
      } catch (error) {
        set({
          isFetching: false,
          fetchError: extractErrorMessage(
            error,
            'No se pudieron cargar los productos destacados.',
          ),
        });
      }
    },

    // ── addFeatured ──────────────────────────────────────────────────────────
    addFeatured: async (productId) => {
      set({ isSaving: true, saveError: null });

      try {
        await FeaturedProductService.add(productId);
        // Refrescamos la lista completa para sincronizar posiciones reales
        // (el backend asigna la última disponible y queremos verlo reflejado).
        const items = await FeaturedProductService.getAll();
        const sorted = [...items].sort((a, b) => a.position - b.position);
        set({ items: sorted, isSaving: false });
        return true;
      } catch (error) {
        set({
          isSaving: false,
          saveError: extractErrorMessage(
            error,
            'No se pudo agregar el producto destacado.',
          ),
        });
        return false;
      }
    },

    // ── removeFeatured ───────────────────────────────────────────────────────
    removeFeatured: async (productId) => {
      set({ isSaving: true, saveError: null });

      try {
        await FeaturedProductService.remove(productId);
        // Refresco completo: el backend recompacta posiciones tras delete.
        const items = await FeaturedProductService.getAll();
        const sorted = [...items].sort((a, b) => a.position - b.position);
        set({ items: sorted, isSaving: false });
        return true;
      } catch (error) {
        set({
          isSaving: false,
          saveError: extractErrorMessage(
            error,
            'No se pudo eliminar el producto destacado.',
          ),
        });
        return false;
      }
    },

    // ── reorderFeatured (optimista) ──────────────────────────────────────────
    reorderFeatured: async (ordered) => {
      // 1. Snapshot del estado previo para poder revertir si el backend falla.
      const previous = get().items;

      // 2. Aplicar el nuevo orden localmente con posiciones 1..N.
      set({
        items: reassignPositions(ordered),
        isSaving: true,
        saveError: null,
      });

      try {
        // 3. Persistir en el backend con el payload completo.
        const payload = buildReorderPayload(ordered);
        const result = await FeaturedProductService.reorder(payload);

        // 4. Reemplazar con la respuesta del servidor (fuente de verdad).
        const sorted = [...result].sort((a, b) => a.position - b.position);
        set({ items: sorted, isSaving: false });
        return true;
      } catch (error) {
        // 5. Revertir al estado previo y exponer error.
        set({
          items: previous,
          isSaving: false,
          saveError: extractErrorMessage(
            error,
            'No se pudo reordenar los productos destacados.',
          ),
        });
        return false;
      }
    },
  }),
);