/**
 * @file general.service.ts
 * @description Servicio HTTP para el módulo de configuración general
 * de Joyería KOB.
 *
 * Centraliza todas las llamadas al backend relacionadas con la configuración
 * global del sistema.
 *
 * ## Endpoints cubiertos
 * - `GET  /system/gold-price`  → Consultar el precio actual del oro (público)
 * - `PUT  /admin/gold-price`   → Actualizar el precio del oro (requiere ADMIN)
 * - `GET  /banner`             → Consultar el banner principal (público)
 * - `PUT  /banner`             → Crear o actualizar el banner (requiere ADMIN)
 * - `DELETE /banner`           → Eliminar el banner (requiere ADMIN)
 *
 * ## Uso
 * ```typescript
 * import { GeneralService } from '@/features/general/services/general.service';
 *
 * // Obtener banner
 * const banner = await GeneralService.getBanner();
 *
 * // Actualizar banner con nueva imagen y texto
 * const result = await GeneralService.updateBanner({
 *   title: 'Nueva colección',
 *   subtitle: 'Descubre las últimas piezas',
 *   imageFile: file, // File | undefined
 * });
 * ```
 *
 * @see {@link useHeroBannerStore} — Store que consume `getBanner` y `updateBanner`.
 */
import { apiClient } from '@/api/api-client';
import type {
    GoldPriceResponse,
    UpdateGoldPriceResponse,
    BannerResponse,
    GetBannerApiResponse,
    UpdateBannerApiResponse,
} from '@/features/general/types/general.types';

// ─── Tipos de petición del banner ─────────────────────────────────────────────

/**
 * Parámetros para crear o actualizar el banner principal.
 * El backend acepta `multipart/form-data` — esta interfaz describe
 * los campos que el servicio convertirá a `FormData`.
 */
export interface UpdateBannerParams {
    /** Título principal del banner. */
    title: string;
    /** Subtítulo opcional del banner. Omitir para dejar el actual. */
    subtitle?: string;
    /**
     * Archivo de imagen a subir.
     * Si se omite, el backend conserva la imagen actual.
     */
    imageFile?: File;
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

/**
 * Servicio de configuración general del sistema.
 * Todas las funciones son estáticas — no requieren instanciar la clase.
 */
export class GeneralService {
    // ── Precio del oro ──────────────────────────────────────────────────────────

    /**
     * Obtiene el precio actual del oro por gramo desde el backend.
     * Este endpoint es público y no requiere autenticación.
     *
     * @returns Los datos del precio actual y la fecha de última actualización.
     * @throws Error de red o de servidor si la petición falla.
     */
    static async getGoldPrice(): Promise<GoldPriceResponse> {
        const response = await apiClient.get('/system/gold-price');
        // El backend devuelve { success, data: { goldPricePerGram, lastUpdate }, message }
        return response.data.data;
    }

    /**
     * Actualiza el precio del oro por gramo en el sistema.
     * Requiere que el usuario tenga rol ADMIN.
     *
     * @param goldPricePerGram - Nuevo precio del oro en COP. Debe ser positivo.
     * @returns La respuesta del servidor con los datos actualizados.
     * @throws Error de validación (400), autorización (401/403) o servidor (500).
     */
    static async updateGoldPrice(
        goldPricePerGram: number,
    ): Promise<UpdateGoldPriceResponse> {
        const response = await apiClient.put('/admin/gold-price', {
            goldPricePerGram,
        });
        return response.data;
    }

    // ── Banner hero principal ───────────────────────────────────────────────────

    /**
     * Obtiene el banner principal desde el backend.
     * Este endpoint es público y no requiere autenticación.
     *
     * @returns El objeto `BannerResponse` con id, title, subtitle, imageUrl y updatedAt.
     * @throws Error 404 si no existe ningún banner configurado todavía.
     *
     * @example
     * ```typescript
     * const banner = await GeneralService.getBanner();
     * store.setBannerFromApi(banner);
     * ```
     */
    static async getBanner(): Promise<BannerResponse> {
        const response = await apiClient.get<GetBannerApiResponse>('/banner');
        return response.data.data;
    }

    /**
     * Crea o actualiza el banner principal (operación upsert).
     * Requiere rol ADMIN. El token JWT se adjunta automáticamente.
     *
     * La imagen se envía como `multipart/form-data` porque el backend
     * usa un middleware de subida de archivos (multer o similar).
     * Los campos de texto van como campos adicionales del mismo `FormData`.
     *
     * @param params - Título, subtítulo e imagen del banner.
     * @returns El objeto `BannerResponse` con los datos actualizados.
     * @throws Error de validación (400), autorización (401/403) o servidor (500).
     *
     * @example
     * ```typescript
     * const updated = await GeneralService.updateBanner({
     *   title: 'Colección verano',
     *   subtitle: 'Piezas únicas de oro 18k',
     *   imageFile: selectedFile,
     * });
     * ```
     */
    static async updateBanner(
        params: UpdateBannerParams,
    ): Promise<BannerResponse> {
        const formData = new FormData();

        formData.append('title', params.title);

        if (params.subtitle !== undefined) {
            formData.append('subtitle', params.subtitle);
        }

        // Solo adjuntar imageFile si el admin seleccionó un archivo nuevo
        if (params.imageFile) {
            formData.append('imageFile', params.imageFile);
        }

        const response = await apiClient.put<UpdateBannerApiResponse>(
            '/banner',
            formData,
            {
                headers: {
                    // Axios detecta FormData y establece el Content-Type correcto con
                    // el boundary automáticamente. Forzarlo manualmente rompería el upload.
                    'Content-Type': 'multipart/form-data',
                },
            },
        );

        return response.data.data;
    }

    /**
     * Elimina permanentemente el banner principal.
     * Requiere rol ADMIN. El token JWT se adjunta automáticamente.
     *
     * @throws Error de autorización (401/403) o 404 si no existe banner.
     */
    static async deleteBanner(): Promise<void> {
        await apiClient.delete('/banner');
    }
}