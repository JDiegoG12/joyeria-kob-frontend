/**
 * @file hero-banner.store.ts
 * @description Store de Zustand para gestionar el banner hero principal
 * de Joyería KOB.
 *
 * ## Responsabilidades
 * - Obtener el banner desde el backend al montar la home page (`fetchBanner`).
 * - Exponer los datos del banner al carrusel de la home.
 * - Permitir al panel admin guardar cambios via `saveBanner`.
 *
 * ## Ciclo de vida del dato
 * ```
 * HeroCarousel monta
 *   → fetchBanner()
 *     → GET /api/banner
 *       → ok   → hydrata bannerText / bannerSubtitle / bannerImageUrl
 *       → 404  → usa valores por defecto (banner aún no configurado)
 *       → otro error → expone `fetchError`
 *
 * Admin guarda en HeroBannerCard
 *   → saveBanner({ title, subtitle, imageFile? })
 *     → PUT /api/banner (multipart/form-data)
 *       → ok → actualiza el estado con los datos devueltos por el backend
 * ```
 *
 * ## Eliminación del localStorage
 * El store ya no usa el middleware `persist` de Zustand. Los datos se
 * obtienen siempre desde el servidor, lo que garantiza consistencia entre
 * sesiones y entre distintos administradores.
 *
 * ## Uso
 * ```tsx
 * // En HeroCarousel (home):
 * const { bannerText, bannerSubtitle, bannerImageUrl, fetchBanner } =
 *   useHeroBannerStore();
 *
 * useEffect(() => { fetchBanner(); }, [fetchBanner]);
 *
 * // En HeroBannerCard (admin):
 * const { saveBanner, isSaving, saveError } = useHeroBannerStore();
 * ```
 */
import { create } from 'zustand';
import { GeneralService } from '@/features/general/services/general.service';
import type { UpdateBannerParams } from '@/features/general/services/general.service';
import { SERVER_URL } from '@/api/server-url';


// ─── Helper de URL de imagen ──────────────────────────────────────────────────
/**
 * Convierte el valor de `imageUrl` devuelto por el backend en una URL
 * navegable por el navegador.
 * 
 * Ahora el backend devuelve la ruta relativa completa:
 * ej: "/uploads/banners/ca5bcc12-11e1-4075-8681-907951860273.webp"
 */
const resolveImageUrl = (imageUrl: string | null): string | null => {
    if (!imageUrl) return null;

    // Si ya es una URL absoluta (ej. CDN), la devolvemos tal cual
    if (imageUrl.startsWith('http')) return imageUrl;

    // Concatenamos directamente: http://host:port + /uploads/banners/foto.webp
    return `${SERVER_URL}${imageUrl}`;
};

// ─── Constantes de valores por defecto ────────────────────────────────────────

/**
 * Texto del banner mostrado mientras no hay dato del backend
 * o cuando el servidor devuelve 404 (banner aún no configurado).
 */
export const DEFAULT_BANNER_TEXT = 'Joyería KOB';

/** Subtítulo por defecto del banner. */
export const DEFAULT_BANNER_SUBTITLE =
    'Piezas de oro, diseño personalizado y servicios de taller para celebrar lo que merece permanecer.';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Estado del store del banner hero. */
interface HeroBannerState {
    // ── Datos del banner ──────────────────────────────────────────────────────

    /** Título del banner sincronizado con el backend. */
    bannerText: string;
    /** Subtítulo del banner sincronizado con el backend. */
    bannerSubtitle: string;
    /**
     * URL pública de la imagen del banner devuelta por el servidor.
     * `null` cuando no hay imagen configurada → el carrusel usa la imagen local.
     */
    bannerImageUrl: string | null;

    // ── Estado de carga (fetch) ───────────────────────────────────────────────

    /** `true` mientras se ejecuta la petición GET /api/banner. */
    isFetching: boolean;
    /**
     * Mensaje de error de la última llamada a `fetchBanner`.
     * `null` si no hay error o si la carga fue exitosa.
     */
    fetchError: string | null;

    // ── Estado de guardado (save) ─────────────────────────────────────────────

    /** `true` mientras se ejecuta la petición PUT /api/banner. */
    isSaving: boolean;
    /**
     * Mensaje de error de la última llamada a `saveBanner`.
     * `null` si no hay error o si el guardado fue exitoso.
     */
    saveError: string | null;

    // ── Acciones ──────────────────────────────────────────────────────────────

    /**
     * Obtiene el banner desde `GET /api/banner` y actualiza el estado.
     *
     * - Si el backend responde 404, aplica los valores por defecto sin
     *   exponer error (el banner simplemente aún no fue configurado).
     * - Cualquier otro error se expone en `fetchError`.
     * - Llámala al montar `HeroCarousel` con un `useEffect`.
     */
    fetchBanner: () => Promise<void>;

    /**
     * Guarda los cambios del banner via `PUT /api/banner` y actualiza el estado.
     *
     * @param params - Título, subtítulo e imagen del banner (ver `UpdateBannerParams`).
     * @returns `true` si la operación fue exitosa, `false` si ocurrió un error.
     */
    saveBanner: (params: UpdateBannerParams) => Promise<boolean>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * Store global del banner hero principal.
 * No persiste en localStorage — los datos vienen siempre del backend.
 */
export const useHeroBannerStore = create<HeroBannerState>()((set) => ({
    // ── Estado inicial ──────────────────────────────────────────────────────────
    bannerText: DEFAULT_BANNER_TEXT,
    bannerSubtitle: DEFAULT_BANNER_SUBTITLE,
    bannerImageUrl: null,

    isFetching: false,
    fetchError: null,

    isSaving: false,
    saveError: null,

    // ── fetchBanner ─────────────────────────────────────────────────────────────
    fetchBanner: async () => {
        set({ isFetching: true, fetchError: null });

        try {
            const banner = await GeneralService.getBanner();

            set({
                bannerText: banner.title || DEFAULT_BANNER_TEXT,
                bannerSubtitle: banner.subtitle ?? DEFAULT_BANNER_SUBTITLE,
                bannerImageUrl: resolveImageUrl(banner.imageUrl),
                isFetching: false,
            });
        } catch (error: unknown) {
            // 404 → el banner aún no fue configurado por el admin.
            // Aplicamos valores por defecto sin mostrar error al usuario final.
            const status = (error as { response?: { status?: number } })?.response?.status;

            if (status === 404) {
                set({
                    bannerText: DEFAULT_BANNER_TEXT,
                    bannerSubtitle: DEFAULT_BANNER_SUBTITLE,
                    bannerImageUrl: null,
                    isFetching: false,
                    fetchError: null,
                });
                return;
            }

            set({
                isFetching: false,
                fetchError: 'No se pudo cargar el banner. Verifica tu conexión.',
            });
        }
    },

    // ── saveBanner ──────────────────────────────────────────────────────────────
    saveBanner: async (params) => {
        set({ isSaving: true, saveError: null });

        try {
            const updated = await GeneralService.updateBanner(params);

            set({
                bannerText: updated.title || DEFAULT_BANNER_TEXT,
                bannerSubtitle: updated.subtitle ?? DEFAULT_BANNER_SUBTITLE,
                bannerImageUrl: resolveImageUrl(updated.imageUrl),
                isSaving: false,
            });

            return true;
        } catch {
            set({
                isSaving: false,
                saveError: 'No se pudieron guardar los cambios. Intenta de nuevo.',
            });
            return false;
        }
    },
}));