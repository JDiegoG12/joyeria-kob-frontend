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
 */

import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavoriteAction } from '../hooks/use-favorite-action';
import type { ProductStatus } from '@/features/catalog/types/product.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface FavoriteButtonProps {
  /** UUID del producto. */
  productId: string;
  /** Estado de disponibilidad del producto. */
  productStatus: ProductStatus;
  /**
   * Variante visual:
   * - `"card"`: icono pequeño flotante sobre la tarjeta del catálogo.
   * - `"detail"`: botón más grande con etiqueta de texto en el modal de detalle.
   */
  variant?: 'card' | 'detail';
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
          width: 32,
          height: 32,
          background: isFavorite
            ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
            : 'color-mix(in srgb, var(--bg-primary) 85%, transparent)',
          border: `1px solid ${isFavorite ? 'var(--accent)' : 'var(--border-color)'}`,
          backdropFilter: 'blur(4px)',
          cursor: isUnavailable ? 'not-allowed' : 'pointer',
          opacity: isUnavailable ? 0.4 : 1,
          borderRadius: 0,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isFavorite ? 'filled' : 'empty'}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex' }}
          >
            <Heart
              size={14}
              strokeWidth={1.8}
              fill={isFavorite ? 'var(--accent)' : 'none'}
              style={{
                color: isFavorite ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            />
          </motion.span>
        </AnimatePresence>
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
        backgroundColor: isFavorite
          ? 'color-mix(in srgb, var(--accent) 10%, transparent)'
          : 'transparent',
        borderColor: isFavorite ? 'var(--accent)' : 'var(--border-strong)',
        color: isFavorite ? 'var(--text-accent)' : 'var(--text-secondary)',
        cursor: isUnavailable ? 'not-allowed' : 'pointer',
        opacity: isUnavailable ? 0.5 : 1,
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isFavorite ? 'filled' : 'empty'}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex' }}
        >
          <Heart
            size={16}
            strokeWidth={1.8}
            fill={isFavorite ? 'var(--accent)' : 'none'}
            style={{ color: isFavorite ? 'var(--accent)' : 'currentColor' }}
          />
        </motion.span>
      </AnimatePresence>
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
