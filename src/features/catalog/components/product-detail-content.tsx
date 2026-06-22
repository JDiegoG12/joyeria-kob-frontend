/**
 * @file product-detail-content.tsx
 * @description Contenido visual del detalle de producto, COMPARTIDO entre el
 * modal del catálogo (`ProductDetailModal`) y la página completa
 * (`ProductPage`, ruta `/producto/:slug`).
 *
 * Renderiza las dos columnas del detalle (galería + información) más el
 * lightbox de zoom. NO incluye el overlay/portal/animación del modal: eso vive
 * en `ProductDetailModal`. La página de producto lo monta directamente dentro
 * de su propio contenedor.
 *
 * ## Diferencias por `layout`
 * - `modal`: la columna de info usa scroll aislado (`max-h` del panel) y se
 *   escuchan teclas (←/→ para navegar imágenes, Esc para cerrar lightbox/modal).
 * - `page`: el contenido fluye con la altura natural (sin scroll interno) y NO
 *   se capturan teclas globales (en una página normal las flechas deben hacer
 *   scroll y Esc no debe hacer nada).
 *
 * El breadcrumb adapta su navegación:
 * - En `modal` cierra el modal (el catálogo subyacente se re-filtra solo).
 * - En `page` navega a `/catalogo` (no hay catálogo debajo que re-filtrar).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ChevronRight, ChevronLeft, ZoomIn, X } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/social-icons';
import { useCategoryStore } from '@/store/category.store';
import { SERVER_URL } from '@/api/server-url';
import { buildWhatsAppUrl } from '@/config/contact';
import type { Product } from '@/features/catalog/types/product.types';
import { FavoriteButton } from '@/features/favorites';
import FALLBACK_IMAGE from '@/assets/HERO_IMAGE.webp';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatPrice = (price: number): string =>
  `$${price.toLocaleString('es-CO')}`;

const resolveImageUrl = (filename: string): string =>
  filename.startsWith('http')
    ? filename
    : `${SERVER_URL}/uploads/products/${filename}`;

/** URL de WhatsApp con un mensaje pre-redactado sobre la joya consultada. */
const buildProductWhatsAppUrl = (productName: string): string =>
  buildWhatsAppUrl(
    `Hola, me interesa la joya "${productName}" que vi en el catálogo. ¿Podrían darme más información?`,
  );

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

// ─── Animaciones ─────────────────────────────────────────────────────────────

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

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProductDetailContentProps {
  /** Producto a mostrar. */
  product: Product;
  /**
   * Contexto de uso. `modal` (por defecto) activa scroll aislado y atajos de
   * teclado; `page` fluye con la altura natural y no captura teclas globales.
   */
  layout?: 'modal' | 'page';
  /**
   * Callback de cierre. Presente solo en `modal`: el breadcrumb y la tecla Esc
   * lo invocan para cerrar el modal. En `page` se omite.
   */
  onClose?: () => void;
}

// ─── Componente ──────────────────────────────────────────────────────────────

/**
 * Contenido reutilizable del detalle de producto (galería + info + lightbox).
 * Devuelve un fragmento con las dos columnas como hijos directos, de modo que
 * el contenedor padre (panel del modal o tarjeta de la página) controla la
 * dirección flex (`sm:flex-row`).
 */
