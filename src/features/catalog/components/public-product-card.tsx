/**
 * @file public-product-card.tsx
 * @description Tarjeta de producto para el catálogo público de Joyería KOB.
 *
 * ## Estructura visual (fiel al mockup)
 * - Borde exterior en toda la card
 * - Imagen con padding interno — no toca los bordes de la card
 * - Flechas de navegación izquierda/derecha sobre la imagen (solo si hay más de 1 imagen)
 * - Nombre y precio centrados debajo de la imagen
 * - Color azul de marca (--text-accent) para nombre y precio
 * - Click en la tarjeta abre el modal de detalle
 *
 * @example
 * ```tsx
 * <PublicProductCard product={product} onClick={() => openModal(product)} />
 * ```
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SERVER_URL } from '@/api/server-url';
import type { Product } from '@/features/catalog/types/product.types';

// ─── Constantes ───────────────────────────────────────────────────────────────

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formatea un número como precio en pesos colombianos.
 * @param price - Precio numérico.
 * @returns String formateado, ej: `$9.000.000`
 */
const formatPrice = (price: number): string =>
  `$${price.toLocaleString('es-CO')}`;

/**
 * Resuelve la URL de una imagen de producto por índice.
 * @param images - Array de nombres de archivo.
 * @param index  - Índice de la imagen a resolver.
 * @returns URL completa o imagen fallback.
 */
const resolveImageUrl = (images: string[], index: number): string => {
  if (images.length > 0 && images[index]) {
    return `${SERVER_URL}/uploads/products/${images[index]}`;
  }
  return FALLBACK_IMAGE;
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface PublicProductCardProps {
  /** Producto a mostrar. */
  product: Product;
  /** Callback al hacer click en la tarjeta — abre el modal de detalle. */
  onClick: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Tarjeta de producto para el catálogo público.
 * Incluye navegación de imágenes con flechas y abre el modal al hacer click.
 */
export const PublicProductCard = ({
  product,
  onClick,
}: PublicProductCardProps) => {
  const images = product.images ?? [];
  const hasMultipleImages = images.length > 1;

  const [activeIndex, setActiveIndex] = useState(0);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation(); // No abrir el modal al navegar
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const imageUrl = resolveImageUrl(images, activeIndex);

  return (
    <article
      className="group cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalles de ${product.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        border: '1px solid var(--border-accent)',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      {/* Zona de imagen con padding */}
      <div className="p-3">
        {/* Imagen cuadrada con flechas encima */}
        <div
          className="relative aspect-square overflow-hidden"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <img
            src={imageUrl}
            alt={`${product.name}${hasMultipleImages ? ` — imagen ${activeIndex + 1} de ${images.length}` : ''}`}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />

          {/* Flechas de navegación — solo si hay más de 1 imagen */}
          {hasMultipleImages && (
            <>
              {/* Flecha izquierda */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Imagen anterior"
                className="absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-accent)',
                  color: 'var(--text-accent)',
                }}
              >
                <ChevronLeft size={14} />
              </button>

              {/* Flecha derecha */}
              <button
                type="button"
                onClick={handleNext}
                aria-label="Siguiente imagen"
                className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-accent)',
                  color: 'var(--text-accent)',
                }}
              >
                <ChevronRight size={14} />
              </button>

              {/* Indicador de puntos */}
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                {images.map((_, idx) => (
                  <span
                    key={idx}
                    className="block h-1.5 w-1.5 rounded-full transition-colors duration-200"
                    style={{
                      backgroundColor:
                        idx === activeIndex
                          ? 'var(--bg-secondary)'
                          : 'rgba(255,255,255,0.5)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Separador */}
      <div
        style={{ height: '1px', backgroundColor: 'var(--border-accent)' }}
        aria-hidden="true"
      />

      {/* Info del producto — centrada, color azul de marca */}
      <div className="px-3 pb-4 pt-3 text-center">
        <h3
          className="line-clamp-2"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-normal)',
            lineHeight: 'var(--leading-normal)',
            color: 'var(--text-accent)',
          }}
        >
          {product.name}
        </h3>

        <p
          className="mt-1"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--text-accent)',
          }}
        >
          {formatPrice(product.calculatedPrice)}
        </p>
      </div>
    </article>
  );
};
