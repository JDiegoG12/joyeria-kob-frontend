/**
 * @file general.service.ts
 * @description Servicio HTTP para el módulo de configuración general
 * de Joyería KOB.
 *
 * Centraliza todas las llamadas al backend relacionadas con la configuración
 * global del sistema. Este servicio reemplaza y absorbe a
 * `features/catalog/services/gold-price.service.ts`, que debe eliminarse
 * tras mover esta feature.
 *
 * ## Endpoints cubiertos
 * - `GET  /system/gold-price`   → Consultar el precio actual del oro (público)
 * - `PUT  /admin/gold-price`    → Actualizar el precio del oro (requiere ADMIN)
 *
 * ## Uso
 * ```typescript
 * import { GeneralService } from '@/features/general/services/general.service';
 *
 * // Obtener precio actual
 * const { goldPricePerGram, lastUpdate } = await GeneralService.getGoldPrice();
 *
 * // Actualizar precio
 * const result = await GeneralService.updateGoldPrice(385000);
 * ```
 *
 * @see {@link useGoldPriceStore} — Store que consume `getGoldPrice`.
 */
import { apiClient } from '@/api/api-client';
import type {
    GoldPriceResponse,
    UpdateGoldPriceResponse,
} from '@/features/general/types/general.types';

/**
 * Servicio de configuración general del sistema.
 * Todas las funciones son estáticas — no requieren instanciar la clase.
 */
export class GeneralService {
    /**
   * Obtiene el precio actual del oro por gramo desde el backend.
   * Este endpoint es público y no requiere autenticación.
   *
   * @returns Los datos del precio actual y la fecha de última actualización.
   * @throws Error de red o de servidor si la petición falla.
   *
   * @example
   * ```typescript
   * const { goldPricePerGram } = await GeneralService.getGoldPrice();
   * const estimatedPrice = baseWeight * goldPricePerGram + additionalValue;
   * ```
   */
    static async getGoldPrice(): Promise<GoldPriceResponse> {
        const response = await apiClient.get('/system/gold-price');
        // El backend devuelve { success: true, data: { goldPricePerGram, lastUpdate }, message }
        // Accedemos a response.data.data para retornar el objeto interno que define GoldPriceResponse
        return response.data.data;
    }

    /**
   * Actualiza el precio del oro por gramo en el sistema.
   * Requiere que el usuario tenga rol ADMIN — el token JWT se adjunta
   * automáticamente por el interceptor de `apiClient`.
   *
   * @param goldPricePerGram - Nuevo precio del oro en COP. Debe ser positivo.
   * @returns La respuesta del servidor con los datos actualizados.
   * @throws Error de validación (400), autorización (401/403) o servidor (500).
   *
   * @example
   * ```typescript
   * const result = await GeneralService.updateGoldPrice(385000);
   * if (result.success) {
   *   showToast('success', result.message);
   * }
   * ```
   */
    static async updateGoldPrice(
        goldPricePerGram: number,
    ): Promise<UpdateGoldPriceResponse> {
        const response = await apiClient.put(
            '/admin/gold-price',
            { goldPricePerGram },
        );
        // updateGoldPrice devuelve UpdateGoldPriceResponse, que SÍ tiene el wrapper, así que retornamos todo el body.
        return response.data;
    }
}