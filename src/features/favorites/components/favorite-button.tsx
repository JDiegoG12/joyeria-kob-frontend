/**
 * @file favorite-button.tsx
 * @description Botón de corazón reutilizable para marcar/desmarcar favoritos.
 *
 * Usado en:
 * - `PublicProductCard`   → variant "card" (pequeño, esquina superior derecha)
 * - `ProductDetailModal`  → variant "detail" (más grande, con label)
 *
 * Gestiona su propio estado visual y delega la lógica al hook `useFavoriteAction`.
 * Si el producto no está disponible (status !== 'AVAILABLE'), muestra el estado
 * deshabilitado con tooltip de "No disponible".
 *
 * ## Animación al marcar
 * Al pasar de no-favorito → favorito se reproduce una micro-interacción de
 * "Pop + destello radial": el corazón hace un rebote (spring) y emite un anillo
 * que se expande junto a chispas que irradian, todo en el color `--favorite`.
 * El efecto:
 * - Solo se dispara en la transición a favorito (no al quitar ni al montar).
 * - Usa exclusivamente `transform`/`opacity` (sin reflow, GPU-friendly).
 * - Dura <450ms y respeta `prefers-reduced-motion` (se omite por completo).
 */

import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useFavoriteAction } from '../hooks/use-favorite-action';
import type { ProductStatus } from '@/features/catalog/types/product.types';

// ─── Destello radial ────────────────────────────────────────────────────────────

/** Nº de chispas que irradian al marcar favorito. */
const SPARKLE_COUNT = 6;

/** Direcciones unitarias precalculadas, repartidas en círculo. */
const SPARKLES = Array.from({ length: SPARKLE_COUNT }, (_, i) => {
  const angle = (i / SPARKLE_COUNT) * Math.PI * 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
});

interface FavoriteBurstProps {
  /** Tamaño del corazón en px — escala el radio del destello. */
  size: number;
}

/**
 * Destello radial que se reproduce una sola vez al marcar favorito: un anillo
 * que se expande + chispas que irradian, ambos en `--favorite`. Está anclado al
 * centro del corazón y es `pointer-events-none` para no interferir con el click.
 */
const FavoriteBurst = ({ size }: FavoriteBurstProps) => {
  const radius = size * 1.15;
  const ring = size * 1.7;

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={{ width: 0, height: 0 }}
    >
      {/* Anillo que se expande y se desvanece */}
      <motion.span
        className="absolute rounded-full"
        style={{
          left: 0,
          top: 0,
          width: ring,
          height: ring,
          marginLeft: -ring / 2,
          marginTop: -ring / 2,
          border: '2px solid var(--favorite)',
        }}
        initial={{ scale: 0.3, opacity: 0.7 }}
        animate={{ scale: 1.6, opacity: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      />

      {/* Chispas que irradian desde el centro */}
      {SPARKLES.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: 0,
            top: 0,
            width: 3,
            height: 3,
            marginLeft: -1.5,
            marginTop: -1.5,
            backgroundColor: 'var(--favorite)',
          }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: s.x * radius, y: s.y * radius, scale: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      ))}
    </span>
  );
};

// ─── Corazón animado ────────────────────────────────────────────────────────────

interface AnimatedHeartProps {
  /** ¿Está marcado como favorito? */
  filled: boolean;
  /** Tamaño del icono en px. */
  size: number;
  /**
   * Contador que se incrementa en cada marcado para reproducir el destello.
   * Al cambiar la `key`, `FavoriteBurst` se vuelve a montar y reinicia su
   * animación. `0` significa que aún no se ha marcado en esta sesión.
   */
  burstId: number;
  /** Si el usuario prefiere movimiento reducido, se omiten pop y destello. */
  reducedMotion: boolean;
  /** Color del corazón cuando NO está marcado. */
  emptyColor: string;
}

/**
 * Corazón con micro-interacción: rebote (spring) al rellenarse + destello radial.
 * Encapsula la lógica para que las variantes `card` y `detail` la compartan.
 */
