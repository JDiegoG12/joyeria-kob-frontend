/**
 * @file favorite-card.tsx
 * @description Tarjeta de producto en la página de favoritos.
 *
 * Muestra imagen, nombre, categoría, precio y botón de eliminar.
 * Integra `FavoriteButton` para el toggle rápido sin salir de la página.
 *
 * FIX: se agregó resolveImageUrl para construir la URL completa de la imagen
 * igual que en public-product-card.tsx y product-detail-modal.tsx.
 * El backend devuelve solo el nombre del archivo (ej: "anillo1.jpg"), no la
 * URL completa, por lo que hay que prefijar con SERVER_URL + /uploads/products/.
 * Si la imagen ya es una URL absoluta (Cloudinary), se usa directamente.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import type { FavoriteItem } from '../types/favorite.types';
import { FavoriteButton } from './favorite-button';
import { SERVER_URL } from '@/api/server-url';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

/**
 * Resuelve la URL completa de una imagen de producto.
 * Si el filename ya es una URL absoluta (http/https), la devuelve tal cual.
 * Si es un nombre de archivo relativo, construye la URL con SERVER_URL.
 */
const resolveImageUrl = (filename: string): string =>
  filename.startsWith('http')
    ? filename
    : `${SERVER_URL}/uploads/products/${filename}`;

// ─── Props ────────────────────────────────────────────────────────────────────

interface FavoriteCardProps {
  item: FavoriteItem;
  /** Abre el modal de detalle del producto. */
  onViewDetail: (productId: string) => void;
  /** Animación de entrada escalonada. */
  index: number;
}

// ─── Variantes de animación ───────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.22, ease: 'easeIn' as const },
  },
};

// ─── Placeholder SVG ──────────────────────────────────────────────────────────

const ImagePlaceholder = () => (
  <div
    className="flex h-full w-full items-center justify-center"
    style={{ color: 'var(--text-muted)' }}
  >
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  </div>
);

// ─── Componente ───────────────────────────────────────────────────────────────

export const FavoriteCard = ({
  item,
  onViewDetail,
  index,
}: FavoriteCardProps) => {
  const product = item?.product;

  const [imgError, setImgError] = useState(false);

  // Evita crash si algún favorito viene corrupto o incompleto
  if (!product) return null;

  // FIX: pasar el filename por resolveImageUrl antes de usarlo como src.
  // Antes: src={primaryImage} donde primaryImage era solo "anillo1.jpg"
  // Ahora: src={resolvedImageUrl} donde es "http://localhost:3000/uploads/products/anillo1.jpg"
  const rawImage = product.images?.[0];
  const primaryImage = rawImage ? resolveImageUrl(rawImage) : undefined;
  const showImage = primaryImage && !imgError;

  // Nombre de categoría: subcategoría si existe, si no la raíz
  const categoryName = product.category?.name ?? '';
  const parentName = product.category?.parent?.name ?? '';
  const categoryDisplay = parentName
    ? `${parentName} / ${categoryName}`
    : categoryName;

  return (
    <motion.article
      layout
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="group flex flex-col border transition-[box-shadow,border-color] duration-300 ease-out hover:shadow-[var(--shadow-md)]"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* ── Imagen ── */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: '1 / 1', backgroundColor: 'var(--bg-secondary)' }}
      >
        {showImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <ImagePlaceholder />
        )}

        {/* Botón corazón — quitar de favoritos */}
        <div className="absolute top-2 right-2">
          <FavoriteButton
            productId={product.id}
            productStatus={product.status}
            variant="card"
          />
        </div>
      </div>

      {/* ── Separador ── */}
      <div
        className="h-px w-full"
        style={{ backgroundColor: 'var(--border-color)' }}
      />

      {/* ── Info ── */}
      <div className="flex flex-1 flex-col px-3 pb-4 pt-3">
        {/* Categoría */}
        {categoryDisplay && (
          <p
            className="mb-1 uppercase"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '10px',
              letterSpacing: 'var(--tracking-widest)',
              color: 'var(--text-muted)',
              lineHeight: 'var(--leading-tight)',
            }}
          >
            {categoryDisplay}
          </p>
        )}

        {/* Nombre */}
        <p
          className="line-clamp-2 flex-1"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-semibold)',
            letterSpacing: 'var(--tracking-wide)',
            color: 'var(--text-primary)',
            lineHeight: 'var(--leading-tight)',
          }}
        >
          {product.name}
        </p>

        {/* Precio */}
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-accent)',
          }}
        >
          {formatPrice(product.calculatedPrice ?? 0)}
        </p>

        {/* Ver detalle */}
        <button
          type="button"
          onClick={() => onViewDetail(product.id)}
          className="mt-3 flex cursor-pointer items-center justify-center gap-1.5 border py-2 transition-colors duration-200 hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-bold)',
            letterSpacing: 'var(--tracking-wide)',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            borderColor: 'var(--border-color)',
            backgroundColor: 'transparent',
          }}
        >
          <ExternalLink size={11} strokeWidth={1.8} aria-hidden="true" />
          Ver detalle
        </button>
      </div>
    </motion.article>
  );
};
