/**
 * @file product-detail-modal.tsx
 * @description Modal de detalle de producto del catálogo público de Joyería KOB.
 *
 *  ACTUALIZACIONES DE DISEÑO Y ELEGANCIA (UX/UI):
 * 1. Bordes Cuadrados: Se eliminaron los bordes redondeados para transmitir mayor elegancia.
 * 2. Scroll Aislado (Desktop): La columna derecha es un Flexbox estricto. El título queda fijo
 *    arriba, el precio fijo abajo, y SOLO la tabla de características hace scroll en el medio.
 * 3. Experiencia Móvil: En pantallas pequeñas, el modal completo hace scroll de forma fluida
 *    (evitando el molesto doble-scroll en móviles). El botón de cerrar se reubicó y reforzó.
 * 4. Fix Miniaturas: Se agregó `p-[2px]` al contenedor de thumbnails para evitar
 *    que el borde del item seleccionado se corte.
 */

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { X, Heart, ChevronRight, ChevronLeft, ZoomIn } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/social-icons';
import type { Product } from '@/features/catalog/types/product.types';

// ─── Constantes ──────────────────────────────────────────────────────────────

const SERVER_URL = import.meta.env.VITE_API_URL?.replace('/api', '') ?? '';
const FALLBACK_IMAGE = '@/assets/HERO_IMAGE.jpg';
const WHATSAPP_NUMBER = '573135007459';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatPrice = (price: number): string =>
  `$${price.toLocaleString('es-CO')}`;

const resolveImageUrl = (filename: string): string =>
  filename.startsWith('http')
    ? filename
    : `${SERVER_URL}/uploads/products/${filename}`;

const buildWhatsAppUrl = (productName: string): string => {
  const message = encodeURIComponent(
    `Hola, me interesa la joya "${productName}" que vi en el catálogo. ¿Podrían darme más información?`,
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
};

const parseSpecifications = (
  specs: Record<string, unknown>,
): { label: string; value: string }[] => {
  const EXCLUDED_KEYS = new Set(['requiresSize', 'hasStones']);
  const LABEL_MAP: Record<string, string> = {
    sizes: 'Tallas disponibles',
    stones: 'Piedras',
    stoneType: 'Tipo de piedra',
    material: 'Material',
    weight: 'Peso',
    length: 'Largo',
    width: 'Ancho',
    finish: 'Acabado',
    color: 'Color',
    carats: 'Quilates',
  };

  return Object.entries(specs)
    .filter(
      ([key, value]) =>
        !EXCLUDED_KEYS.has(key) &&
        value !== undefined &&
        value !== null &&
        value !== '',
    )
    .map(([key, value]) => ({
      label: LABEL_MAP[key] ?? key.charAt(0).toUpperCase() + key.slice(1),
      value: Array.isArray(value)
        ? (value as unknown[]).join(', ')
        : String(value),
    }));
};

// ─── Tipos y Animaciones ─────────────────────────────────────────────────────

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

const imageSlideVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    transition: { duration: 0.2 },
  }),
};

// ─── Componente Principal ────────────────────────────────────────────────────

