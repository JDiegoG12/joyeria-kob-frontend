/**
 * @file category-card.tsx
 * @description Tarjeta de categoría para el grid de la vista de gestión.
 *
 * Muestra:
 * - Nombre de la categoría
 * - Extracto de la descripción (truncado a 2 líneas)
 * - Cantidad de subcategorías directas
 *
 * Interacción:
 * Al hacer clic o presionar Enter/Espacio, abre el Drawer en modo detalle
 * mediante `openView` del store. Incluye feedback visual premium en hover
 * (escala sutil, sombra dinámica y borde de acento) sin alterar el cursor
 * nativo del sistema.
 *
 * Uso:
 * ```tsx
 * <CategoryCard category={cat} index={0} />
 * ```
 */

import { motion } from 'framer-motion';
import { ChevronRight, Layers } from 'lucide-react';
import { useCategoryStore } from '@/store/category.store';
import type { Category } from '@/features/categories/types/category.types';

// ─── Props ──────────────────────────────────────────────────────────────────
interface CategoryCardProps {
  /** Datos de la categoría a renderizar. */
  category: Category;
  /** Índice en el grid — usado para el delay escalonado de animación. */
  index: number;
}

// ─── Componente ─────────────────────────────────────────────────────────────
/**
 * Tarjeta interactiva para el grid de gestión de categorías.
 * Animada con entrada escalonada y micro-interacciones en hover/pinch.
 * Optimizada para dispositivos touch y desktop.
 */
export const CategoryCard = ({ category, index }: CategoryCardProps) => {
  const { openView } = useCategoryStore();
  const childCount = category.children.length;
  const hasDescription = Boolean(category.description?.trim());

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.06 }}
      onClick={() => openView(category)}
      className="group relative flex cursor-pointer flex-col gap-4 rounded-2xl p-5 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = 'var(--shadow-md)';
        el.style.borderColor = 'var(--border-accent)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = 'var(--shadow-sm)';
        el.style.borderColor = 'var(--border-color)';
      }}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalles de ${category.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openView(category);
        }
      }}
    >
      {/* ── Cabecera: nombre + flecha ────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <h3
          className="leading-tight"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-primary)',
            letterSpacing: 'var(--tracking-tight)',
          }}
        >
          {category.name}
        </h3>
        <ChevronRight
          size={16}
          className="flex-shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ color: 'var(--accent)', marginTop: '2px' }}
        />
      </div>

      {/* ── Descripción (truncada) ───────────────────────────────────────────── */}
      <p
        className="line-clamp-2 flex-1"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: hasDescription ? 'var(--text-secondary)' : 'var(--text-muted)',
          lineHeight: 'var(--leading-relaxed)',
          fontStyle: hasDescription ? 'normal' : 'italic',
        }}
      >
        {hasDescription ? category.description : 'Sin descripción registrada.'}
      </p>

      {/* ── Footer: contador de subcategorías ────────────────────────────────── */}
      <div
        className="flex items-center gap-2 pt-1"
        style={{ borderTop: '1px solid var(--border-color)' }}
      >
        <Layers size={13} style={{ color: 'var(--text-muted)' }} />
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}
        >
          {childCount === 0
            ? 'Sin subcategorías'
            : childCount === 1
              ? '1 subcategoría'
              : `${childCount} subcategorías`}
        </span>
      </div>
    </motion.article>
  );
};
