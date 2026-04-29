/**
 * @file testimonial-card.tsx
 * @description Tarjeta reutilizable para testimonios de clientes.
 *
 * Replica la lectura limpia del mockup: valoración arriba, texto al centro y
 * firma de cliente al final.
 */

import { Star } from 'lucide-react';

interface TestimonialCardProps {
  /** Comentario destacado del cliente. */
  text: string;
  /** Nombre público del cliente. */
  name: string;
  /** Ciudad o país asociado al testimonio. */
  location: string;
  /** Resalta visualmente una tarjeta central sin cambiar su contenido. */
  featured?: boolean;
}

/**
 * Renderiza un testimonio de cliente con calificación de cinco estrellas.
 *
 * @param props - Datos del cliente y estado visual de la tarjeta.
 * @returns Tarjeta testimonial adaptable a móvil y desktop.
 */
export const TestimonialCard = ({
  text,
  name,
  location,
  featured = false,
}: TestimonialCardProps) => {
  return (
    <article
      className="flex h-full flex-col items-center border px-6 py-8 text-center transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={{
        backgroundColor: featured ? 'var(--bg-secondary)' : 'transparent',
        borderColor: featured ? 'var(--border-color)' : 'transparent',
        boxShadow: featured ? 'var(--shadow-lg)' : 'none',
      }}
    >
      <div className="flex justify-center gap-1" aria-label="5 de 5 estrellas">
        {[0, 1, 2, 3, 4].map((star) => (
          <Star
            key={star}
            size={15}
            fill="currentColor"
            strokeWidth={1.6}
            style={{ color: 'var(--text-primary)' }}
            aria-hidden="true"
          />
        ))}
      </div>

      <p
        className="mt-5"
        style={{
          fontSize: 'var(--text-xs)',
          lineHeight: 'var(--leading-normal)',
          color: 'var(--text-secondary)',
        }}
      >
        {text}
      </p>

      <div className="mt-6">
        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            lineHeight: 'var(--leading-tight)',
            color: 'var(--text-secondary)',
          }}
        >
          {name}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            lineHeight: 'var(--leading-tight)',
            color: 'var(--text-muted)',
          }}
        >
          {location}
        </p>
      </div>
    </article>
  );
};
