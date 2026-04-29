/**
 * @file hero-banner.store.ts
 * @description Store de Zustand para gestionar la configuración del banner
 * hero principal de la página de inicio de Joyería KOB.
 *
 * ## Responsabilidades
 * - Persistir la configuración del banner (imagen y texto) en `localStorage`
 *   mientras no exista un endpoint de backend dedicado.
 * - Exponer los datos del banner al carrusel de la home page.
 * - Sincronizarse con las actualizaciones realizadas desde el panel admin.
 *
 * ## Estructura del banner principal
 * El slide 0 del carrusel siempre es el banner principal configurado aquí.
 * Los slides siguientes son imágenes promocionales con fuente distinta.
 *
 * ## Uso
 * ```tsx
 * import { useHeroBannerStore } from '@/store/hero-banner.store';
 *
 * const { bannerText, bannerImageUrl, setBannerConfig } = useHeroBannerStore();
 * ```
 *
 * @note Este store usa localStorage como almacenamiento temporal.
 * Cuando el backend exponga el endpoint correspondiente, reemplazar la
 * lógica de persistencia local por llamadas a `GeneralService`.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Clave usada en localStorage para persistir el estado del banner. */
const STORAGE_KEY = 'kob_hero_banner_config';

/** Texto del banner por defecto (el que muestra la home antes de cualquier config). */
export const DEFAULT_BANNER_TEXT = 'Joyería KOB';

/** Subtítulo del banner por defecto. */
export const DEFAULT_BANNER_SUBTITLE =
    'Piezas de oro, diseño personalizado y servicios de taller para celebrar lo que merece permanecer.';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/**
 * Configuración completa del banner hero principal.
 */
export interface HeroBannerConfig {
    /**
     * Título principal mostrado sobre la imagen del banner.
     * Se renderiza con `font-display` en tamaño grande.
     */
    bannerText: string;

    /**
     * Subtítulo descriptivo debajo del título principal.
     */
    bannerSubtitle: string;

    /**
     * URL o base64 de la imagen de fondo del banner principal.
     * - Si es `null`, se usa la imagen estática de `src/assets/HERO_IMAGE.jpg`.
     * - Si es base64 (sube desde admin), se almacena directamente en localStorage.
     * - Si es URL externa, se carga directamente sin conversión.
     */
    bannerImageUrl: string | null;
}

/**
 * Forma completa del estado del store, incluyendo acciones.
 */
interface HeroBannerState extends HeroBannerConfig {
    /**
     * Actualiza la configuración completa del banner principal.
     * Persiste automáticamente en localStorage via `zustand/persist`.
     *
     * @param config - Nuevos valores de configuración (parciales o completos).
     */
    setBannerConfig: (config: Partial<HeroBannerConfig>) => void;

    /**
     * Restaura la configuración del banner a los valores por defecto.
     * Elimina la imagen personalizada y restablece los textos originales.
     */
    resetBanner: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * Store global del banner hero principal.
 * Persiste en `localStorage` con la clave `kob_hero_banner_config`.
 *
 * @remarks
 * Cuando el backend tenga el endpoint `/admin/hero-banner`, reemplazar el
 * middleware `persist` por llamadas HTTP en `setBannerConfig` y `resetBanner`,
 * siguiendo el patrón de `useGoldPriceStore`.
 */
export const useHeroBannerStore = create<HeroBannerState>()(
    persist(
        (set) => ({
            // ── Estado inicial ──────────────────────────────────────────────────────
            bannerText: DEFAULT_BANNER_TEXT,
            bannerSubtitle: DEFAULT_BANNER_SUBTITLE,
            bannerImageUrl: null,

            // ── setBannerConfig ─────────────────────────────────────────────────────
            setBannerConfig: (config) => {
                set((prev) => ({ ...prev, ...config }));
            },

            // ── resetBanner ─────────────────────────────────────────────────────────
            resetBanner: () => {
                set({
                    bannerText: DEFAULT_BANNER_TEXT,
                    bannerSubtitle: DEFAULT_BANNER_SUBTITLE,
                    bannerImageUrl: null,
                });
            },
        }),
        {
            name: STORAGE_KEY,
        },
    ),
);