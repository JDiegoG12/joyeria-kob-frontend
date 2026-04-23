/**
 * @file general.types.ts
 * @description Tipos compartidos del módulo de configuración general
 * de Joyería KOB.
 *
 * Este módulo agrupa configuraciones globales del sistema que no pertenecen
 * a un módulo funcional específico (joyas, clientes, etc.) pero que afectan
 * el comportamiento de toda la aplicación.
 *
 * ## Configuraciones actuales
 * - Precio del oro por gramo (COP)
 *
 * ## Configuraciones futuras previstas
 * - Información de la tienda (nombre, dirección, horario)
 * - Parámetros de envío y zonas de entrega
 * - Configuración de impuestos
 */

// ─── Precio del oro ───────────────────────────────────────────────────────────

/**
 * Respuesta del backend al consultar el precio actual del oro.
 * Endpoint: `GET /api/system/gold-price`
 */
export interface GoldPriceResponse {
    /** Precio del oro por gramo en COP. */
    goldPricePerGram: number;
    /** Fecha ISO de la última actualización del precio en el sistema. */
    lastUpdate: string;

}

/**
 * Cuerpo de la petición para actualizar el precio del oro.
 * Endpoint: `PUT /api/admin/gold-price`
 */
export interface UpdateGoldPriceRequest {
    /** Nuevo precio del oro por gramo en COP. Debe ser un número positivo. */
    goldPricePerGram: number;
}

/**
 * Respuesta del backend tras actualizar el precio del oro exitosamente.
 */
export interface UpdateGoldPriceResponse {
    /** Indica si la operación fue exitosa. */
    success: boolean;
    /** Datos actualizados del precio del oro. */
    data: GoldPriceResponse;
    /** Mensaje legible de confirmación. */
    message: string;
}