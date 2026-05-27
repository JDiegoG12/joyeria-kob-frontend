import { useEffect, useState } from 'react';
import {
  EyeOff,
  Images,
  PencilLine,
  Ruler,
  SquareStack,
  Trash2,
} from 'lucide-react';
import type { Product } from '../types/product.types';

interface ProductCardProps {
  product: Product;
  serverUrl: string;
  processingAction: 'visibility' | 'delete' | null;
  onEdit: (product: Product) => void;
  onToggleVisibility: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const ProductCard = ({
  product,
  serverUrl,
  processingAction,
  onEdit,
  onToggleVisibility,
  onDelete,
}: ProductCardProps) => {
  const images = product.images ?? [];
  const hasMultipleImages = images.length > 1;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product.id, product.images]);

  useEffect(() => {
    if (!hasMultipleImages) return;

    const interval = window.setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [hasMultipleImages, images.length]);

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const currentImage = images[currentImageIndex];
  const parentCategoryName = product.category?.parent?.name ?? null;
  const categoryName = product.category?.name ?? null;
  const categoryLabel = parentCategoryName
    ? `${parentCategoryName} / ${categoryName}`
    : categoryName;

  const isVisibilityLoading = processingAction === 'visibility';
  const isDeleteLoading = processingAction === 'delete';

  const getStatusLabel = (status: Product['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Activo';
      case 'OUT_OF_STOCK':
        return 'Sin stock';
      case 'HIDDEN':
        return 'Oculto';
      default:
        return status;
    }
  };

  const getStatusStyle = (status: Product['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          backgroundColor: 'rgba(34, 197, 94, 0.12)',
          color: 'rgb(34, 197, 94)',
          borderColor: 'rgba(34, 197, 94, 0.2)',
        };
      case 'OUT_OF_STOCK':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          color: 'rgb(245, 158, 11)',
          borderColor: 'rgba(245, 158, 11, 0.2)',
        };
      case 'HIDDEN':
        return {
          backgroundColor: 'rgba(148, 163, 184, 0.12)',
          color: 'var(--text-secondary)',
          borderColor: 'rgba(148, 163, 184, 0.2)',
        };
      default:
        return {
          backgroundColor: 'rgba(148, 163, 184, 0.12)',
          color: 'var(--text-secondary)',
          borderColor: 'rgba(148, 163, 184, 0.2)',
        };
    }
  };

  const formatPrice = (price: number | string) =>
    `$${Number(price).toLocaleString('es-CO')} COP`;

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-[24px] transition-all duration-300 ease-out hover:-translate-y-1 sm:rounded-[28px]"
      style={{
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        boxShadow: 'var(--shadow-md)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'var(--accent-vivid, var(--border-accent))';
        el.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'var(--border-color)';
        el.style.boxShadow = 'var(--shadow-md)';
      }}
    >
      <div className="relative aspect-[4/3] overflow-hidden sm:aspect-square">
        {currentImage ? (
          <>
            <img
              src={`${serverUrl}/uploads/products/${currentImage}`}
              alt={`${product.name} - imagen ${currentImageIndex + 1}`}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />

            <div
              className="absolute inset-x-0 bottom-0 h-28"
              style={{
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.62), rgba(0,0,0,0))',
              }}
            />

            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={handlePreviousImage}
                  className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white backdrop-blur transition cursor-pointer active:scale-90"
                  style={{ backgroundColor: 'rgba(15, 23, 42, 0.52)' }}
                  aria-label="Imagen anterior"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white backdrop-blur transition cursor-pointer active:scale-90"
                  style={{ backgroundColor: 'rgba(15, 23, 42, 0.52)' }}
                  aria-label="Siguiente imagen"
                >
                  ›
                </button>

                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {images.map((_, index) => (
                    <button
                      key={`${product.id}-dot-${index}`}
                      type="button"
                      onClick={() => setCurrentImageIndex(index)}
                      className="h-2.5 w-2.5 rounded-full transition cursor-pointer"
                      style={{
                        backgroundColor:
                          index === currentImageIndex
                            ? 'rgba(255,255,255,0.96)'
                            : 'rgba(255,255,255,0.4)',
                        transform:
                          index === currentImageIndex
                            ? 'scale(1.08)'
                            : 'scale(1)',
                      }}
                      aria-label={`Ver imagen ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, var(--bg-tertiary) 0%, color-mix(in srgb, var(--bg-tertiary) 72%, black) 100%)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-muted)',
              }}
            >
              Sin imagen
            </span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex items-center gap-2 sm:left-4 sm:top-4">
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-1"
            style={{
              ...getStatusStyle(product.status),
              border: `1px solid ${getStatusStyle(product.status).borderColor}`,
              backdropFilter: 'blur(12px)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.6875rem',
              fontWeight: 'var(--font-semibold)',
            }}
          >
            {getStatusLabel(product.status)}
          </span>
        </div>

        <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-white"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(12px)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.6875rem',
              fontWeight: 'var(--font-medium)',
            }}
          >
            <Images size={12} />
            {images.length}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-6">
        {categoryLabel && (
          <p
            className="mb-2 sm:mb-3"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.6875rem',
              fontWeight: 'var(--font-medium)',
              color: 'var(--text-muted)',
              letterSpacing: 'var(--tracking-wide)',
              textTransform: 'uppercase',
            }}
          >
            {categoryLabel}
          </p>
        )}

        <div className="min-h-[3.25rem]">
          <h3
            className="line-clamp-2"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.125rem',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)',
              lineHeight: '1.2',
            }}
          >
            {product.name}
          </h3>
          <p
            className="mt-1 line-clamp-2"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.35',
            }}
          >
            {product.description}
          </p>
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-3 sm:mt-4">
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.6875rem',
              fontWeight: 'var(--font-medium)',
              color: 'var(--text-muted)',
              letterSpacing: 'var(--tracking-wide)',
              textTransform: 'uppercase',
            }}
          >
            Precio
          </span>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--accent-vivid, var(--accent))',
              lineHeight: '1.2',
            }}
          >
            {formatPrice(product.calculatedPrice)}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
          <MetricChip
            icon={<Ruler size={13} style={{ color: 'var(--text-muted)' }} />}
            label="Peso base"
            value={`${product.baseWeight} g`}
          />
          <MetricChip
            icon={
              <SquareStack size={13} style={{ color: 'var(--text-muted)' }} />
            }
            label="Stock"
            value={`${product.stock}`}
          />
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-4 sm:pt-5">
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-all duration-200 hover:opacity-95 active:scale-[0.99] sm:min-h-11 sm:py-3"
            style={{
              backgroundColor: 'var(--accent-vivid, var(--accent))',
              color: 'var(--accent-text)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-semibold)',
            }}
          >
            <PencilLine size={15} />
            Editar joya
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onToggleVisibility(product)}
              disabled={isVisibilityLoading || isDeleteLoading}
              className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-11"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                backgroundColor: 'transparent',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
              }}
              onMouseEnter={(e) => {
                if (isVisibilityLoading || isDeleteLoading) return;
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  'var(--bg-hover)';
                (e.currentTarget as HTMLElement).style.borderColor =
                  'var(--accent-vivid, var(--accent))';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  'transparent';
                (e.currentTarget as HTMLElement).style.borderColor =
                  'var(--border-color)';
              }}
            >
              <EyeOff size={15} />
              {isVisibilityLoading
                ? 'Procesando...'
                : product.status === 'HIDDEN'
                  ? 'Activar'
                  : 'Ocultar'}
            </button>

            <button
              type="button"
              onClick={() => onDelete(product)}
              disabled={isVisibilityLoading || isDeleteLoading}
              className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-11"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.18)',
                color: 'var(--color-error)',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
              }}
              onMouseEnter={(e) => {
                if (isVisibilityLoading || isDeleteLoading) return;
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  'rgba(239, 68, 68, 0.14)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  'rgba(239, 68, 68, 0.08)';
              }}
            >
              <Trash2 size={15} />
              {isDeleteLoading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

interface MetricChipProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const MetricChip = ({ icon, label, value }: MetricChipProps) => (
  <span
    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
    style={{
      backgroundColor: 'var(--bg-primary)',
      border: '1px solid var(--border-color)',
    }}
  >
    {icon}
    <span
      style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '0.8125rem',
        fontWeight: 'var(--font-semibold)',
        color: 'var(--text-primary)',
        lineHeight: '1',
      }}
    >
      {value}
    </span>
    <span
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: '0.6875rem',
        fontWeight: 'var(--font-medium)',
        color: 'var(--text-muted)',
        lineHeight: '1',
      }}
    >
      {label}
    </span>
  </span>
);
