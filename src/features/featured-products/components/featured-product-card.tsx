/**
 * @file featured-product-card.tsx
 * @description Tarjeta de producto destacado para la página de inicio
 * de Joyería KOB.
 *
 * ## Estructura visual
 * - Imagen cuadrada con padding interno y borde `--border-accent`.
 * - Si el producto tiene más de una imagen, un badge sutil en la esquina
 *   superior derecha indica el conteo total (ej. `+3`). El cliente verá
 *   todas las imágenes al entrar al detalle.
 * - Debajo de la imagen: nombre en `font-ui` semibold (accent), peso pequeño
 *   en muted, precio bold en accent.
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

import { useNavigate } from 'react-router-dom';
import { Images } from 'lucide-react';
import { SERVER_URL } from '@/api/server-url';
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
 * Resuelve la URL de la primera imagen del producto.
 * Si el array está vacío o el nombre es inválido, devuelve el fallback.
 *
 * @param images - Array de nombres de archivo devuelto por el backend.
 * @returns URL absoluta lista para `<img src>`.
 */
const resolvePrimaryImage = (images: string[]): string => {
  const first = images?.[0];
  if (!first) return FALLBACK_IMAGE;
  if (first.startsWith('http')) return first;
  return `${SERVER_URL}/uploads/products/${first}`;
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
  const imageCount = images.length;
  const hasMultipleImages = imageCount > 1;
  const primaryImageUrl = resolvePrimaryImage(images);

  /**
   * Navega al catálogo con el query param del producto.
   * El catálogo detecta el param y abre el `ProductDetailModal` automáticamente.
   */
  const handleOpenDetail = () => {
    navigate(`/catalogo?product=${product.id}`);
  };

  return (
    <article
      className="group h-full cursor-pointer transition-shadow duration-300 hover:shadow-[var(--shadow-md)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      onClick={handleOpenDetail}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalles de ${product.name}`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleOpenDetail();
        }
      }}
      style={{
        border: '1px solid var(--border-accent)',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      {/* ── Zona de imagen ──────────────────────────────────────────────── */}
      <div className="p-2 sm:p-3">
        <div
          className="relative aspect-square overflow-hidden"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <img
            src={primaryImageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            loading="lazy"
            onError={(event) => {
              (event.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />

          {/*
           * Badge "+N fotos" — solo cuando el producto tiene más de una imagen.
           * Aria-label completo para lectores de pantalla. La interacción real
           * (navegar imágenes) ocurre en el modal de detalle.
           */}
          {hasMultipleImages && (
            <div
              className="absolute right-2 top-2 flex items-center gap-1 px-1.5 py-0.5 sm:gap-1.5 sm:px-2 sm:py-1"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-accent)',
                color: 'var(--text-accent)',
              }}
              aria-label={`${imageCount} imágenes disponibles`}
            >
              <Images
                size={11}
                strokeWidth={1.8}
                aria-hidden="true"
                className="sm:hidden"
              />
              <Images
                size={13}
                strokeWidth={1.8}
                aria-hidden="true"
                className="hidden sm:block"
              />
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-semibold)',
                  lineHeight: 1,
                }}
              >
                +{imageCount - 1}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Separador entre imagen e info ──────────────────────────────── */}
      <div
        style={{ height: '1px', backgroundColor: 'var(--border-accent)' }}
        aria-hidden="true"
      />

      {/* ── Info: nombre, peso y precio ────────────────────────────────── */}
      <div className="px-2.5 pb-3 pt-2.5 text-center sm:px-3 sm:pb-4 sm:pt-3">
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
          }}
        >
          {product.name}
        </h3>

        <p
          className="mt-1 text-xs"
          style={{
            fontFamily: 'var(--font-ui)',
            color: 'var(--text-muted)',
          }}
        >
          {formatWeight(product.baseWeight)}
        </p>

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
      </div>
    </article>
  );
};