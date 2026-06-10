/**
 * @file breadcrumb.tsx
 * @description Breadcrumb (ruta de navegación) reutilizable de Joyería KOB.
 *
 * Indica la ubicación actual dentro del sitio y ofrece el camino de vuelta
 * (típicamente al inicio). Replica la estética editorial usada en el catálogo:
 * tipografía `font-ui` en `text-xs`, uppercase, `tracking-widest`; los enlaces
 * pasan de `--text-secondary` a `--text-accent` y se subrayan en hover, y el
 * ítem actual va en `--text-accent` semibold con `aria-current="page"`.
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[{ label: 'Inicio', to: '/' }, { label: 'Favoritos' }]}
 * />
 * ```
 */

import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Un eslabón de la ruta. Sin `to` se considera la página actual (no navegable). */
export interface Crumb {
  /** Texto visible del eslabón. */
  label: string;
  /** Destino del enlace. Si se omite, el eslabón es la ubicación actual. */
  to?: string;
}

interface BreadcrumbProps {
  /**
   * Eslabones en orden. El último suele ser la página actual (sin `to`).
   * Ej: `[{ label: 'Inicio', to: '/' }, { label: 'Favoritos' }]`.
   */
  items: Crumb[];
  /** Clases extra para el contenedor (p. ej. espaciado: `"mb-5"`). */
  className?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Breadcrumb accesible con entrada suave. Renderiza cada eslabón con `to` como
 * enlace navegable y el último (sin `to`) como ubicación actual.
 */
export const Breadcrumb = ({ items, className = '' }: BreadcrumbProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.nav
      aria-label="Ruta de navegación"
      initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      {items.map((crumb, i) => {
        const isLast = i === items.length - 1;

        return (
          <span key={`${crumb.label}-${i}`} className="flex items-center gap-2">
            {crumb.to && !isLast ? (
              <BreadcrumbLink label={crumb.label} to={crumb.to} />
            ) : (
              <span
                aria-current={isLast ? 'page' : undefined}
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-semibold)',
                  letterSpacing: 'var(--tracking-widest)',
                  textTransform: 'uppercase',
                  color: 'var(--text-accent)',
                }}
              >
                {crumb.label}
              </span>
            )}

            {!isLast && (
              <ChevronRight
                size={13}
                strokeWidth={1.8}
                aria-hidden="true"
                style={{ color: 'var(--text-muted)', flexShrink: 0 }}
              />
            )}
          </span>
        );
      })}
    </motion.nav>
  );
};

// ─── Enlace navegable del breadcrumb ──────────────────────────────────────────

/**
 * Eslabón navegable. El cambio de color en hover se hace manipulando el estilo
 * del nodo (mismo patrón que el catálogo) para no depender de utilidades que
 * resuelvan tokens CSS como color de Tailwind.
 */
const BreadcrumbLink = ({ label, to }: { label: string; to: string }) => (
  <Link
    to={to}
    className="rounded-sm transition-colors duration-200 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    style={{
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--font-medium)',
      letterSpacing: 'var(--tracking-widest)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = 'var(--text-accent)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = 'var(--text-secondary)';
    }}
  >
    {label}
  </Link>
);