const AnimatedHeart = ({
  filled,
  size,
  burstId,
  reducedMotion,
  emptyColor,
}: AnimatedHeartProps) => (
  <span className="relative flex items-center justify-center">
    {!reducedMotion && burstId > 0 && (
      <FavoriteBurst key={burstId} size={size} />
    )}

    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={filled ? 'filled' : 'empty'}
        initial={{ scale: reducedMotion ? 1 : 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: reducedMotion ? 1 : 0.6, opacity: 0 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : filled
              ? { type: 'spring', stiffness: 520, damping: 14, mass: 0.6 }
              : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
        }
        style={{ display: 'flex' }}
      >
        <Heart
          size={size}
          strokeWidth={1.8}
          fill={filled ? 'var(--favorite)' : 'none'}
          style={{ color: filled ? 'var(--favorite)' : emptyColor }}
        />
      </motion.span>
    </AnimatePresence>
  </span>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface FavoriteButtonProps {
  /** UUID del producto. */
  productId: string;
  /** Estado de disponibilidad del producto. */
  productStatus: ProductStatus;
  /**
   * Variante visual:
   * - `"card"`: icono pequeño flotante sobre la tarjeta del catálogo.
   * - `"detail"`: botón ancho con etiqueta de texto.
   * - `"detail-icon"`: botón cuadrado de solo icono para el modal de detalle.
   *   Se estira a la altura de la fila (`aspect-square` + `items-stretch` del
   *   contenedor) para alinear con el CTA de compra sin competir en jerarquía.
   */
  variant?: 'card' | 'detail' | 'detail-icon';
  /** Clase CSS adicional para el contenedor. */
  className?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export const FavoriteButton = ({
  productId,
  productStatus,
  variant = 'card',
  className = '',
}: FavoriteButtonProps) => {
  const { toggle, isFavorite, isPending } = useFavoriteAction(productId);

  const isUnavailable = productStatus !== 'AVAILABLE';

  // ── Disparo del destello en la transición no-favorito → favorito ──────────
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [burstId, setBurstId] = useState(0);
  const prevFavorite = useRef(isFavorite);

  useEffect(() => {
    // Solo al PASAR a favorito (no al quitar ni en el montaje inicial).
    if (!prevFavorite.current && isFavorite && !prefersReducedMotion) {
      setBurstId((n) => n + 1);
    }
    prevFavorite.current = isFavorite;
  }, [isFavorite, prefersReducedMotion]);

  // ── Variant: card ────────────────────────────────────────────────────────
  if (variant === 'card') {
    return (
      <motion.button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // no abrir el modal de detalle
          void toggle();
        }}
        disabled={isUnavailable || isPending}
        aria-label={
          isUnavailable
            ? 'No disponible'
            : isFavorite
              ? 'Quitar de favoritos'
              : 'Agregar a favoritos'
        }
        whileTap={isUnavailable ? {} : { scale: 0.88 }}
        transition={{ duration: 0.15 }}
        className={`flex items-center justify-center transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${className}`}
        style={{
          position: 'relative',
          width: 32,
          height: 32,
          // Marcado: chip OPACO (mezcla sobre --bg-primary, sin transparencia)
          // para que la foto del producto nunca se filtre y el corazón rojo
          // tenga contraste garantizado sobre fotos claras u oscuras.
          background: isFavorite
            ? 'color-mix(in srgb, var(--favorite) 12%, var(--bg-primary))'
            : 'color-mix(in srgb, var(--bg-primary) 90%, transparent)',
          border: `1px solid ${isFavorite ? 'var(--favorite)' : 'var(--border-color)'}`,
          backdropFilter: 'blur(4px)',
          cursor: isUnavailable ? 'not-allowed' : 'pointer',
          opacity: isUnavailable ? 0.4 : 1,
          borderRadius: 0,
        }}
      >
        <AnimatedHeart
          filled={isFavorite}
          size={14}
          burstId={burstId}
          reducedMotion={prefersReducedMotion}
          emptyColor="var(--text-secondary)"
        />
      </motion.button>
    );
  }

  // ── Variant: detail-icon ─────────────────────────────────────────────────
  // Cuadrado de solo icono (52×52). Comparte lenguaje de borde con el CTA de
  // compra (--border-strong). El contenedor padre usa `items-stretch`, así que
  // el botón de compra se estira a esta altura → ambos quedan alineados.
  // Tooltip nativo para descubrir la acción sin etiqueta de texto.
  if (variant === 'detail-icon') {
    return (
      <motion.button
        type="button"
        onClick={() => void toggle()}
        disabled={isUnavailable || isPending}
        title={
          isUnavailable
            ? 'No disponible'
            : isFavorite
              ? 'Quitar de favoritos'
              : 'Agregar a favoritos'
        }
        aria-label={
          isUnavailable
            ? 'No disponible'
            : isFavorite
              ? 'Quitar de favoritos'
              : 'Agregar a favoritos'
        }
        whileTap={isUnavailable ? {} : { scale: 0.92 }}
        transition={{ duration: 0.15 }}
        className={`flex shrink-0 items-center justify-center border transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${className}`}
        style={{
          width: '3.25rem',
          height: '3.25rem',
          backgroundColor: isFavorite ? 'var(--favorite-subtle)' : 'transparent',
          borderColor: isFavorite ? 'var(--favorite)' : 'var(--border-strong)',
          cursor: isUnavailable ? 'not-allowed' : 'pointer',
          opacity: isUnavailable ? 0.5 : 1,
        }}
      >
        <AnimatedHeart
          filled={isFavorite}
          size={18}
          burstId={burstId}
          reducedMotion={prefersReducedMotion}
          emptyColor="var(--text-secondary)"
        />
      </motion.button>
    );
  }

  // ── Variant: detail ──────────────────────────────────────────────────────
  return (
    <motion.button
      type="button"
      onClick={() => void toggle()}
      disabled={isUnavailable || isPending}
      aria-label={
        isUnavailable
          ? 'No disponible'
          : isFavorite
            ? 'Quitar de favoritos'
            : 'Agregar a favoritos'
      }
      whileTap={isUnavailable ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`flex w-full cursor-pointer items-center justify-center gap-2 border px-5 py-2.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${className}`}
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-bold)',
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase',
        backgroundColor: isFavorite ? 'var(--favorite-subtle)' : 'transparent',
        borderColor: isFavorite ? 'var(--favorite)' : 'var(--border-strong)',
        color: isFavorite ? 'var(--favorite)' : 'var(--text-secondary)',
        cursor: isUnavailable ? 'not-allowed' : 'pointer',
        opacity: isUnavailable ? 0.5 : 1,
      }}
    >
      <AnimatedHeart
        filled={isFavorite}
        size={16}
        burstId={burstId}
        reducedMotion={prefersReducedMotion}
        emptyColor="currentColor"
      />
      <span>
        {isUnavailable
          ? 'No disponible'
          : isFavorite
            ? 'En favoritos'
            : 'Agregar a favoritos'}
      </span>
    </motion.button>
  );
};
