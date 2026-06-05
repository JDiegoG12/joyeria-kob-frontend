/**
 * @file catalog-mobile-filters-sheet.tsx
 * @description Bottom sheet de filtros del catálogo para vista móvil.
 *
 * ─── Por qué un bottom sheet ────────────────────────────────────────────────
 * En móvil el sidebar lateral de filtros (`CatalogFilterSidebar`) deja de
 * caber junto al grid de productos. Un bottom sheet:
 *
 * · Usa el patrón estándar de ecommerce premium (Cartier, Pandora, Mango).
 * · Mantiene los productos como protagonistas — los filtros se invocan a
 *   demanda y no compiten por espacio.
 * · Permite reusar al 100% el `CatalogFilterSidebar` existente (categorías
 *   acordeón + slider de precio) sin duplicar lógica ni UI.
 * · Encaja con la estética de `category-drawer.tsx`, que también usa hojas
 *   inferiores con swipe-to-dismiss para el panel admin.
 *
 * ─── Anatomía ───────────────────────────────────────────────────────────────
 * 1. Overlay con `backdrop-blur` y fade — desfocaliza la página detrás.
 * 2. Hoja inferior:
 *    · Drag handle (barra horizontal) — afordancia visual de "arrastrable".
 *    · Cabecera fija con título "Filtros" + botón ✕.
 *    · Cuerpo scrollable con `<CatalogFilterSidebar hideTitle />`.
 *    · Footer sticky con dos acciones:
 *        · "Limpiar todo" (secundaria) → resetea categorías + precio.
 *        · "Ver N productos" (primaria) → cierra el sheet (los filtros ya
 *          son reactivos a través del store, no hace falta "aplicar").
 * 3. `padding-bottom: env(safe-area-inset-bottom)` para no chocar con la
 *    barra inferior de iOS.
 *
 * ─── Interacción ────────────────────────────────────────────────────────────
 * · Click en overlay      → cierra.
 * · Tecla `Esc`           → cierra.
 * · Botón ✕               → cierra.
 * · Swipe down >120px o   → cierra (gesto natural en hojas inferiores).
 *   velocidad >500
 * · Botón "Ver N productos" → cierra.
 *
 * ─── Animaciones ────────────────────────────────────────────────────────────
 * Easing premium (`[0.22, 1, 0.36, 1]`) para el slide vertical, fade para el
 * overlay. `prefers-reduced-motion` reduce a un fade simple sin movimiento.
 *
 * Mientras el sheet está abierto se bloquea el scroll del `<body>` para
 * evitar que la página de fondo se desplace cuando el usuario gestiona
 * el sheet.
 */

import { useEffect } from 'react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
  type Variants,
} from 'framer-motion';
import { Filter, X } from 'lucide-react';
import { useCategoryStore } from '@/store/category.store';
import { CatalogFilterSidebar } from '@/features/catalog/components/catalog-filter-sidebar';

// ─── Constantes ──────────────────────────────────────────────────────────────

/** Distancia mínima de arrastre vertical para cerrar el sheet. */
const SWIPE_CLOSE_PX = 120;

/** Velocidad mínima de arrastre vertical para cerrar el sheet. */
const SWIPE_CLOSE_VELOCITY = 500;

// ─── Variantes de animación ──────────────────────────────────────────────────

/** Overlay: fade simple con backdrop-blur. */
const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.28, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
};

/**
 * Hoja inferior: slide vertical con easing premium.
 *
 * El `when: 'beforeChildren'` no es necesario aquí porque no hay stagger
 * interno — el sheet aparece como un bloque sólido.
 */
const sheetVariants: Variants = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    y: '100%',
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
  },
};

const reducedSheetVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCOP = (value: number): string =>
  `$${Math.round(value).toLocaleString('es-CO')}`;

// ─── Props ──────────────────────────────────────────────────────────────────

interface CatalogMobileFiltersSheetProps {
  /** Si el sheet está visible. */
  isOpen: boolean;
  /** Callback de cierre — se invoca al click en overlay/✕, swipe, Esc, etc. */
  onClose: () => void;

  // ── Mismas props que `CatalogFilterSidebar` para precio ──
  priceRange: { min: number; max: number } | null;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  onPriceCommit: (min: number | undefined, max: number | undefined) => void;

  /**
   * Cantidad de productos que coinciden con los filtros activos.
   * Se muestra en el botón primario "Ver N productos" del footer.
   */
  productCount: number;

  /** Cantidad de filtros activos — opcional, solo informativo en la cabecera. */
  activeFiltersCount?: number;
}

// ─── Componente principal ──────────────────────────────────────────────────

/**
 * Bottom sheet con todos los filtros del catálogo (categorías + precio)
 * para la vista móvil. Reutiliza `CatalogFilterSidebar` por dentro y le
 * pasa `hideTitle` para evitar el `<h1>CATÁLOGO</h1>` redundante.
 */
