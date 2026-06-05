/**
 * @file metrics.types.ts
 * @description Tipos TypeScript para el módulo de métricas de Joyería KOB.
 */

// ─── Precio histórico del oro ────────────────────────────────────────────────

/**
 * Rangos soportados por el backend para consultar el histórico del precio
 * del oro.
 */
export type GoldPriceHistoryRange = '1M' | '3M' | '6M' | '1A';

/**
 * Punto individual del histórico del precio del oro.
 */
export interface GoldPricePoint {
    /** Fecha ISO asociada al precio registrado. */
    date: string;
    /** Precio del oro registrado para la fecha. */
    price: number;
}

/**
 * Punto individual tal como lo devuelve el backend.
 */
export interface GoldPriceHistoryApiPoint {
    /** ID del registro histórico. */
    id: number;
    /** Precio del oro por gramo registrado en el backend. */
    goldPricePerGram: number;
    /** Fecha ISO asociada al registro. */
    date: string;
}

/** Alias semántico para respuestas del histórico del precio del oro. */
export type GoldPriceHistoryPoint = GoldPricePoint;

/**
 * Respuesta estándar del backend para la consulta del histórico.
 * Endpoint: `GET /system/gold-price/history`
 */
export interface GoldPriceHistoryResponse {
    /** Indica si la operación fue exitosa. */
    success: true;
    /** Serie temporal de precios del oro con el contrato real del backend. */
    data: GoldPriceHistoryApiPoint[];
    /** Mensaje opcional enviado por el backend. */
    message?: string;
}
