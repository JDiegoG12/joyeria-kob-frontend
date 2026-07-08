/**
 * @file catalog-mobile-filters-drawer.tsx
 * @description Drawer lateral de filtros del catálogo para vista móvil.
 *
 * ─── Por qué un drawer lateral (y no un bottom sheet) ────────────────────────
 * El bottom sheet limitaba el alto útil (`max-h: 88dvh` con header/footer) y
 * estrenaba un patrón distinto al resto del sitio. Este drawer replica el patrón
 * y la estética del menú móvil (`mobile-menu.tsx`):
 *
 *   · Panel a pantalla completa de alto (`top-0 bottom-0`) → más espacio para
 *     categorías, subcategorías y precio sin scroll apretado.
 *   · Mismo overlay con `backdrop-blur`, mismo slide premium, misma tipografía.
 *     La experiencia de "panel que entra desde el borde" ya es familiar para el
 *     usuario gracias al menú hamburguesa.
 *
 * Se abre **desde la derecha** (no desde la izquierda como el menú): convención
 * de ecommerce donde la izquierda es para navegar y la derecha para refinar.
 *
 * ─── Contenido (filtrado fino) ───────────────────────────────────────────────
 * El cambio rápido de categoría raíz vive en `CatalogCategoryBar`. Aquí queda el
 * filtrado deliberado:
 *   · Filtros activos — chips removibles (un toque quita cada uno).
 *   · Categoría        — chips (incl. "Todo"); autosuficiente y sincronizado con
 *                        la barra vía `category.store`.
 *   · Subcategoría     — chips con "Todos" explícito (separa "ver toda la
 *                        categoría" de "elegir una subcategoría").
 *   · Precio           — slider reutilizado del sidebar de desktop.
 *
 * ─── Interacción / a11y ──────────────────────────────────────────────────────
 * Click overlay / Esc / ✕ / "Ver N productos" → cierra. Bloquea el scroll del
 * body, atrapa el foco dentro del diálogo y restaura el foco al disparador al
 * cerrar. Los filtros son reactivos vía store: cerrar no "aplica" nada.
 */

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from 'framer-motion';
import { Filter, X } from 'lucide-react';
import { useCategoryStore } from '@/store/category.store';
import {
  PriceRangeSlider,
  PriceSliderSkeleton,
} from '@/features/catalog/components/catalog-filter-sidebar';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Formatea un valor a pesos colombianos (mismo formato que el resto del catálogo). */
const formatCOP = (value: number): string =>
  `$${Math.round(value).toLocaleString('es-CO')}`;

// ─── Curvas de animación ───────────────────────────────────────────────────────

/**
 * easeOutQuart — entra rápido y asienta con suavidad. Ideal para *aparecer*.
 * Su cola es muy lenta, así que NO debe usarse para colapsar (se arrastra el
 * final y se percibe como "lag").
 */
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * easeIn — arranca lento y acelera al final. Ideal para *desaparecer*: el
 * colapso se cierra limpio en lugar de arrastrarse. Misma curva que la salida
 * del panel.
 */
const EASE_IN: [number, number, number, number] = [0.4, 0, 1, 1];

/**
 * Umbrales para cerrar el drawer arrastrando (swipe). El cierre se dispara si el
 * usuario arrastra más de `OFFSET` px hacia el borde de origen (la derecha) o si
 * suelta con velocidad superior a `VELOCITY` px/s (flick).
 */
const SWIPE_CLOSE_OFFSET = 80;
const SWIPE_CLOSE_VELOCITY = 400;

// ─── Variantes de animación ──────────────────────────────────────────────────

/** Overlay: fade con backdrop-blur (idéntico al menú móvil). */
const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
};

/** Panel lateral: slide horizontal desde la derecha con easing premium. */
const panelVariants: Variants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
  exit: {
    x: '100%',
    transition: { duration: 0.32, ease: EASE_IN },
  },
};

const reducedPanelVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface CatalogMobileFiltersDrawerProps {
  /** Si el drawer está visible. */
  isOpen: boolean;
  /** Callback de cierre — se invoca al click en overlay/✕, Esc, "Ver N", etc. */
  onClose: () => void;

  // ── Props del filtro de precio (estado en el padre) ──
  priceRange: { min: number; max: number } | null;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  onPriceCommit: (min: number | undefined, max: number | undefined) => void;

  /** Cantidad de productos que coinciden con los filtros activos. */
  productCount: number;

  /** Cantidad de filtros activos — informativo en la cabecera. */
  activeFiltersCount?: number;
}

// ─── Componente principal ──────────────────────────────────────────────────

export const CatalogMobileFiltersDrawer = ({
  isOpen,
  onClose,
  priceRange,
  minPrice,
  maxPrice,
  onPriceCommit,
  productCount,
  activeFiltersCount = 0,
}: CatalogMobileFiltersDrawerProps) => {
  const shouldReduceMotion = useReducedMotion();
  const {
    categories,
    isLoading,
    loadCategories,
    selectedCatalogCategoryId,
    selectedCatalogSubCategoryId,
    selectCatalogCategory,
    selectCatalogSubCategory,
  } = useCategoryStore();

  /** Panel del drawer — referencia para el focus-trap. */
  const panelRef = useRef<HTMLDivElement>(null);
  /** Elemento enfocado antes de abrir, para restaurar el foco al cerrar. */
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  /**
   * Zona del slider de precio. Su `pointerdown` se detiene aquí para que el
   * arrastre horizontal de los pulgares no active el swipe-to-close del panel.
   */
  const priceGuardRef = useRef<HTMLDivElement>(null);

  // Carga defensiva de categorías (el store deduplica).
  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  // ── Bloqueo del scroll de fondo mientras el drawer está abierto ─────────
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

  // ── Focus-trap del diálogo ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const getFocusable = (): HTMLElement[] => {
      const panel = panelRef.current;
      if (!panel) return [];
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
    };

    const raf = requestAnimationFrame(() => panelRef.current?.focus());

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleTab);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen]);

  // ── Aísla el slider de precio del swipe-to-close ────────────────────────
  /*
   * Framer Motion engancha el arrastre con listeners nativos sobre el panel, así
   * que un `onPointerDown` de React no bastaría para frenarlo. Detenemos la
   * propagación nativa del `pointerdown` dentro de la zona del slider: el gesto
   * horizontal mueve los pulgares del precio en vez del panel entero.
   */
  useEffect(() => {
    if (!isOpen) return;
    const node = priceGuardRef.current;
    if (!node) return;
    const stop = (e: PointerEvent) => e.stopPropagation();
    node.addEventListener('pointerdown', stop);
    return () => node.removeEventListener('pointerdown', stop);
  }, [isOpen, priceRange]);

  // ── Datos derivados de categorías ───────────────────────────────────────
  const rootCategories = categories.filter((cat) => cat.parentId === null);
  const activeCategory =
    rootCategories.find((c) => c.id === selectedCatalogCategoryId) ?? null;
  const subCategories = activeCategory?.children ?? [];
  const activeSubCategory =
    subCategories.find((s) => s.id === selectedCatalogSubCategoryId) ?? null;

  const hasPriceFilter =
    priceRange !== null &&
    (minPrice !== undefined || maxPrice !== undefined) &&
    (minPrice !== priceRange.min || maxPrice !== priceRange.max);

  const priceLabel =
    hasPriceFilter && minPrice !== undefined && maxPrice !== undefined
      ? `${formatCOP(minPrice)} – ${formatCOP(maxPrice)}`
      : null;

  const hasAnyActive =
    selectedCatalogCategoryId !== null ||
    selectedCatalogSubCategoryId !== null ||
    hasPriceFilter;

  /**
   * Limpia todos los filtros activos. No cierra el drawer — el usuario puede
   * querer reconfigurar tras limpiar.
   */
  const handleClearAll = () => {
    selectCatalogCategory(null);
    selectCatalogSubCategory(null);
    onPriceCommit(undefined, undefined);
  };

  const resolvedPanelVariants = shouldReduceMotion
    ? reducedPanelVariants
    : panelVariants;

  /*
   * Portal a `document.body`: el drawer debe quedar por encima del navbar
   * (`z-40` en el contexto raíz), igual que el menú móvil. Renderizado en su
   * sitio natural quedaría atrapado en el stacking context `relative z-10` del
   * contenedor de contenido de `MainLayout`, por lo que su `z-50` se resolvería
   * por debajo del navbar. El portal lo saca de ese subárbol.
   */
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Overlay ──────────────────────────────────────────────────── */}
          <motion.div
            key="filters-drawer-overlay"
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

          {/* ── Panel lateral ───────────────────────────────────────────── */}
          <motion.aside
            key="filters-drawer-panel"
            ref={panelRef}
            tabIndex={-1}
            variants={resolvedPanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            /*
             * Swipe-to-close (solo móvil; el panel está oculto en ≥lg).
             * Entra desde la derecha, así que se cierra arrastrándolo hacia ese
             * borde. `dragElastic` solo permite movimiento hacia la derecha (la
             * izquierda queda anclada en 0). El slider de precio neutraliza su
             * `pointerdown` para no competir con este gesto (ver efecto arriba).
             */
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.9, top: 0, bottom: 0 }}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (
                info.offset.x > SWIPE_CLOSE_OFFSET ||
                info.velocity.x > SWIPE_CLOSE_VELOCITY
              ) {
                onClose();
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Filtros del catálogo"
            className="fixed top-0 right-0 bottom-0 z-50 flex w-[min(90vw,22.5rem)] flex-col border-l outline-none lg:hidden"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-lg)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              touchAction: 'pan-y',
            }}
          >
            {/* ── Cabecera ──────────────────────────────────────────────── */}
            <div
              className="flex items-center justify-between border-b px-5 py-4"
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
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar filtros"
                className="flex h-10 w-10 cursor-pointer items-center justify-center transition-colors hover:bg-(--bg-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* ── Cuerpo scrollable ─────────────────────────────────────── */}
            {/*
             * `touch-action: pan-y` es clave para el swipe-to-close: este div es
             * su propio contenedor de scroll, así que gobierna los gestos en su
             * interior con independencia del panel. Sin esto, el navegador trata
             * el arrastre horizontal como scroll (no hay scroll-x → lo descarta y
             * cancela el puntero), y Framer nunca recibe el gesto. Con pan-y, solo
             * el desplazamiento vertical lo maneja el navegador; el horizontal se
             * delega a JS y el panel se puede arrastrar desde toda la zona.
             */}
            <div
              className="flex-1 space-y-7 overflow-y-auto px-5 py-6"
              style={{ overscrollBehaviorY: 'contain', touchAction: 'pan-y' }}
            >
              {/* ── Filtros activos (removibles) ── */}
              <AnimatePresence initial={false}>
                {hasAnyActive && (
                  <motion.section
                    key="active-filters"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{
                      opacity: 1,
                      height: 'auto',
                      transition: { duration: 0.28, ease: EASE_OUT },
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      transition: { duration: 0.2, ease: EASE_IN },
                    }}
                    style={{ overflow: 'hidden' }}
                    aria-label="Filtros activos"
                  >
                    <SectionTitle>Activos</SectionTitle>
                    <div className="flex flex-wrap gap-2">
                      {activeCategory && (
                        <ActiveChip
                          label={activeCategory.name}
                          onRemove={() => selectCatalogCategory(null)}
                        />
                      )}
                      {activeSubCategory && (
                        <ActiveChip
                          label={activeSubCategory.name}
                          onRemove={() => selectCatalogSubCategory(null)}
                        />
                      )}
                      {priceLabel && (
                        <ActiveChip
                          label={priceLabel}
                          onRemove={() => onPriceCommit(undefined, undefined)}
                        />
                      )}
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* ── Categoría ── */}
              <section aria-label="Filtrar por categoría">
                <SectionTitle>Categoría</SectionTitle>
                {isLoading && rootCategories.length === 0 ? (
                  <ChipSkeletons count={6} />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <FilterChip
                      label="Todo"
                      isActive={selectedCatalogCategoryId === null}
                      onClick={() => selectCatalogCategory(null)}
                    />
                    {rootCategories.map((category) => (
                      <FilterChip
                        key={category.id}
                        label={category.name}
                        isActive={selectedCatalogCategoryId === category.id}
                        onClick={() => selectCatalogCategory(category.id)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* ── Subcategoría — solo si la categoría activa tiene hijos ── */}
              <AnimatePresence initial={false}>
                {activeCategory && subCategories.length > 0 && (
                  <motion.section
                    key={`sub-${activeCategory.id}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{
                      opacity: 1,
                      height: 'auto',
                      transition: { duration: 0.28, ease: EASE_OUT },
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      transition: { duration: 0.2, ease: EASE_IN },
                    }}
                    style={{ overflow: 'hidden' }}
                    aria-label={`Subcategorías de ${activeCategory.name}`}
                  >
                    <SectionTitle>Subcategoría</SectionTitle>
                    <div className="flex flex-wrap gap-2">
                      {/*
                       * Chip explícito que filtra por TODA la categoría: separa
                       * "ver todo" de "elegir una subcategoría", el punto que el
                       * acordeón anterior confundía.
                       */}
                      <FilterChip
                        label="Todos"
                        isActive={selectedCatalogSubCategoryId === null}
                        onClick={() => selectCatalogSubCategory(null)}
                      />
                      {subCategories.map((sub) => (
                        <FilterChip
                          key={sub.id}
                          label={sub.name}
                          isActive={selectedCatalogSubCategoryId === sub.id}
                          onClick={() => selectCatalogSubCategory(sub.id)}
                        />
                      ))}
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* ── Precio ── */}
              <section aria-label="Filtrar por precio" ref={priceGuardRef}>
                <SectionTitle>Precio</SectionTitle>
                {priceRange === null ? (
                  <PriceSliderSkeleton />
                ) : (
                  <PriceRangeSlider
                    min={priceRange.min}
                    max={priceRange.max}
                    valueMin={minPrice ?? priceRange.min}
                    valueMax={maxPrice ?? priceRange.max}
                    onCommit={onPriceCommit}
                    showClear={false}
                  />
                )}
              </section>
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
                disabled={!hasAnyActive}
                className="flex cursor-pointer items-center justify-center border px-4 py-3 transition-opacity duration-200 hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) disabled:cursor-not-allowed disabled:opacity-40"
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
                className="flex cursor-pointer items-center justify-center px-4 py-3 transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent-text)"
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
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};

// ─── Subcomponentes ────────────────────────────────────────────────────────

/** Título de sección dentro del cuerpo del drawer. */
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3
    className="mb-3"
    style={{
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--font-semibold)',
      letterSpacing: 'var(--tracking-widest)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
    }}
  >
    {children}
  </h3>
);

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

/**
 * Chip de selección (categoría / subcategoría).
 *
 * Esquinas rectas (estética KOB). Activo = relleno navy con texto de acento;
 * inactivo = contorno. Altura mínima de 44px para cumplir el touch target.
 */
const FilterChip = ({ label, isActive, onClick }: FilterChipProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={isActive}
    className="inline-flex min-h-11 cursor-pointer items-center border px-4 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
    style={{
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-xs)',
      fontWeight: isActive ? 'var(--font-bold)' : 'var(--font-medium)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
      backgroundColor: isActive ? 'var(--accent)' : 'transparent',
      borderColor: isActive ? 'var(--accent)' : 'var(--border-strong)',
    }}
  >
    {label}
  </button>
);

interface ActiveChipProps {
  label: string;
  onRemove: () => void;
}

/**
 * Chip de filtro activo, removible. Un toque quita ese filtro concreto.
 * Relleno navy con ✕, coherente con el estado activo de `FilterChip`.
 */
const ActiveChip = ({ label, onRemove }: ActiveChipProps) => (
  <button
    type="button"
    onClick={onRemove}
    aria-label={`Quitar filtro ${label}`}
    className="inline-flex min-h-11 cursor-pointer items-center gap-2 px-4 transition-opacity duration-200 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent-text)"
    style={{
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--font-semibold)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      color: 'var(--accent-text)',
      backgroundColor: 'var(--accent)',
      border: 'none',
    }}
  >
    {label}
    <X size={13} strokeWidth={2.2} aria-hidden="true" />
  </button>
);

/** Placeholders de carga para los chips de categoría. */
const ChipSkeletons = ({ count }: { count: number }) => (
  <div className="flex flex-wrap gap-2">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="h-11 w-20 animate-pulse"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      />
    ))}
  </div>
);