export const ProductDetailModal = ({
  product,
  onClose,
}: ProductDetailModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
    setDirection(0);
    setLightboxOpen(false);
  }, [product?.id]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxOpen) setLightboxOpen(false);
        else onClose();
      }
      if (!product) return;
      const images = product.images ?? [];
      if (e.key === 'ArrowRight') goNext(images.length);
      if (e.key === 'ArrowLeft') goPrev(images.length);
    },
    [onClose, product, lightboxOpen],
  );

  useEffect(() => {
    if (!product) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [product, handleKeyDown]);

  if (!mounted) return null;

  const images = product?.images ?? [];
  const hasImages = images.length > 0;
  const hasMultiple = images.length > 1;
  const activeImageUrl = hasImages
    ? resolveImageUrl(images[activeIndex])
    : FALLBACK_IMAGE;

  const goNext = (total: number) => {
    setDirection(1);
    setActiveIndex((i) => (i + 1) % total);
  };

  const goPrev = (total: number) => {
    setDirection(-1);
    setActiveIndex((i) => (i - 1 + total) % total);
  };

  const specs = parseSpecifications(
    (product?.specifications as Record<string, unknown>) ?? {},
  );

  const allFeatures = [
    { label: 'Peso', value: `${product?.baseWeight ?? 0} g` },
    ...specs,
  ];

  const rootCategoryName =
    product?.category?.parent?.name ?? product?.category?.name ?? null;
  const subCategoryName = product?.category?.parent
    ? product.category.name
    : null;

  return createPortal(
    <>
      <style>{`
        .modal-info-scroll::-webkit-scrollbar {
          -webkit-appearance: none;
          width: 5px;
        }
        .modal-info-scroll::-webkit-scrollbar-thumb {
          background-color: var(--border-strong);
        }
        .modal-info-scroll::-webkit-scrollbar-track {
          background-color: transparent;
        }
      `}</style>

      <AnimatePresence>
        {product && (
          <motion.div
            key="modal-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[9999] overflow-y-auto"
            style={{ backgroundColor: 'var(--bg-overlay)' }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex min-h-full p-4 sm:p-6 md:p-8">
              <motion.div
                variants={panelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                /**
                 * En móvil: el panel ocupa el ancho disponible con margen visible (p-4 del wrapper).
                 * sm:overflow-hidden: En desktop, bloquea el scroll del modal completo
                 * para cederle el control al scroll de las características.
                 */
                className="relative m-auto flex w-full max-w-[64rem] sm:max-h-[88vh] flex-col overflow-y-auto shadow-2xl sm:flex-row sm:overflow-hidden bg-[var(--bg-secondary)]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Botón de cerrar — visible y refinado en móvil y desktop */}
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-3 top-3 z-30 flex h-9 w-9 cursor-pointer items-center justify-center transition-all duration-150 hover:bg-[var(--bg-hover)] sm:h-10 sm:w-10"
                  style={{
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  aria-label="Cerrar detalles"
                >
                  <X size={16} strokeWidth={2} />
                </button>

                {/* ══════════════════════════════════════════
                    COLUMNA IZQUIERDA — Galería
                ══════════════════════════════════════════ */}
                <div
                  className="flex w-full shrink-0 flex-col justify-start p-5 pt-14 sm:pt-6 sm:w-1/2 lg:p-8"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  {/* Imagen Principal (Cuadrada perfecta sin bordes redondeados) */}
                  <div
                    className="group relative aspect-square w-full overflow-hidden border shadow-sm"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    <AnimatePresence
                      initial={false}
                      custom={direction}
                      mode="popLayout"
                    >
                      <motion.img
                        key={activeIndex}
                        custom={direction}
                        variants={imageSlideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        src={activeImageUrl}
                        alt={product.name}
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            FALLBACK_IMAGE;
                        }}
                      />
                    </AnimatePresence>

                    {/* Lupa */}
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="absolute bottom-3 right-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <ZoomIn size={15} strokeWidth={1.5} />
                    </button>

                    {hasMultiple && (
                      <>
                        <button
                          type="button"
                          onClick={() => goPrev(images.length)}
                          className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center transition-all duration-150 hover:bg-[var(--bg-hover)]"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <ChevronLeft size={18} strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => goNext(images.length)}
                          className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center transition-all duration-150 hover:bg-[var(--bg-hover)]"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <ChevronRight size={18} strokeWidth={1.5} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails (Miniaturas) */}
                  {hasMultiple && (
                    <div className="mt-4 flex gap-2.5 overflow-x-auto pb-0.5">
                      {images.map((img, idx) => (
                        <button
                          key={img}
                          type="button"
                          onClick={() => {
                            setDirection(idx > activeIndex ? 1 : -1);
                            setActiveIndex(idx);
                          }}
                          className="shrink-0 cursor-pointer transition-all duration-150 p-[3px]"
                          style={{
                            // El borde vive en el botón (sin overflow:hidden) → nunca se corta
                            border:
                              activeIndex === idx
                                ? '2px solid var(--text-accent)'
                                : '1px solid var(--border-color)',
                            opacity: activeIndex === idx ? 1 : 0.55,
                            backgroundColor: 'transparent',
                          }}
                        >
                          <div className="h-12 w-12 overflow-hidden">
                            <img
                              src={resolveImageUrl(img)}
                              alt={`Miniatura ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ══════════════════════════════════════════
                    COLUMNA DERECHA — Info (Sticky Header/Footer)
                ══════════════════════════════════════════ */}
                <div
                  className="flex w-full flex-col p-6 sm:w-1/2 sm:p-8 lg:p-10 sm:overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  {/* SECCIÓN SUPERIOR: Título y Descripción (No hace scroll) */}
                  <div className="shrink-0">
                    <nav
                      className="mb-4 flex flex-wrap items-center gap-1 uppercase"
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--text-xs)',
                        letterSpacing: 'var(--tracking-wide)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>Inicio</span> <ChevronRight size={10} />{' '}
                      <span>Catálogo</span>
                      {rootCategoryName && (
                        <>
                          <ChevronRight size={10} />{' '}
                          <span>{rootCategoryName}</span>
                        </>
                      )}
                      {subCategoryName && (
                        <>
                          <ChevronRight size={10} />{' '}
                          <span
                            style={{
                              color: 'var(--text-accent)',
                              fontWeight: 'var(--font-bold)',
                            }}
                          >
                            {subCategoryName}
                          </span>
                        </>
                      )}
                    </nav>

                    <h2
                      className="uppercase"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
                        fontWeight: 'var(--font-bold)',
                        lineHeight: 'var(--leading-tight)',
                        color: 'var(--text-accent)',
                      }}
                    >
                      {product.name}
                    </h2>

                    {product.description && (
                      <p
                        className="mt-3"
                        style={{
                          fontSize: 'var(--text-sm)',
                          lineHeight: 'var(--leading-relaxed)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* SECCIÓN MEDIA: Características
                      En desktop (sm:) el panel tiene max-h fija → flex-1+min-h-0 activan scroll aislado.
                      En móvil el modal entero scrollea libremente → no se necesita overflow aquí. */}
                  <div className="my-5 min-h-0 flex-1 sm:overflow-y-auto modal-info-scroll sm:pr-2">
                    <p
                      className="mb-3 uppercase"
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--font-bold)',
                        letterSpacing: 'var(--tracking-widest)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      Características
                    </p>
                    <dl className="space-y-1.5">
                      {allFeatures.map(({ label, value }) => (
                        <div key={label} className="flex gap-2">
                          <dt
                            style={{
                              fontFamily: 'var(--font-ui)',
                              fontSize: 'var(--text-sm)',
                              fontWeight: 'var(--font-semibold)',
                              color: 'var(--text-primary)',
                              minWidth: '6rem',
                              flexShrink: 0,
                            }}
                          >
                            {label}:
                          </dt>
                          <dd
                            style={{
                              fontSize: 'var(--text-sm)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {/* SECCIÓN INFERIOR: Precio y Acciones (No hace scroll) */}
                  <div
                    className="shrink-0 pt-4 border-t"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="mb-1 flex items-center">
                      <p
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        Peso estimado:{' '}
                        <span
                          style={{
                            fontWeight: 'var(--font-semibold)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {product.baseWeight}g
                        </span>
                      </p>
                    </div>

                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                        fontWeight: 'var(--font-bold)',
                        lineHeight: 1,
                        color: 'var(--text-accent)',
                      }}
                    >
                      {formatPrice(product.calculatedPrice || 0)}
                    </p>

                    <p
                      className="mt-2"
                      style={{
                        fontSize: 'var(--text-xs)',
                        lineHeight: 'var(--leading-relaxed)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Nuestros trabajos son personalizados y tienen un tiempo de
                      fabricación estimado de 10–20 días hábiles.
                    </p>

                    <div className="mt-5 flex items-center gap-3">
                      <a
                        href={buildWhatsAppUrl(product.name || 'Joya')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 cursor-pointer items-center justify-center gap-2.5 border px-5 py-3.5 text-center transition-colors duration-200 hover:bg-[var(--bg-hover)]"
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-semibold)',
                          color: 'var(--text-accent)',
                          borderColor: 'var(--border-strong)',
                        }}
                      >
                        <WhatsAppIcon size={17} /> Comprar por WhatsApp
                      </a>
                      <button
                        type="button"
                        className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center border transition-colors duration-200 hover:bg-[var(--bg-hover)]"
                        style={{
                          borderColor: 'var(--border-strong)',
                          color: 'var(--text-accent)',
                        }}
                        aria-label="Añadir a favoritos"
                      >
                        <Heart size={18} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lightbox de Zoom (Pantalla completa sin bordes redondeados) ── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex cursor-zoom-out items-center justify-center bg-black/95"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              type="button"
              className="absolute right-5 top-5 z-10 flex h-10 w-10 cursor-pointer items-center justify-center border border-white/20 text-white hover:bg-white/10"
            >
              <X size={18} />
            </button>
            <motion.img
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              src={activeImageUrl}
              alt="Zoom"
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
};
