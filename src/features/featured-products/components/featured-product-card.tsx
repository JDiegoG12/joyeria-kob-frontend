/**
 * @file featured-product-card.tsx
 * @description Tarjeta de producto destacado para la página de inicio
 * de Joyería KOB.
 *
 * ## Estructura visual
 * - Imagen cuadrada **a sangre**: ocupa todo el ancho de la tarjeta sin
 *   padding ni marco interno; la foto es el área completa de imagen.
 * - Si el producto tiene más de una imagen, se navega entre todas con el
 *   mismo carrusel que la tarjeta del catálogo (`public-product-card`):
 *   flechas izquierda/derecha (hover en desktop), swipe táctil en móvil y
 *   puntos indicadores de la imagen activa.
 * - Debajo de la imagen: nombre en `font-ui` semibold (accent), peso pequeño
 *   en muted, precio bold en accent.
 * - Precio con descuento: si el producto tiene un descuento que reduce el
 *   precio, se muestra el original tachado (muted) junto al precio final en
 *   bold (accent), igual que en la tarjeta del catálogo. En móvil el par se
 *   apila para no envolver; en desktop va en una sola línea.
 * - Toda la tarjeta es clickeable: navega a `/catalogo?product=<id>` para
 *   que el catálogo abra automáticamente el `ProductDetailModal`.
 *
 * ## Tipografía
 * Misma familia (`font-ui`) que la tarjeta del catálogo para que en móvil
 * los nombres no se trunquen con elipsis. Se usan las utilidades Tailwind
 * estándar `text-xs` / `text-sm`, que coinciden 1:1 con los tokens
 * `--text-xs` (0.75rem) y `--text-sm` (0.875rem) de `tokens.css`.
 *
 * **Importante**: NO usar `text-(--text-xs)` — esa shorthand de Tailwind v4
 * aplica el valor como *color*, no como font-size, y deja al texto sin tamaño
 * explícito (hereda 1rem del body). Usar `text-xs` directamente o la forma
 * con bracket `text-[var(--text-xs)]` cuando se necesite el token explícito.
 *
 * ## Seña distintiva vs. catálogo
 * A diferencia de la tarjeta del catálogo (plana, borde navy), la destacada
 * tiene una identidad propia que hace eco del fondo `.bg-silk` de su sección:
 * - **Sombra coloreada** ya en reposo (`--shadow-featured-rest`) e intensificada
 *   al hover (`--shadow-featured`): dorada en claro, azul de marca en oscuro —
 *   los mismos halos que pinta `.bg-silk`. Al estar en reposo, el distintivo de
 *   color se ve también en móvil, donde no hay hover (solo el `whileTap`).
 * - **Borde hairline tintado** (`--border-featured`): oro en claro, azul vivo
 *   en oscuro, en vez del borde navy del catálogo.
 *
 * ## Sistema de color
 * Sin valores hexadecimales — todo via tokens de `tokens.css`. La tarjeta
 * funciona idéntico en light y dark mode sin selectores `.dark`.
 *
 * ## Responsive
 * El layout interno escala automáticamente: padding y tamaños de texto
 * usan `clamp(...)` o variantes Tailwind responsive. La grilla externa
 * (definida por `FeaturedProductsSection`) decide cuántas columnas se
 * muestran en cada breakpoint.
 *
 * @see featured-products-section.tsx — sección que consume esta tarjeta.
 */

import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SERVER_URL } from '@/api/server-url';
import {
  buildUploadsSrcSet,
  PRODUCT_IMAGE_WIDTHS,
} from '@/shared/utils/image-srcset';
import { buildProductPath } from '@/features/catalog/utils/product-slug';
import type { Product } from '@/features/catalog/types/product.types';

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Imagen de respaldo si el producto no tiene fotos o falla la carga. */
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formatea un precio en pesos colombianos con separador de miles.
 *
 * @param price - Precio numérico (entero o decimal).
 * @returns Cadena formateada, ej. `$9.000.000`.
 */
const formatPrice = (price: number): string =>
  `$${price.toLocaleString('es-CO')}`;

/**
 * Formatea el peso del producto con una decimal y la unidad `g`.
 * Si el peso es entero (sin parte decimal), se omite el `.0` redundante.
 *
 * @param weight - Peso en gramos.
 * @returns Cadena formateada, ej. `5.2 g` o `8 g`.
 */
