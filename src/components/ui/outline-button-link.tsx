/**
 * @file outline-button-link.tsx
 * @description Enlace con estética de botón secundario/outline de Joyería KOB:
 * borde recto, texto en color de acento y relleno sutil al hover. Centraliza el
 * patrón que antes se repetía inline (botón "Ir al catálogo", "Volver al
 * catálogo", etc.) para garantizar hover, foco y feedback de press consistentes.
 *
 * - Acción primaria = "Comprar por WhatsApp" (vive en el detalle). Este botón es
 *   deliberadamente secundario: no compite visualmente con ella.
 * - Incluye `focus-visible` (anillo de foco) para navegación por teclado y un
 *   hundimiento sutil al presionar (`whileTap`), respetando `prefers-reduced-motion`.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

/** `Link` de react-router animable con framer-motion. */
const MotionLink = motion.create(Link);

type OutlineButtonSize = 'sm' | 'md';

interface OutlineButtonLinkProps {
  /** Ruta destino. */
  to: string;
  /** Contenido del botón (texto y, opcionalmente, un icono SVG). */
  children: ReactNode;
  /**
   * Tamaño visual.
   * - `sm`: compacto y en mayúsculas (acciones de cabecera).
   * - `md`: más holgado (estados vacíos / not-found).
   */
  size?: OutlineButtonSize;
  /** Clases extra (p. ej. `w-full` en móvil). */
  className?: string;
  /** Etiqueta accesible si el contenido no es suficientemente descriptivo. */
  ariaLabel?: string;
}

/** Paddings y tipografía por tamaño. */
const SIZE_STYLES: Record<
  OutlineButtonSize,
  { className: string; fontSize: string; uppercase: boolean; tracking: string }
> = {
  sm: {
    className: 'px-5 py-2.5',
    fontSize: 'var(--text-xs)',
    uppercase: true,
    tracking: 'var(--tracking-wide)',
  },
  md: {
    className: 'px-6 py-3',
    fontSize: 'var(--text-sm)',
    uppercase: false,
    tracking: 'normal',
  },
};

/**
 * Enlace estilizado como botón outline secundario, con foco visible y feedback
 * de press. Usa los tokens de marca; idéntico en light y dark mode.
 */
export const OutlineButtonLink = ({
  to,
  children,
  size = 'sm',
  className = '',
  ariaLabel,
}: OutlineButtonLinkProps) => {
  const shouldReduceMotion = useReducedMotion();
  const s = SIZE_STYLES[size];

  return (
    <MotionLink
      to={to}
      aria-label={ariaLabel}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`inline-flex items-center justify-center gap-2 border transition-colors duration-200 hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${s.className} ${className}`}
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: s.fontSize,
        fontWeight: 'var(--font-semibold)',
        letterSpacing: s.tracking,
        textTransform: s.uppercase ? 'uppercase' : 'none',
        color: 'var(--text-accent)',
        borderColor: 'var(--border-strong)',
      }}
    >
      {children}
    </MotionLink>
  );
};