export const CatalogMobileFiltersSheet = ({
  isOpen,
  onClose,
  priceRange,
  minPrice,
  maxPrice,
  onPriceCommit,
  productCount,
  activeFiltersCount = 0,
}: CatalogMobileFiltersSheetProps) => {
  const shouldReduceMotion = useReducedMotion();
  const { selectCatalogCategory, selectCatalogSubCategory } = useCategoryStore();

  // ── Bloqueo del scroll de fondo mientras el sheet está abierto ──────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ── Cierre por tecla Esc ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  /**
   * Limpia todos los filtros activos del catálogo.
   *
   * - Categorías: usa el store directamente (mismo flujo que el botón
   *   "Limpiar filtros" del propio sidebar).
   * - Precio: delega en el padre vía `onPriceCommit(undefined, undefined)`,
   *   que es el contrato existente para "sin filtro de precio".
   *
   * No cierra el sheet — el usuario puede querer ajustar otra cosa después
   * de limpiar.
   */
  const handleClearAll = () => {
    selectCatalogCategory(null);
    selectCatalogSubCategory(null);
    onPriceCommit(undefined, undefined);
  };

  /**
   * Detección de swipe-to-dismiss.
   *
   * Solo se considera el eje Y. Si el usuario arrastra hacia abajo más de
   * `SWIPE_CLOSE_PX` o lo hace con velocidad >`SWIPE_CLOSE_VELOCITY`, se
   * cierra el sheet. Movimiento hacia arriba se ignora (la `dragElastic`
   * superior a 0 ya da feedback visual de "no hay nada arriba").
   */
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.y > SWIPE_CLOSE_PX || info.velocity.y > SWIPE_CLOSE_VELOCITY) {
      onClose();
    }
  };

  // Texto auxiliar de rango de precio activo, para mostrar como pista en el header
  const priceHint =
    priceRange &&
    minPrice !== undefined &&
    maxPrice !== undefined &&
    (minPrice !== priceRange.min || maxPrice !== priceRange.max)
      ? `${formatCOP(minPrice)} – ${formatCOP(maxPrice)}`
      : null;

  const resolvedSheetVariants = shouldReduceMotion
    ? reducedSheetVariants
    : sheetVariants;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Overlay ──────────────────────────────────────────────────── */}
          <motion.div
            key="filters-sheet-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-50 backdrop-blur-sm lg:hidden"
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--bg-overlay) 78%, transparent)',
            }}
            aria-hidden="true"
          />

          {/* ── Hoja inferior ───────────────────────────────────────────── */}
          <motion.div
            key="filters-sheet-panel"
            variants={resolvedSheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            // Drag solo en eje Y y solo con elasticidad hacia abajo:
            // permite "tirar" para cerrar, pero el tope superior es rígido.
            drag={shouldReduceMotion ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.25 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            role="dialog"
            aria-modal="true"
            aria-label="Filtros del catálogo"
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col border-t lg:hidden"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              borderTopLeftRadius: 'var(--radius-lg)',
              borderTopRightRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
              // Reserva espacio para la safe-area inferior de iOS
              // (barra de gestos del iPhone). Sin esto, el footer queda tapado.
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* ── Drag handle (afordancia de arrastre) ──────────────────── */}
            <div
              className="flex justify-center pt-3 pb-1"
              aria-hidden="true"
            >
              <span
                className="block h-1 w-10 rounded-full"
                style={{ backgroundColor: 'var(--border-strong)', opacity: 0.6 }}
              />
            </div>

            {/* ── Cabecera ──────────────────────────────────────────────── */}
            <div
              className="flex items-center justify-between border-b px-5 py-3"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Filter
                  size={16}
                  strokeWidth={1.8}
                  style={{ color: 'var(--text-accent)' }}
                  aria-hidden="true"
                />
                <h2
                  className="uppercase"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-bold)',
                    letterSpacing: 'var(--tracking-widest)',
                    color: 'var(--text-accent)',
                  }}
                >
                  Filtros
                </h2>
                {/*
                 * Pista visual del número de filtros activos. Solo se muestra
                 * cuando hay alguno; en estado limpio el header queda más
                 * tranquilo.
                 */}
                {activeFiltersCount > 0 && (
                  <span
                    className="ml-1 inline-flex h-5 min-w-5 items-center justify-center px-1.5"
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '10px',
                      fontWeight: 'var(--font-bold)',
                      letterSpacing: 'var(--tracking-wide)',
                      color: 'var(--accent-text)',
                      backgroundColor: 'var(--accent)',
                      borderRadius: '999px',
                      lineHeight: 1,
                    }}
                    aria-label={`${activeFiltersCount} filtros activos`}
                  >
                    {activeFiltersCount}
                  </span>
                )}
                {/* Pista textual opcional del rango de precio activo. */}
                {priceHint && (
                  <span
                    className="ml-2 truncate"
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                      letterSpacing: 'var(--tracking-wide)',
                    }}
                  >
                    {priceHint}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar filtros"
                className="flex h-9 w-9 cursor-pointer items-center justify-center transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* ── Cuerpo scrollable ─────────────────────────────────────── */}
            {/*
             * `overflow-y-auto` con `overscroll-behavior: contain` evita que
             * el rebote del scroll del sheet "tire" del scroll del body.
             */}
            <div
              className="flex-1 overflow-y-auto px-5 py-5"
              style={{ overscrollBehaviorY: 'contain' }}
            >
              <CatalogFilterSidebar
                priceRange={priceRange}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onPriceCommit={onPriceCommit}
                hideTitle
              />
            </div>

            {/* ── Footer sticky ─────────────────────────────────────────── */}
            <div
              className="grid grid-cols-2 gap-3 border-t px-5 py-4"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <button
                type="button"
                onClick={handleClearAll}
                className="flex cursor-pointer items-center justify-center border px-4 py-3 transition-opacity duration-200 hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                style={{
                  borderColor: 'var(--border-strong)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-semibold)',
                  letterSpacing: 'var(--tracking-widest)',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  background: 'transparent',
                }}
              >
                Limpiar todo
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex cursor-pointer items-center justify-center px-4 py-3 transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-text)]"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-bold)',
                  letterSpacing: 'var(--tracking-widest)',
                  textTransform: 'uppercase',
                  color: 'var(--accent-text)',
                  backgroundColor: 'var(--accent)',
                  border: 'none',
                }}
              >
                {productCount === 1
                  ? 'Ver 1 producto'
                  : `Ver ${productCount} productos`}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