const formatWeight = (weight: number): string => {
  const rounded = Math.round(weight * 10) / 10;
  const text = Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
  return `${text} g`;
};

/**
 * Resuelve la URL de una imagen del producto por índice.
 * Si el array está vacío o el nombre es inválido, devuelve el fallback.
 *
 * @param images - Array de nombres de archivo devuelto por el backend.
 * @param index  - Índice de la imagen a resolver.
 * @returns URL absoluta lista para `<img src>`.
 */
const resolveImageUrl = (images: string[], index: number): string => {
  const name = images?.[index];
  if (!name) return FALLBACK_IMAGE;
  if (name.startsWith('http')) return name;
  return `${SERVER_URL}/uploads/products/${name}`;
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface FeaturedProductCardProps {
  /** Producto a mostrar en la tarjeta. */
  product: Product;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Tarjeta de producto destacado de la home.
 *
 * Al hacer click navega a `/catalogo?product=<id>` para que el catálogo
 * abra automáticamente el modal de detalle del producto. Mantiene
 * accesibilidad con `role="button"`, `aria-label` descriptivo y manejo
 * de teclado (Enter / Space).
 */
export const FeaturedProductCard = ({ product }: FeaturedProductCardProps) => {
  const navigate = useNavigate();

  const images = product.images ?? [];
  const hasMultipleImages = images.length > 1;

  const [activeIndex, setActiveIndex] = useState(0);

  const goPrev = () =>
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const goNext = () =>
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation(); // No abrir el detalle al navegar
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

  const imageUrl = resolveImageUrl(images, activeIndex);
  // Miniatura vía srcset (tarjeta ~150–220 px); undefined si es fallback externo.
  const imageSrcSet = buildUploadsSrcSet(imageUrl, PRODUCT_IMAGE_WIDTHS);

  /**
   * Hay descuento visible solo si reduce el precio sin dejarlo en 0 o negativo.
   * Misma lógica que la tarjeta del catálogo (`public-product-card`): cubre el
   * caso de que el oro baje y el descuento iguale o supere el precio calculado.
   */
  const hasDiscount =
    product.discountValue > 0 &&
    product.finalPrice > 0 &&
    product.finalPrice < product.calculatedPrice;

  /**
   * Navega al catálogo con el query param del producto.
   * El catálogo detecta el param y abre el `ProductDetailModal` automáticamente.
   */
  const handleOpenDetail = () => {
    navigate(`/catalogo?product=${product.id}`);
  };

  /**
   * Click sobre la tarjeta. Un swipe genera un `click` espurio al soltar el
   * puntero; lo absorbemos una vez para que el gesto de cambiar de imagen no
   * abra el detalle. En un click normal sí navega al detalle.
   */
  const handleCardClick = () => {
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    handleOpenDetail();
  };

  /** Ruta canónica de la ficha completa (`/producto/:slug`) para el `<Link>`. */
  const productPath = buildProductPath(product);

  /**
   * Click sobre el nombre (un `<Link>` real a la ficha completa). El click
   * normal conserva el comportamiento de la tarjeta (abrir el modal del detalle
   * vía `/catalogo?product=`); ctrl/cmd/click central siguen el enlace y abren
   * la ficha en otra pestaña. Un crawler indexa el `href`.
   */
  const handleNameLinkClick = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) {
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    handleOpenDetail();
  };

  return (
    <article
      className="group flex h-full cursor-pointer flex-col shadow-[var(--shadow-featured-rest)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[var(--shadow-featured)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={
        hasDiscount
          ? `Ver detalles de ${product.name}, en oferta a ${formatPrice(
              product.finalPrice,
            )} antes ${formatPrice(product.calculatedPrice)}`
          : `Ver detalles de ${product.name}`
      }
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleOpenDetail();
        }
      }}
      style={{
        border: '1px solid var(--border-featured)',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      {/*
       * ── Zona de imagen (a sangre, sin marco) ──────────────────────────
       * La foto ocupa el 100% del ancho de la tarjeta, sin padding ni borde
       * interno. `aspect-square` mantiene la proporción cuadrada y
       * `object-cover` rellena toda el área sin deformar el producto.
       */}
      <div
        className="relative aspect-square overflow-hidden"
        style={{ backgroundColor: 'var(--bg-tertiary)', touchAction: 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <img
          src={imageUrl}
          srcSet={imageSrcSet}
          sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 45vw"
          alt={`${product.name}${
            hasMultipleImages
              ? ` — imagen ${activeIndex + 1} de ${images.length}`
              : ''
          }`}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.srcset = '';
            (event.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
          }}
        />

        {/* Flechas de navegación — solo si hay más de 1 imagen */}
        {hasMultipleImages && (
          <>
            {/*
             * Chevrons flotantes: sin caja ni borde, blancos sobre la foto con
             * `drop-shadow` para legibilidad.
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

      {/* ── Separador entre imagen e info ──────────────────────────────── */}
      <div
        style={{ height: '1px', backgroundColor: 'var(--border-featured)' }}
        aria-hidden="true"
      />

      {/*
       * ── Info: nombre, peso y precio ──────────────────────────────────
       * Misma estrategia de alineación que la tarjeta del catálogo
       * (`public-product-card`): el wrapper es `flex-1 flex flex-col
       * justify-center` para rellenar el alto que estira la grilla, y el `<h3>`
       * reserva siempre `min-height: 2lh`. Así, nombres de 1 o 2 líneas ocupan
       * el mismo alto y el peso/precio quedan alineados entre todas las cards.
       */}
      <div className="flex flex-1 flex-col justify-center px-2.5 pb-3 pt-2.5 text-center sm:px-3 sm:pb-4 sm:pt-3">
        {/*
         * Nombre: `text-xs` (12px) en móvil para que dos líneas quepan sin
         * elipsis en cards de ~150 px de ancho, `text-sm` (14px) en desktop
         * para igualar al catálogo. `font-semibold` distingue sutilmente la
         * sección destacada sin agrandar el texto.
         *
         * Las clases `text-xs` / `text-sm` de Tailwind resuelven a los mismos
         * valores que los tokens `--text-xs` / `--text-sm`, así que cumplen
         * la regla de "solo tokens" sin acoplar a la sintaxis arbitraria.
         */}
        <h3
          className="line-clamp-2 text-xs sm:text-sm"
          style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 'var(--font-semibold)',
            lineHeight: 'var(--leading-normal)',
            color: 'var(--text-accent)',
            minHeight: '2lh',
          }}
        >
          <Link
            to={productPath}
            onClick={handleNameLinkClick}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {product.name}
          </Link>
        </h3>

        <p
          className="mt-1 text-xs"
          style={{
            fontFamily: 'var(--font-ui)',
            color: 'var(--text-secondary)',
          }}
        >
          {formatWeight(product.baseWeight)}
        </p>

        {/*
         * Precio: con descuento muestra el original tachado + el final en bold;
         * sin descuento muestra solo el precio calculado. Misma presentación que
         * la tarjeta del catálogo (`public-product-card`).
         *
         * Layout responsive: en móvil las cards son angostas (~150px) y los
         * precios en COP son largos, así que el par tachado/final se **apila**
         * (`flex-col`) para que no envuelva de forma irregular. En desktop
         * (`sm:`) pasa a fila con los precios alineados por su línea base,
         * idéntico al catálogo.
         */}
        {hasDiscount ? (
          <div className="mt-1 flex flex-col items-center justify-center sm:flex-row sm:items-baseline sm:gap-2">
            {/* Precio original tachado */}
            <span
              className="text-xs"
              style={{
                fontFamily: 'var(--font-ui)',
                fontWeight: 'var(--font-normal)',
                color: 'var(--text-muted)',
                textDecoration: 'line-through',
              }}
            >
              {formatPrice(product.calculatedPrice)}
            </span>
            {/* Precio con descuento aplicado */}
            <span
              className="text-xs sm:text-sm"
              style={{
                fontFamily: 'var(--font-ui)',
                fontWeight: 'var(--font-bold)',
                color: 'var(--text-accent)',
              }}
            >
              {formatPrice(product.finalPrice)}
            </span>
          </div>
        ) : (
          <p
            className="mt-1 text-xs sm:text-sm"
            style={{
              fontFamily: 'var(--font-ui)',
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