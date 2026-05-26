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
 * ─── Layout responsive ──────────────────────────────────────────────────────
 * · Mobile (<sm): tarjeta horizontal (ícono inline a la izquierda + texto
 *   a la derecha) con padding compacto. El ícono flotante se oculta para
 *   que el conjunto sea ancho pero corto y se pueda leer cada servicio
 *   sin acumular altura.
 * · sm+ (≥640px): layout vertical original con ícono flotante en
 *   `-top-5 -left-5` y padding generoso. Requiere el `pl-5` del grid
 *   contenedor para no recortar el ícono de la primera columna.
 *
 * @param props - Datos visuales y editoriales del servicio.
 * @returns Tarjeta responsive con ícono, título y descripción.
 */
export const ServiceCard = ({
  icon: Icon,
  title,
  description,
}: ServiceCardProps) => {
  return (
    <article
      className="group relative flex h-auto flex-row items-center gap-4 border px-4 py-4 shadow-[var(--shadow-xs)] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-accent)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:h-full sm:flex-col sm:items-stretch sm:gap-0 sm:px-9 sm:pb-8 sm:pt-9 lg:px-10"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-accent)',
      }}
    >
      {/*
       * Ícono flotante — solo en sm+.
       * Se "estampa" sobre la esquina superior izquierda con el ring del
       * bg-primary que lo aísla del borde de la card.
       */}
      <span
        className="absolute -top-5 -left-5 z-10 hidden h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 ease-out group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 sm:flex"
        style={{
          backgroundColor: 'var(--accent)',
          color: 'var(--accent-text)',
          boxShadow: '0 0 0 4px var(--bg-primary), var(--shadow-lg)',
        }}
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={1.65} />
      </span>

      {/*
       * Ícono inline — solo en móvil.
       * Vive dentro del flujo de la tarjeta para que el conjunto se vea
       * como una fila compacta (ícono · texto), no como una columna alta.
       */}
      <span
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full sm:hidden"
        style={{
          backgroundColor: 'var(--accent)',
          color: 'var(--accent-text)',
          boxShadow: 'var(--shadow-sm)',
        }}
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={1.65} />
      </span>

      <span
        className="absolute right-0 bottom-0 left-0 h-px origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
        style={{ backgroundColor: 'var(--border-accent)' }}
        aria-hidden="true"
      />

      {/*
       * Bloque de texto. En móvil ocupa el ancho restante junto al ícono
       * inline; en sm+ vuelve al flujo vertical original.
       */}
      <div className="min-w-0 flex-1 sm:flex-initial">
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

        {/*
         * Descripción: en móvil mantiene tamaño `xs` y `mt-1` para que la
         * tarjeta horizontal quede corta; en sm+ recupera el `mt-5 text-sm`
         * del diseño luxury original.
         */}
        <p
          className="mt-1 w-full text-xs sm:mt-5 sm:text-sm"
          style={{
            lineHeight: 'var(--leading-normal)',
            color: 'var(--text-secondary)',
          }}
        >
          {description}
        </p>
      </div>
    </article>
  );
};
