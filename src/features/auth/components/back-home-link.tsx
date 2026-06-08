/**
 * @file back-home-link.tsx
 * @description Enlace "Volver al inicio" para las páginas de auth.
 *
 * Permite al visitante abandonar el login/registro y regresar a la home sin
 * iniciar sesión. Disponible en móvil y desktop (vive dentro de la tarjeta del
 * formulario). Esquinas rectas y micro-interacción: la flecha se desplaza al
 * hacer hover.
 */

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const BackHomeLink = () => (
  <Link
    to="/"
    className="group inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide transition-opacity hover:opacity-70"
    style={{ color: 'var(--text-secondary)' }}
  >
    <ArrowLeft
      size={15}
      className="transition-transform duration-200 group-hover:-translate-x-0.5"
      aria-hidden="true"
    />
    Volver al inicio
  </Link>
);