export const ProductDetailContent = ({
  product,
  layout = 'modal',
  onClose,
}: ProductDetailContentProps) => {
  const isModal = layout === 'modal';

  // En la página, el nombre del producto es el encabezado principal (`h1`).
  // En el modal usamos `h2` para no competir con el `h1` del catálogo debajo.
  const TitleTag = isModal ? 'h2' : 'h1';

  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const pointerStartX = useRef<number | null>(null);

  const navigate = useNavigate();
  const { selectCatalogCategory, selectCatalogSubCategory } =
    useCategoryStore();

  const images = product.images ?? [];
  const hasImages = images.length > 0;
  const hasMultiple = images.length > 1;

  // Reinicia la galería al cambiar de producto.
  useEffect(() => {
    setActiveIndex(0);
    setDirection(0);
    setLightboxOpen(false);
  }, [product.id]);

  const goNext = useCallback(() => {
    if (images.length === 0) return;
    setDirection(1);
    setActiveIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    if (images.length === 0) return;
    setDirection(-1);
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  // Atajos de teclado — solo en el modal. En una página normal no se deben
  // secuestrar las flechas (scroll) ni Esc.
  useEffect(() => {
    if (!isModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxOpen) setLightboxOpen(false);
        else onClose?.();
        return;
      }
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isModal, lightboxOpen, onClose, goNext, goPrev]);

  // ── Swipe táctil de la galería ───────────────────────────────────────────
  const SWIPE_THRESHOLD = 40;

  const handleImagePointerDown = (e: React.PointerEvent) => {
    if (!hasMultiple) return;
    pointerStartX.current = e.clientX;
  };

  const handleImagePointerUp = (e: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    const deltaX = e.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX < 0) goNext();
      else goPrev();
    }
  };

  const activeImageUrl = hasImages
    ? resolveImageUrl(images[activeIndex])
    : FALLBACK_IMAGE;

  const specs = parseSpecifications(
    (product.specifications as Record<string, unknown>) ?? {},
  );

  // Hay descuento visible solo si reduce el precio sin dejarlo en 0 o negativo.
  const hasDiscount =
    product.discountValue > 0 &&
    product.finalPrice > 0 &&
    product.finalPrice < product.calculatedPrice;

  const allFeatures = [
    { label: 'Peso', value: `${product.baseWeight ?? 0} g` },
    ...specs,
  ];

  const rootCategoryName =
    product.category?.parent?.name ?? product.category?.name ?? null;
  const subCategoryName = product.category?.parent
    ? product.category.name
    : null;

  const category = product.category ?? null;
  const rootCategoryId = category ? (category.parentId ?? category.id) : null;
  const subCategoryId =
    category && category.parentId !== null ? category.id : null;

  /*
   * Handlers del breadcrumb. En modal cierran el modal (el catálogo subyacente
   * reacciona al store y se re-filtra). En page navegan a la ruta destino.
   */
  const leaveToCatalog = () => {
    if (isModal) onClose?.();
    else navigate('/catalogo');
  };

  const handleCrumbHome = () => {
    onClose?.();
    navigate('/');
  };
  const handleCrumbCatalog = () => {
    selectCatalogCategory(null);
    selectCatalogSubCategory(null);
    leaveToCatalog();
  };
  const handleCrumbRoot = () => {
    if (rootCategoryId === null) return;
    selectCatalogCategory(rootCategoryId);
    selectCatalogSubCategory(null);
    leaveToCatalog();
  };
  const handleCrumbSub = () => {
    if (rootCategoryId === null || subCategoryId === null) return;
    // El padre primero: selectCatalogCategory resetea la subcategoría, así que
    // debe ir antes de fijar la subcategoría concreta.
    selectCatalogCategory(rootCategoryId);
    selectCatalogSubCategory(subCategoryId);
    leaveToCatalog();
  };

  return (
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

      {/* ══════════════════════════════════════════
          COLUMNA IZQUIERDA — Galería
      ══════════════════════════════════════════ */}
      <div className="flex w-full shrink-0 flex-col justify-start bg-[var(--bg-secondary)] p-0 sm:w-1/2 sm:bg-[var(--bg-tertiary)]">
        {/* Imagen Principal — a sangre en móvil y desktop */}
        <div
          className="group relative aspect-square w-full overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            touchAction: 'pan-y',
          }}
          onPointerDown={handleImagePointerDown}
          onPointerUp={handleImagePointerUp}
        >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
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
                (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
              }}
            />
          </AnimatePresence>

          {/* Lupa — abre el lightbox */}
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="Ampliar imagen"
            className="absolute bottom-2 right-2 z-10 flex h-10 w-10 cursor-pointer items-center justify-center text-white opacity-100 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] transition-opacity duration-200 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ZoomIn size={20} strokeWidth={2} />
          </button>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Imagen anterior"
                className="absolute left-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center text-white opacity-90 transition-opacity duration-200 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.55))' }}
              >
                <ChevronLeft size={28} strokeWidth={2.25} />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Siguiente imagen"
                className="absolute right-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center text-white opacity-90 transition-opacity duration-200 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.55))' }}
              >
                <ChevronRight size={28} strokeWidth={2.25} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails (Miniaturas) */}
        {hasMultiple && (
          <div className="mt-3 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mt-4 sm:px-5 sm:pb-5 lg:px-8 lg:pb-8">
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
          COLUMNA DERECHA — Info
      ══════════════════════════════════════════ */}
      <div
        className={`flex w-full flex-col p-6 sm:w-1/2 sm:p-8 lg:p-10 ${
          isModal ? 'sm:overflow-hidden' : ''
        }`}
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        {/* SECCIÓN SUPERIOR: Título y Descripción */}
        <div className="shrink-0">
          <nav
            aria-label="Ruta de navegación"
            className="mb-4 flex flex-wrap items-center gap-1 uppercase"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              letterSpacing: 'var(--tracking-wide)',
              color: 'var(--text-muted)',
            }}
          >
            <Crumb label="Inicio" onClick={handleCrumbHome} />
            <ChevronRight size={10} aria-hidden="true" />
            <Crumb label="Catálogo" onClick={handleCrumbCatalog} />
            {rootCategoryName && (
              <>
                <ChevronRight size={10} aria-hidden="true" />
                <Crumb label={rootCategoryName} onClick={handleCrumbRoot} />
              </>
            )}
            {subCategoryName && (
              <>
                <ChevronRight size={10} aria-hidden="true" />
                <Crumb label={subCategoryName} onClick={handleCrumbSub} accent />
              </>
            )}
          </nav>

          <TitleTag
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
          </TitleTag>

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

        {/* SECCIÓN MEDIA: Características.
            En modal usa scroll aislado; en page fluye con altura natural. */}
        <div
          className={
            isModal
              ? 'my-5 min-h-0 flex-1 sm:overflow-y-auto modal-info-scroll sm:pr-2'
              : 'my-5'
          }
        >
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

        {/* SECCIÓN INFERIOR: Precio y Acciones */}
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

          {hasDiscount ? (
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-normal)',
                  color: 'var(--text-muted)',
                  textDecoration: 'line-through',
                }}
              >
                {formatPrice(product.calculatedPrice || 0)}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                  fontWeight: 'var(--font-bold)',
                  lineHeight: 1,
                  color: 'var(--text-accent)',
                }}
              >
                {formatPrice(product.finalPrice)}
              </span>
            </div>
          ) : (
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
          )}

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

          <div className="mt-5 flex items-stretch gap-3">
            <a
              href={buildProductWhatsAppUrl(product.name || 'Joya')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 cursor-pointer items-center justify-center gap-2.5 whitespace-nowrap border px-5 py-3.5 text-center transition-colors duration-200 hover:bg-[var(--bg-hover)]"
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
            <FavoriteButton
              productId={product.id}
              productStatus={product.status}
              variant="detail-icon"
            />
          </div>
        </div>
      </div>

      {/* ── Lightbox de Zoom — portaleado al body para escapar de cualquier
          contenedor con transform (panel del modal) u overflow. ── */}
      {createPortal(
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
                aria-label="Cerrar zoom"
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
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
};

// ─── Breadcrumb ──────────────────────────────────────────────────────────────

interface CrumbProps {
  /** Texto visible del ítem. */
  label: string;
  /** Acción al hacer click (navegar y/o filtrar el catálogo). */
  onClick: () => void;
  /** Resalta el ítem (color de acento + bold). Reservado para la subcategoría. */
  accent?: boolean;
}

/**
 * Ítem clickeable del breadcrumb del detalle de producto.
 */
const Crumb = ({ label, onClick, accent = false }: CrumbProps) => {
  const restColor = accent ? 'var(--text-accent)' : 'var(--text-muted)';

  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-sm transition-colors duration-200 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      style={{
        fontFamily: 'inherit',
        fontSize: 'inherit',
        letterSpacing: 'inherit',
        textTransform: 'inherit',
        background: 'none',
        border: 'none',
        padding: 0,
        color: restColor,
        fontWeight: accent ? 'var(--font-bold)' : 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--text-accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = restColor;
      }}
    >
      {label}
    </button>
  );
};
