/**
 * @file gold-price.service.ts
 * @description Servicio para obtener el precio actual del oro por gramo
 * desde el backend de Joyería KOB.
 *
 * ## Endpoint que consume
 * - `GET /system/gold-price` → Retorna el precio por gramo y la fecha
 *   de última actualización. Este endpoint es de solo lectura y no requiere
 *   autenticación.
 *
 * ## Uso desde el store
 * ```typescript
 * import { GoldPriceService } from '@/features/catalog/services/gold-price.service';
 *
 * const { goldPricePerGram } = await GoldPriceService.getCurrent();
 * ```
 */

import { apiClient } from '@/api/api-client';

// ─── Tipos de respuesta del backend ──────────────────────────────────────────

/** Datos del precio del oro devueltos por el backend. */
export interface GoldPriceData {
    /** Precio del oro por gramo en COP. */
    goldPricePerGram: number;
    /** Fecha y hora de la última actualización del precio. */
    lastUpdate: string;
}

/** Estructura de la respuesta completa del endpoint. */
interface GoldPriceApiResponse {
    success: boolean;
    data: GoldPriceData;
    message: string;
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

/** Servicio para consultar el precio del oro por gramo configurado en el sistema. */
export const GoldPriceService = {
    /**
     * Obtiene el precio actual del oro por gramo desde el backend.
     *
     * @returns Objeto con `goldPricePerGram` (número) y `lastUpdate` (ISO string).
     * @throws Error de red o de servidor si el backend no responde.
     *
     * @example
     * ```typescript
     * const { goldPricePerGram } = await GoldPriceService.getCurrent();
     * const estimatedPrice = baseWeight * goldPricePerGram + additionalValue;
     * ```
     */
    getCurrent: async (): Promise<GoldPriceData> => {
        const response =
            await apiClient.get<GoldPriceApiResponse>('/system/gold-price');
        return response.data.data;
    },
};