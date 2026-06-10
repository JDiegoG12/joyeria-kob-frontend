/**
 * @file gold-price.store.ts
 * @description Store de Zustand para gestionar el precio actual del oro por gramo.
 *
 * Este store es la fuente única de verdad del precio del oro en toda la
 * aplicación. Cualquier componente o formulario que necesite calcular el
 * precio estimado de una joya debe leerlo desde aquí, en lugar de llamar
 * al servicio directamente.
 *
 * ## Responsabilidades
 * - Cargar el precio del oro desde el backend una única vez por sesión.
 * - Exponerlo globalmente para que los formularios de creación y edición
 *   puedan calcular precios estimados en tiempo real.
 * - Evitar peticiones duplicadas si el precio ya fue cargado.
 *
 * ## Fórmula de precio estimado de una joya
 * ```
 * precioEstimado = pesoBase × goldPricePerGram + valorAdicional
 * ```
 *
 * ## Uso en componentes
 * ```tsx
 * import { useGoldPriceStore } from '@/store/gold-price.store';
 *
 * const { goldPricePerGram, isLoading, loadGoldPrice } = useGoldPriceStore();
 *
 * useEffect(() => {
 *   void loadGoldPrice();
 * }, [loadGoldPrice]);
 *
 * const estimatedPrice = baseWeight * goldPricePerGram + additionalValue;
 * ```
 */
import { create } from 'zustand';
import { GeneralService } from '@/features/general/services/general.service';

// ─── Forma del estado ─────────────────────────────────────────────────────────
interface GoldPriceState {
    // ── Datos ──────────────────────────────────────────────────────────────────

    /**
   * Precio del oro por gramo en COP.
   * Es `null` mientras no se ha cargado por primera vez.
   */
    goldPricePerGram: number | null;

    /**
   * Fecha de la última actualización del precio en el sistema.
   * Es `null` mientras no se ha cargado por primera vez.
   */
    lastUpdate: string | null;

    // ── Estado de carga ────────────────────────────────────────────────────────
    /** `true` mientras se está obteniendo el precio del backend. */
    isLoading: boolean;

    /** Mensaje de error si la carga falló, o `null` si no hay error. */
    error: string | null;

    /**
   * Carga el precio del oro desde el backend.
   * Evita peticiones duplicadas si el precio ya fue cargado previamente.
   *
   * @param force - Si `true`, recarga aunque el precio ya esté en memoria.
   *
   * @example
   * ```tsx
   * useEffect(() => {
   *   void loadGoldPrice();
   * }, [loadGoldPrice]);
   * ```
   */
    loadGoldPrice: (force?: boolean) => Promise<void>;

    /**
   * Actualiza el precio del oro en el store local sin llamar al backend.
   * Se usa tras una actualización exitosa desde `GoldPriceCard` para
   * mantener el store sincronizado con el servidor.
   *
   * @param goldPricePerGram - Nuevo precio del oro en COP.
   * @param lastUpdate - Fecha ISO de la actualización.
   */
    setGoldPrice: (goldPricePerGram: number, lastUpdate: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * Store global del precio del oro.
 * No persiste en localStorage — se recarga en cada sesión para garantizar
 * que siempre se muestre el precio más reciente configurado por el administrador.
 */
export const useGoldPriceStore = create<GoldPriceState>()((set, get) => ({
    // Estado inicial
    goldPricePerGram: null,
    lastUpdate: null,
    isLoading: false,
    error: null,

    // ── loadGoldPrice ─────────────────────────────────────────────────────────
    loadGoldPrice: async (force = false) => {
        const current = get().goldPricePerGram;
        // Evita recargar si ya hay un precio en memoria y no se fuerza la recarga.
        // Se compara con != null para atrapar tanto null como undefined.
        if (!force && current != null) return;

        // Evita lanzar una segunda petición si ya hay una en curso
        if (get().isLoading) return;

        set({ isLoading: true, error: null });

        try {
            // GeneralService.getGoldPrice() ahora devuelve directamente { goldPricePerGram, lastUpdate }
            const data = await GeneralService.getGoldPrice();

            set({
                goldPricePerGram: data.goldPricePerGram,
                lastUpdate: data.lastUpdate,
                isLoading: false,
            });
        } catch {
            set({
                error: 'No se pudo obtener el precio del oro. Intenta de nuevo.',
                isLoading: false,
            });
        }
    },

    // ── setGoldPrice ──────────────────────────────────────────────────────────
    setGoldPrice: (goldPricePerGram: number, lastUpdate: string) => {
        set({ goldPricePerGram, lastUpdate });
    },
}));