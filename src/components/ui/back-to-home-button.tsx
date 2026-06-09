/**
 * @file back-to-home-button.tsx
 * @description Control de retorno explícito al inicio para las páginas internas
 * (catálogo, favoritos, perfil).
 *
 * Nace de un problema de descubribilidad: el único camino de vuelta a la home
 * eran el logo del navbar y el enlace "Inicio" del breadcrumb, ambos affordances
 * débiles que parte de los usuarios no leen como botones. Este componente añade
 * un control claro —flecha + "VOLVER"— sin romper la estética editorial de KOB
 * (navy/minimal, esquinas rectas, tipografía `font-ui` uppercase).
 *
 * ## Decisiones de diseño
 * - **Solo desktop** (`hidden lg:inline-flex`): en móvil ya existe el menú de
 *   navegación, así que el botón sería redundante y robaría espacio vertical.
 * - **Navega a `/`** (no `history.back()`): el usuario pidió "volver al inicio",
 *   un destino predecible independientemente de cómo llegó a la página.
 * - **Convive con el breadcrumb**: se ubica a su izquierda, separado por un
 *   divisor hairline (`<BackToHomeDivider />`), reforzando la fila superior como
 *   una cabecera de navegación en lugar de duplicar la ruta.
 * - **Microinteracción**: en hover el borde y el texto suben a `--accent`/
 *   `--text-accent` y la flecha se desliza 2px a la izquierda (transform, sin
 *   layout shift). Se desactiva el desplazamiento con `prefers-reduced-motion`.
 *
 * @example
 * ```tsx
 * <div className="flex items-center gap-3">
 *   <BackToHomeButton />
 *   <BackToHomeDivider />
 *   <Breadcrumb items={[{ label: 'Inicio', to: '/' }, { label: 'Favoritos' }]} />
 * </div>
 * ```
 */

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Estilos del botón. El borde y el color (y por herencia la flecha, que usa
 * `currentColor`) se gestionan en CSS porque un `:hover` de hoja de estilos no
 * puede sobreescribir colores inline. El nudge de la flecha respeta
 * `prefers-reduced-motion`.
 */
const STYLES = `
  .kob-back-home {
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    background-color: transparent;
    transition: border-color 0.2s ease, color 0.2s ease;
  }
  .kob-back-home:hover {
    border-color: var(--accent);
    color: var(--text-accent);
  }
  .kob-back-home__arrow {
    transition: transform 0.2s ease;
  }
  .kob-back-home:hover .kob-back-home__arrow {
    transform: translateX(-2px);
  }
  @media (prefers-reduced-motion: reduce) {
    .kob-back-home:hover .kob-back-home__arrow {
      transform: none;
    }
  }
`;

interface BackToHomeButtonProps {
  /** Clases extra para el contenedor (p. ej. espaciado). */
  className?: string;
}

/**
 * Botón "Volver" al inicio — visible solo en desktop (`lg+`).
 */
export const BackToHomeButton = ({ className = '' }: BackToHomeButtonProps) => (
  <>
    <style>{STYLES}</style>
    <Link
      to="/"
      aria-label="Volver al inicio"
      className={`kob-back-home group hidden cursor-pointer items-center gap-2 px-3.5 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] lg:inline-flex ${className}`}
    >
      <ArrowLeft
        size={15}
        strokeWidth={1.8}
        aria-hidden="true"
        className="kob-back-home__arrow"
      />
      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--font-medium)',
          letterSpacing: 'var(--tracking-widest)',
          textTransform: 'uppercase',
        }}
      >
        Volver
      </span>
    </Link>
  </>
);

/**
 * Divisor hairline vertical entre el botón "Volver" y el breadcrumb. Solo
 * desktop, para acompañar a {@link BackToHomeButton} sin aparecer en móvil.
 */
export const BackToHomeDivider = () => (
  <span
    className="hidden lg:block"
    aria-hidden="true"
    style={{
      width: '1px',
      height: '1.25rem',
      backgroundColor: 'var(--border-color)',
      flexShrink: 0,
    }}
  />
);
