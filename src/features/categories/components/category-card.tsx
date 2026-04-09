/**
 * @file category-card.tsx
 * @description Tarjeta de categoría para el grid de la vista de gestión.
 *
 * Muestra:
 * - Nombre de la categoría
 * - Extracto de la descripción (truncado a 2 líneas)
 * - Cantidad de subcategorías directas
 *
 * Al hacer clic llama a `openView` del store para abrir el Drawer.
 *
 * ## Uso
 * ```tsx
 * <CategoryCard category={cat} index={0} />
 * ```
 */

import { motion } from 'framer-motion';
import { ChevronRight, Layers } from 'lucide-react';
import { useCategoryStore } from '@/store/category.store';
import type { Category } from '@/features/categories/types/category.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CategoryCardProps {
  category: Category;
  /** Índice en el grid — usado para el delay escalonado de animación. */
  index: number;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Tarjeta de categoría para el grid de gestión.
 * Animada con Framer Motion con entrada escalonada según su índice.
 */
export const CategoryCard = ({ category, index }: CategoryCardProps) => {
  const { openView } = useCategoryStore();

  const childCount = category.children.length;
  const hasDescription = Boolean(category.description?.trim());

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: 'easeOut',
        delay: index * 0.06,
      }}
      onClick={() => openView(category)}
      className="group relative flex cursor-pointer flex-col gap-4 rounded-2xl p-5 transition-all duration-300"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
        (e.currentTarget as HTMLElement).style.borderColor =
          'var(--border-accent)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
        (e.currentTarget as HTMLElement).style.borderColor =
          'var(--border-color)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalles de ${category.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') openView(category);
      }}
    >
      {/* ── Cabecera: nombre + flecha ────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
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

        {/* Flecha — visible en hover */}
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

      {/* ── Footer: contador de subcategorías ───────────────────────────────── */}
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
