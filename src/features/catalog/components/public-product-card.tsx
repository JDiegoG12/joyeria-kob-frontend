/**
 * @file public-product-card.tsx
 * @description Tarjeta de producto para el catálogo público de Joyería KOB.
 *
 * ## Estructura visual (fiel al mockup)
 * - Borde exterior en toda la card
 * - Imagen a sangre — ocupa todo el ancho de la card, sin marco interno
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

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SERVER_URL } from '@/api/server-url';
import type { Product } from '@/features/catalog/types/product.types';

// Import por ruta profunda (no por el barrel `@/features/favorites`) para
// evitar una dependencia circular: el barrel re-exporta `FavoritesPage`, que a
// su vez reutiliza esta misma tarjeta del catálogo.
import { FavoriteButton } from '@/features/favorites/components/favorite-button';

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

  const goPrev = () =>
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const goNext = () =>
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation(); // No abrir el modal al navegar
    goPrev();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    goNext();
  };

  // ── Swipe táctil ───────────────────────────────────────────────────────────
  // En táctil las flechas (hover-only) no aparecen, así que el swipe es el medio
  // principal para cambiar de imagen en móvil. Se mide el desplazamiento
  // horizontal del puntero; si supera el umbral se navega y se marca el gesto
  // para que el `click` posterior NO abra el modal de detalle.
  const SWIPE_THRESHOLD = 40;
  const pointerStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!hasMultipleImages) return;
    pointerStartX.current = e.clientX;
    didSwipe.current = false;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    const deltaX = e.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      didSwipe.current = true;
      if (deltaX < 0) goNext();
      else goPrev();
    }
  };

  const handleCardClick = () => {
    // Un swipe genera un `click` espurio al soltar; lo absorbemos una vez.
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    onClick();
  };

  const imageUrl = resolveImageUrl(images, activeIndex);

  // Hay descuento visible solo si reduce el precio sin dejarlo en 0 o negativo.
  // Esto cubre el caso de que el oro baje y el descuento iguale/supere el precio.
  const hasDiscount =
    product.discountValue > 0 &&
    product.finalPrice > 0 &&
    product.finalPrice < product.calculatedPrice;

  return (
    <article
      className="group flex h-full cursor-pointer flex-col"
      onClick={handleCardClick}
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
      {/*
       * Zona de imagen a sangre — sin padding ni marco interno.
       * La foto ocupa el 100% del ancho de la card, igual que en
       * featured-product-card. `aspect-square` mantiene la proporción y
       * `object-cover` rellena toda el área sin deformar el producto.
       */}
      <div
        className="relative aspect-square overflow-hidden"
        style={{ backgroundColor: 'var(--bg-tertiary)', touchAction: 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
          {/* ─── FAVORITOS ───────────────────────────── */}
          {/* En móvil pegado a la esquina; en ≥sm con un poco más de aire. */}
          <div className="absolute top-1.5 right-1.5 z-10 sm:top-2 sm:right-2">
            <FavoriteButton
              productId={product.id}
              productStatus={product.status}
              variant="card"
            />
          </div>

          <img
            src={imageUrl}
            alt={`${product.name}${
              hasMultipleImages
                ? ` — imagen ${activeIndex + 1} de ${images.length}`
                : ''
            }`}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />

        {/* Flechas de navegación — solo si hay más de 1 imagen */}
        {hasMultipleImages && (
          <>
            {/*
             * Chevrons flotantes: sin caja ni borde, blancos sobre la foto con
             * `drop-shadow` para legibilidad. Hacen juego con el corazón.
             *
             * `pointer-events-none` por defecto + `group-hover:pointer-events-auto`:
             * en táctil (sin hover) las flechas NO capturan taps, así que tocar
             * los bordes de la foto abre el producto en vez de cambiar de imagen
             * (en móvil la navegación es por swipe). En desktop, al hacer hover se
             * vuelven visibles y clickeables. El teclado no depende de
             * pointer-events, así que la navegación con Tab/Enter sigue intacta.
             */}
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Imagen anterior"
              className="pointer-events-none absolute left-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center text-white opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-90 hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.55))' }}
            >
              <ChevronLeft size={26} strokeWidth={2.25} />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Siguiente imagen"
              className="pointer-events-none absolute right-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center text-white opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-90 hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.55))' }}
            >
              <ChevronRight size={26} strokeWidth={2.25} />
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
      {/* Separador */}
      <div
        style={{ height: '1px', backgroundColor: 'var(--border-accent)' }}
        aria-hidden="true"
      />

      {/*
       * Info del producto — centrada, color azul de marca.
       *
       * El wrapper usa `flex-1 flex flex-col justify-center` para que la zona
       * inferior crezca y rellene el espacio que sobra cuando la grid estira
       * el article. Así, todas las cartas de una misma fila tienen la misma
       * altura aunque el nombre del producto tenga 1 o 2 líneas.
       *
       * El `<h3>` reserva siempre `min-height: 2lh` (dos alturas de línea)
       * mediante `line-clamp-2`: los nombres de 1 línea ocupan el mismo
       * espacio vertical que los de 2, y los más largos quedan truncados
       * con elipsis sin romper el layout.
       */}
      <div className="flex flex-1 flex-col justify-center px-3 pb-4 pt-3 text-center">
        <h3
          className="line-clamp-2"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-normal)',
            lineHeight: 'var(--leading-normal)',
            color: 'var(--text-accent)',
            minHeight: '2lh',
          }}
        >
          {product.name}
        </h3>

        {hasDiscount ? (
          <div className="mt-1 flex items-baseline justify-center gap-2">
            {/* Precio original tachado */}
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-normal)',
                color: 'var(--text-muted)',
                textDecoration: 'line-through',
              }}
            >
              {formatPrice(product.calculatedPrice)}
            </span>
            {/* Precio con descuento */}
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-bold)',
                color: 'var(--text-accent)',
              }}
            >
              {formatPrice(product.finalPrice)}
            </span>
          </div>
        ) : (
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
        )}
      </div>
    </article>
  );
};