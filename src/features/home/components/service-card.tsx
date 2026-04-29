/**
 * @file service-card.tsx
 * @description Tarjeta reutilizable para servicios de la página principal.
 *
 * Mantiene el estilo de servicios aislado de `home-page.tsx` para que la home
 * solo se encargue de ordenar secciones y datos.
 */

import type { LucideIcon } from 'lucide-react';

interface ServiceCardProps {
  /** Icono visual del servicio, tomado de `lucide-react`. */
  icon: LucideIcon;
  /** Nombre corto del servicio. */
  title: string;
  /** Texto descriptivo del servicio. */
  description: string;
}

/**
 * Presenta un servicio de taller/asesoría en una tarjeta compacta.
 *
 * @param props - Datos visuales y editoriales del servicio.
 * @returns Tarjeta responsive con icono, título y descripción.
 */
export const ServiceCard = ({
  icon: Icon,
  title,
  description,
}: ServiceCardProps) => {
  return (
    <article
      className="group relative flex min-h-44 flex-col border px-8 pb-8 pt-9 shadow-[var(--shadow-xs)] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-accent)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:min-h-48 sm:px-9 lg:px-10"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-accent)',
      }}
    >
      <span
        className="absolute -top-5 -left-5 z-10 flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 ease-out group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
        style={{
          backgroundColor: 'var(--accent)',
          color: 'var(--accent-text)',
          boxShadow: '0 0 0 4px var(--bg-primary), var(--shadow-lg)',
        }}
      >
        <Icon size={18} strokeWidth={1.65} aria-hidden="true" />
      </span>

      <span
        className="absolute right-0 bottom-0 left-0 h-px origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
        style={{ backgroundColor: 'var(--border-accent)' }}
        aria-hidden="true"
      />

      <h3
        className="uppercase"
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-bold)',
          lineHeight: 'var(--leading-tight)',
          letterSpacing: 'var(--tracking-wide)',
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h3>

      <p
        className="mt-5 w-full"
        style={{
          fontSize: 'var(--text-sm)',
          lineHeight: 'var(--leading-normal)',
          color: 'var(--text-secondary)',
        }}
      >
        {description}
      </p>
    </article>
  );
};
