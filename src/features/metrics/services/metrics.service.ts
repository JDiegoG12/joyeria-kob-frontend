/**
 * @file metrics.service.ts
 * @description Servicio HTTP para el módulo de métricas de Joyería KOB.
 *
 * ## Endpoints cubiertos
 * - `GET /system/gold-price/history` → Histórico del precio del oro por rango.
 */

import { apiClient } from '@/api/api-client';
import type {
    GoldPriceHistoryPoint,
    GoldPriceHistoryRange,
    GoldPriceHistoryResponse,
    GoldPricePoint,
} from '@/features/metrics/types/metrics.types';

const GOLD_PRICE_HISTORY_ENDPOINT = '/system/gold-price/history';

const RANGE_MONTHS: Record<GoldPriceHistoryRange, number> = {
    '1M': 1,
    '3M': 3,
    '6M': 6,
    '1A': 12,
};

/**
 * Convierte el contrato del backend al contrato usado por la gráfica.
 *
 * @param point - Registro histórico retornado por el backend.
 * @returns Punto normalizado con `date` y `price`.
 */
function mapGoldPricePoint(
    point: GoldPriceHistoryResponse['data'][number],
): GoldPricePoint {
    return {
        date: point.date,
        price: point.goldPricePerGram,
    };
}

/**
 * Filtra puntos del histórico a partir del rango seleccionado.
 * El backend retorna todo el historial, por eso el rango se aplica aquí.
 *
 * @param data - Puntos normalizados del histórico.
 * @param range - Rango seleccionado por el usuario.
 * @returns Puntos dentro del periodo solicitado.
 */
function filterHistoryByRange(
    data: GoldPricePoint[],
    range: GoldPriceHistoryRange,
): GoldPricePoint[] {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - RANGE_MONTHS[range]);

    return data.filter((point) => new Date(point.date) >= startDate);
}

/**
 * Servicio de métricas del sistema.
 */
export const MetricsService = {
    /**
     * Obtiene el histórico del precio del oro para el rango solicitado.
     *
     * @param range - Periodo de consulta soportado por el backend.
     * @returns Serie temporal con fecha ISO y precio registrado.
     * @throws Error de red o de servidor si la petición falla.
     *
     * @example
     * ```typescript
     * const history = await MetricsService.getGoldPriceHistory('3M');
     * ```
     */
    getGoldPriceHistory: async (
        range: GoldPriceHistoryRange,
    ): Promise<GoldPriceHistoryPoint[]> => {
        const response = await apiClient.get<GoldPriceHistoryResponse>(
            GOLD_PRICE_HISTORY_ENDPOINT,
        );

        const history = response.data.data
            .map(mapGoldPricePoint)
            .sort(
                (current, next) =>
                    new Date(current.date).getTime() - new Date(next.date).getTime(),
            );

        return filterHistoryByRange(history, range);
    },
};

/**
 * Obtiene el histórico del precio del oro para el rango solicitado.
 *
 * Export directo para consumidores que prefieren funciones por caso de uso
 * en lugar del objeto `MetricsService`.
 *
 * @param range - Periodo de consulta soportado por el backend.
 * @returns Serie temporal con fecha ISO y precio registrado.
 */
export const getGoldPriceHistory = (
    range: GoldPriceHistoryRange,
): Promise<GoldPriceHistoryPoint[]> => MetricsService.getGoldPriceHistory(range);
