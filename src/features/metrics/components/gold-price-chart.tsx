/**
 * @file gold-price-chart.tsx
 * @description Gráfica de línea para visualizar el histórico del precio del oro.
 */

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import {
    Area,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import type { GoldPricePoint } from '@/features/metrics/types/metrics.types';

interface GoldPriceChartProps {
    data: GoldPricePoint[];
}

interface AxisTickProps {
    x?: number | string;
    y?: number | string;
    payload?: {
        value: string;
    };
}

interface GoldPriceTooltipProps extends TooltipContentProps {
    repeatedDayKeys: Set<string>;
}

const axisDateFormatter = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
});

const tooltipDateFormatter = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

const copNumberFormatter = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
});

/**
 * Detecta si el viewport está en tamaño móvil para ajustar márgenes del chart.
 *
 * @returns `true` cuando el viewport es menor al breakpoint `sm`.
 */
function useIsMobileChart(): boolean {
    const [isMobile, setIsMobile] = useState(() =>
        window.matchMedia('(max-width: 639px)').matches,
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 639px)');
        const handleChange = (event: MediaQueryListEvent) => {
            setIsMobile(event.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return isMobile;
}

/**
 * Obtiene una llave local de día para detectar fechas repetidas.
 *
 * @param value - Fecha ISO enviada por el backend.
 * @returns Día localizado sin hora.
 */
function getLocalDayKey(value: string): string {
    return new Date(value).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

/**
 * Detecta los días que tienen más de un registro.
 *
 * @param data - Serie temporal recibida por el chart.
 * @returns Set con llaves locales de días repetidos.
 */
function getRepeatedDayKeys(data: GoldPricePoint[]): Set<string> {
    const counts = new Map<string, number>();

    data.forEach((point) => {
        const key = getLocalDayKey(point.date);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return new Set(
        Array.from(counts.entries())
            .filter(([, count]) => count > 1)
            .map(([key]) => key),
    );
}

/**
 * Formatea fechas ISO para el eje X y el tooltip.
 *
 * @param value - Fecha ISO enviada por el backend.
 * @param repeatedDayKeys - Días que requieren mostrar hora para desambiguar.
 * @param includeYear - Si `true`, incluye año en la fecha.
 * @returns Fecha localizada con hora cuando el día tiene varios registros.
 */
function formatDateTime(
    value: string,
    repeatedDayKeys: Set<string>,
    includeYear = false,
): string {
    const date = new Date(value);
    const dateText = includeYear
        ? tooltipDateFormatter.format(date)
        : axisDateFormatter.format(date);

    if (!repeatedDayKeys.has(getLocalDayKey(value))) {
        return dateText;
    }

    return `${dateText}, ${timeFormatter.format(date)}`;
}

/**
 * Construye las líneas visibles del tick del eje X.
 *
 * @param value - Fecha ISO enviada por el backend.
 * @param repeatedDayKeys - Días que requieren mostrar hora.
 * @returns Una o dos líneas de texto para el eje X.
 */
function getAxisDateLines(
    value: string,
    repeatedDayKeys: Set<string>,
): string[] {
    const date = new Date(value);
    const dateText = axisDateFormatter.format(date);

    if (!repeatedDayKeys.has(getLocalDayKey(value))) {
        return [dateText];
    }

    return [dateText, timeFormatter.format(date)];
}

/**
 * Formatea valores monetarios en pesos colombianos sin decimales.
 *
 * @param value - Valor numérico en COP.
 * @returns Valor localizado como moneda COP.
 */
function formatCOP(value: number): string {
    return `$ ${copNumberFormatter.format(value)} COP`;
}

/**
 * Formatea valores numéricos para el eje Y sin unidad repetida.
 *
 * @param value - Valor numérico en COP.
 * @returns Número localizado sin decimales.
 */
function formatAxisValue(value: number): string {
    return compactNumberFormatter.format(value);
}

/**
 * Calcula un dominio del eje Y con aire visual alrededor de la serie.
 *
 * @param data - Serie temporal recibida por el chart.
 * @returns Límite mínimo y máximo para el eje Y.
 */
function getPriceDomain(data: GoldPricePoint[]): [number, number] {
    const prices = data
        .map((point) => point.price)
        .filter((price): price is number => typeof price === 'number');

    if (prices.length === 0) return [0, 1];

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const span = max - min;
    const padding = span > 0 ? span * 0.18 : Math.max(max * 0.025, 1);

    return [
        Math.max(0, Math.floor(min - padding)),
        Math.ceil(max + padding),
    ];
}

/**
 * Calcula el espacio horizontal requerido para el eje Y.
 *
 * @param domain - Dominio visible del eje Y.
 * @param data - Serie temporal usada por la gráfica.
 * @param isMobile - Si el viewport está en tamaño móvil.
 * @returns Ancho del eje Y y margen izquierdo para el chart.
 */
function getYAxisLayout(
    domain: [number, number],
    data: GoldPricePoint[],
    isMobile: boolean,
): { yAxisWidth: number; marginLeft: number } {
    const labels = [
        ...domain.map(formatAxisValue),
        ...data.map((point) => formatAxisValue(point.price)),
    ];
    const maxLength = Math.max(...labels.map((label) => label.length));
    const estimatedLabelWidth = maxLength * (isMobile ? 6 : 7);
    const yAxisWidth = Math.min(
        isMobile ? 78 : 92,
        Math.max(isMobile ? 62 : 74, estimatedLabelWidth + 18),
    );

    return {
        yAxisWidth,
        marginLeft: isMobile ? 12 : 32,
    };
}

/**
 * Calcula la variación porcentual entre el último y penúltimo punto.
 *
 * @param data - Serie temporal recibida por el chart.
 * @returns Variación porcentual o `null` si no se puede calcular.
 */
function getPriceVariation(data: GoldPricePoint[]): number | null {
    const current = data.at(-1)?.price;
    const previous = data.at(-2)?.price;

    if (
        typeof current !== 'number' ||
        typeof previous !== 'number' ||
        previous === 0
    ) {
        return null;
    }

    return ((current - previous) / previous) * 100;
}

/**
 * Formatea una variación porcentual con dirección y contexto.
 *
 * @param value - Variación porcentual.
 * @returns Texto listo para mostrar al usuario.
 */
function formatVariation(value: number): string {
    return `${Math.abs(value).toFixed(1)}% vs registro anterior`;
}

/**
 * Tick personalizado del eje X para mostrar fecha y hora en dos líneas.
 */
function AxisDateTick({
    x = 0,
    y = 0,
    payload,
    repeatedDayKeys,
}: AxisTickProps & { repeatedDayKeys: Set<string> }) {
    if (!payload?.value) return null;

    const lines = getAxisDateLines(payload.value, repeatedDayKeys);
    const tickX = typeof x === 'number' ? x : Number(x);
    const tickY = typeof y === 'number' ? y : Number(y);
    const verticalOffset = 12;

    return (
        <g transform={`translate(${tickX},${tickY + verticalOffset})`}>
            {lines.map((line, index) => (
                <text
                    key={`${line}-${index}`}
                    x={0}
                    y={index * 13}
                    textAnchor="middle"
                    style={{
                        fill: 'var(--text-muted)',
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--text-xs)',
                    }}
                >
                    {line}
                </text>
            ))}
        </g>
    );
}

/**
 * Tooltip personalizado para el histórico del precio del oro.
 *
 * @param props - Estado y payload entregados por Recharts.
 * @returns Contenido del tooltip o `null` cuando no hay punto activo.
 */
function GoldPriceTooltip({
    active,
    payload,
    label,
    repeatedDayKeys,
}: GoldPriceTooltipProps) {
    const price = payload?.[0]?.value;

    if (!active || typeof price !== 'number' || typeof label !== 'string') {
        return null;
    }

    return (
        <div
            className="rounded-[var(--radius-lg)] border px-4 py-3 shadow-[var(--shadow-lg)]"
            style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                boxShadow: 'var(--shadow-lg)',
            }}
        >
            <p
                className="m-0"
                style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-medium)',
                    color: 'var(--text-muted)',
                    textTransform: 'capitalize',
                }}
            >
                {formatDateTime(label, repeatedDayKeys, true)}
            </p>
            <p
                className="m-0 mt-1"
                style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-bold)',
                    color: 'var(--text-primary)',
                    lineHeight: 'var(--leading-tight)',
                }}
            >
                {formatCOP(price)}
            </p>
        </div>
    );
}

/**
 * Renderiza una gráfica responsive del histórico del precio del oro.
 *
 * @param data - Serie temporal con fechas ISO y precios en COP.
 * @returns Componente de gráfica listo para insertar en páginas o tarjetas.
 */
export function GoldPriceChart({ data }: GoldPriceChartProps) {
    const gradientId = 'gold-price-chart-gradient';
    const glowGradientId = 'gold-price-chart-glow-gradient';
    const isMobile = useIsMobileChart();
    const sortedData = useMemo(
        () =>
            [...data].sort(
                (current, next) =>
                    new Date(current.date).getTime() - new Date(next.date).getTime(),
            ),
        [data],
    );
    const repeatedDayKeys = getRepeatedDayKeys(sortedData);
    const currentPrice = sortedData.at(-1)?.price ?? 0;
    const variation = getPriceVariation(sortedData);
    const yDomain = getPriceDomain(sortedData);
    const yAxisLayout = getYAxisLayout(yDomain, sortedData, isMobile);
    const VariationIcon = variation !== null && variation >= 0
        ? ArrowUpRight
        : ArrowDownRight;

    return (
        <div className="w-full min-w-0">
            <div className="mb-5 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <p
                        className="m-0"
                        style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 'var(--font-semibold)',
                            color: 'var(--text-muted)',
                            letterSpacing: 'var(--tracking-wide)',
                            textTransform: 'uppercase',
                        }}
                    >
                        Precio actual
                    </p>
                    <p
                        className="m-0 mt-1"
                        style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'clamp(var(--text-xl), 7vw, var(--text-3xl))',
                            fontWeight: 'var(--font-bold)',
                            color: 'var(--text-primary)',
                            letterSpacing: 'var(--tracking-tight)',
                            lineHeight: 'var(--leading-tight)',
                            overflowWrap: 'break-word',
                        }}
                    >
                        {formatCOP(currentPrice)}
                    </p>
                </div>

                {variation !== null && (
                    <div
                        className="flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5"
                        style={{
                            backgroundColor: 'var(--accent-subtle)',
                            borderColor: 'var(--border-color)',
                            color:
                                variation >= 0
                                    ? 'var(--color-success)'
                                    : 'var(--color-error)',
                            fontFamily: 'var(--font-ui)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 'var(--font-semibold)',
                        }}
                    >
                        <VariationIcon size={15} aria-hidden="true" />
                        {formatVariation(variation)}
                    </div>
                )}
            </div>

            <div className="h-[clamp(17rem,42vw,24rem)] min-h-[17rem] w-full min-w-0 overflow-visible">
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    minHeight="18rem"
                    initialDimension={{ width: 0, height: 320 }}
                >
                    <LineChart
                        data={sortedData}
                        margin={{
                            top: 14,
                            right: isMobile ? 8 : 20,
                            bottom: isMobile ? 38 : 42,
                            left: yAxisLayout.marginLeft,
                        }}
                    >
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="0%"
                                    stopColor="var(--accent)"
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="58%"
                                    stopColor="var(--accent)"
                                    stopOpacity={0.1}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="var(--accent)"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                            <linearGradient
                                id={glowGradientId}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="var(--accent)"
                                    stopOpacity={0.16}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="var(--accent)"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            stroke="var(--border-color)"
                            strokeDasharray="3 6"
                            strokeOpacity={0.22}
                            vertical={false}
                        />

                        <XAxis
                            dataKey="date"
                            padding={{
                                left: isMobile ? 14 : 22,
                                right: isMobile ? 10 : 14,
                            }}
                            tick={(props) => (
                                <AxisDateTick
                                    {...props}
                                    repeatedDayKeys={repeatedDayKeys}
                                />
                            )}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                            minTickGap={30}
                            tickMargin={12}
                            height={56}
                        />

                        <YAxis
                            domain={yDomain}
                            tickFormatter={formatAxisValue}
                            tick={{
                                fill: 'var(--text-muted)',
                                fontSize: 'var(--text-xs)',
                                fontFamily: 'var(--font-ui)',
                            }}
                            axisLine={false}
                            tickLine={false}
                            tickCount={4}
                            width={yAxisLayout.yAxisWidth}
                            tickMargin={12}
                            dx={-2}
                            dy={-4}
                        />

                        <Tooltip
                            content={(props) => (
                                <GoldPriceTooltip
                                    {...props}
                                    repeatedDayKeys={repeatedDayKeys}
                                />
                            )}
                            cursor={{
                                stroke: 'var(--accent)',
                                strokeWidth: 1,
                                strokeOpacity: 0.18,
                            }}
                            offset={16}
                        />

                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke="none"
                            fill={`url(#${gradientId})`}
                            fillOpacity={1}
                            isAnimationActive={false}
                        />

                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke={`url(#${glowGradientId})`}
                            strokeWidth={8}
                            dot={false}
                            activeDot={false}
                            isAnimationActive={false}
                        />

                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke="var(--accent)"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            dot={false}
                            activeDot={{
                                r: 7,
                                fill: 'var(--accent)',
                                stroke: 'var(--bg-secondary)',
                                strokeWidth: 4,
                                filter: 'drop-shadow(0 0 8px var(--accent))',
                            }}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
