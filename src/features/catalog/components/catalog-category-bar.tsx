/**
 * @file catalog-category-bar.tsx
 * @description Barra horizontal de categorías para la vista MÓVIL del catálogo.
 *
 * ─── Por qué existe ──────────────────────────────────────────────────────────
 * En móvil la única forma de cambiar de categoría era abrir el bottom sheet de
 * filtros (`CatalogMobileFiltersSheet`) y navegar un acordeón colapsado, donde
 * "desplegar" y "filtrar por toda la categoría" eran el mismo gesto ambiguo.
 * Resultado: los usuarios no descubrían que tocar "ANILLOS" ya filtra por todos
 * los anillos, y cada cambio de categoría costaba abrir un overlay.
 *
 * Esta barra expone las categorías raíz (+ "Todo") como una tira horizontal
 * siempre visible: un solo tap cambia de categoría sin abrir nada. El bottom
 * sheet queda para el filtrado fino (subcategoría + precio).
 *
 * Es el patrón estándar de ecommerce móvil (Mercado Libre, Zara, Mango): una
 * navegación de categorías persistente sobre el grid de productos.
 *
 * ─── Posicionamiento (`fixed`, no `sticky`) ──────────────────────────────────
 * `MainLayout` envuelve todo en un contenedor con `overflow-hidden`, lo que
 * invalida `position: sticky` en cualquier descendiente (mismo motivo
 * documentado en `catalog-nav-bar.tsx`). Por eso la barra usa `position: fixed`
 * apilada justo debajo del navbar principal:
 *
 *   top = --announcement-height + --navbar-height
 *
 * El contenido de la página se empuja hacia abajo con `<CatalogCategoryBarSpacer>`,
 * que debe montarse dentro del flujo del catálogo (ver `catalog-page.tsx`).
 *
 * ─── Estética (alineada con la marca KOB) ────────────────────────────────────
 * · Esquinas rectas — sin pills redondeados (estética editorial de KOB).
 * · Indicador activo = subrayado de acento de 2px, no relleno de color. Coherente
 *   con `CatalogNavBar` / `NavBarEdgeButton` de desktop.
 * · Tipografía `--font-ui`, uppercase, `--tracking-widest`, `--text-xs`.
 * · Scrollbar oculta; fades laterales como afordancia de "hay más a los lados".
 *
 * ─── Exclusiva de móvil ──────────────────────────────────────────────────────
 * `lg:hidden`. En desktop (≥1024px) las categorías ya viven en el sidebar
 * (`CatalogFilterSidebar`) y en la barra superior (`CatalogNavBar`).
 *
 * ─── Sincronía con el resto de filtros ───────────────────────────────────────
 * Lee y escribe el mismo `category.store` que el sheet y el sidebar. Tocar una
 * categoría aquí dispara `selectCatalogCategory(id)`, que resetea la subcategoría
 * a `null` (ver store) → muestra TODA la categoría, exactamente el resultado que
 * el usuario no lograba antes. El estado activo se mantiene sincronizado en
 * ambas UIs sin lógica extra.
 */

import { useEffect, useRef, useState } from 'react';
import { useCategoryStore } from '@/store/category.store';

// ─── Constantes de layout ──────────────────────────────────────────────────────

/**
 * Altura de la barra en px. Debe coincidir con `CatalogCategoryBarSpacer`.
 * 48px garantiza touch targets cómodos (≥44px) para cada categoría.
 */
const BAR_HEIGHT = 48;

// ─── Componente principal ───────────────────────────────────────────────────────

/**
 * Barra de categorías móvil — tira horizontal scrollable fija bajo el navbar.
 *
 * Siempre debe ir acompañada de `<CatalogCategoryBarSpacer />` dentro del flujo
 * del documento para que la barra fija no tape el primer elemento de la página.
 */
export const CatalogCategoryBar = () => {
  const {
    categories,
    isLoading,
    loadCategories,
    selectedCatalogCategoryId,
    selectCatalogCategory,
  } = useCategoryStore();

  /** Contenedor scrollable — para auto-centrar el activo y medir el scroll. */
  const trackRef = useRef<HTMLDivElement>(null);

  /** Estado de los fades laterales (afordancia de scroll horizontal). */
  const [edges, setEdges] = useState({ left: false, right: false });

  // Carga defensiva: el store deduplica si ya hay datos.
  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const rootCategories = categories.filter((cat) => cat.parentId === null);

  // ── Fades laterales: se muestran solo si hay contenido oculto a ese lado ──────
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const updateEdges = () => {
      const { scrollLeft, scrollWidth, clientWidth } = track;
      setEdges({
        left: scrollLeft > 1,
        right: scrollLeft + clientWidth < scrollWidth - 1,
      });
    };

    updateEdges();
    track.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);
    return () => {
      track.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
    };
  }, [rootCategories.length]);

  // ── Auto-centra la categoría activa cuando cambia ────────────────────────────
  // `block: 'nearest'` evita arrastrar el scroll vertical de la página.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const active = track.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [selectedCatalogCategoryId, rootCategories.length]);

  return (
    <nav
      aria-label="Categorías del catálogo"
      className="fixed right-0 left-0 border-b lg:hidden"
      style={{
        top: 'calc(var(--announcement-height) + var(--navbar-height))',
        height: `${BAR_HEIGHT}px`,
        // z-30: sobre el contenido de página (z-10), bajo el navbar (z-40) y
        // los overlays/sheets (z-50).
        zIndex: 30,
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Scrollbar oculta — afordancia visual la dan los fades, no la barra. */}
      <style>{`
        [data-catalog-category-track]::-webkit-scrollbar { display: none; }
      `}</style>

      <div
        className="relative mx-auto h-full"
        style={{ maxWidth: 'var(--content-max-width)' }}
      >
        {/* ── Fade izquierdo ── */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 z-10 h-full w-8 transition-opacity duration-200"
          style={{
            opacity: edges.left ? 1 : 0,
            background:
              'linear-gradient(to right, var(--bg-secondary), transparent)',
          }}
        />

        {/*
         * `pl-3` da aire al primer chip; sin padding a la derecha (`pr-0`) el
         * contenido sangra hasta el borde, de modo que en reposo el siguiente
         * chip asoma "a medias" en vez de quedar oculto tras un buffer vacío —
         * la señal más clara de que hay más categorías. El respiro del último
         * chip al hacer scroll hasta el final lo da su propio padding interno.
         */}
        <div
          ref={trackRef}
          data-catalog-category-track
          className="flex h-full items-stretch overflow-x-auto pl-3"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {isLoading && rootCategories.length === 0 ? (
            <CategoryPillSkeletons />
          ) : (
            <>
              {/* "Todo" — limpia el filtro de categoría (muestra todo el catálogo). */}
              <CategoryPill
                label="Todo"
                isActive={selectedCatalogCategoryId === null}
                onClick={() => selectCatalogCategory(null)}
              />

              {rootCategories.map((category) => (
                <CategoryPill
                  key={category.id}
                  label={category.name}
                  isActive={selectedCatalogCategoryId === category.id}
                  onClick={() => selectCatalogCategory(category.id)}
                />
              ))}
            </>
          )}
        </div>

        {/* ── Fade derecho ── */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 z-10 h-full w-8 transition-opacity duration-200"
          style={{
            opacity: edges.right ? 1 : 0,
            background:
              'linear-gradient(to left, var(--bg-secondary), transparent)',
          }}
        />
      </div>
    </nav>
  );
};

// ─── Spacer ─────────────────────────────────────────────────────────────────────

/**
 * Reserva en el flujo del documento el espacio que ocupa `CatalogCategoryBar`.
 *
 * Como la barra usa `position: fixed`, sale del flujo normal; este div de altura
 * equivalente empuja el contenido del catálogo hacia abajo para que la barra fija
 * no tape el primer elemento (breadcrumb / título).
 *
 * `lg:hidden` — debe acompañar al breakpoint de la propia barra: en desktop la
 * barra no se renderiza, por lo que el spacer tampoco debe reservar espacio.
 */
export const CatalogCategoryBarSpacer = () => (
  <div
    aria-hidden="true"
    className="lg:hidden"
    style={{ height: `${BAR_HEIGHT}px`, flexShrink: 0 }}
  />
);

// ─── Pill de categoría ───────────────────────────────────────────────────────────

interface CategoryPillProps {
  /** Texto visible de la categoría (o "Todo"). */
  label: string;
  /** Si esta categoría es la activa actualmente. */
  isActive: boolean;
  /** Selecciona esta categoría en el store. */
  onClick: () => void;
}

/**
 * Ítem individual de la barra de categorías.
 *
 * Estado activo señalado por subrayado de acento (2px) + texto en `--text-accent`
 * con peso bold — coherente con el lenguaje editorial de la marca. Sin relleno de
 * color ni esquinas redondeadas. `aria-current` comunica el activo a lectores de
 * pantalla; `data-active` permite a la barra localizarlo para auto-centrarlo.
 */
const CategoryPill = ({ label, isActive, onClick }: CategoryPillProps) => (
  <button
    type="button"
    onClick={onClick}
    data-active={isActive}
    aria-current={isActive ? 'true' : undefined}
    className="relative flex shrink-0 cursor-pointer items-center px-3 whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--accent)"
    style={{
      background: 'none',
      border: 'none',
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-xs)',
      fontWeight: isActive ? 'var(--font-bold)' : 'var(--font-medium)',
      letterSpacing: 'var(--tracking-widest)',
      textTransform: 'uppercase',
      color: isActive ? 'var(--text-accent)' : 'var(--text-secondary)',
    }}
  >
    {label}

    {/*
     * Subrayado inferior — indicador de estado activo.
     * Pegado al borde inferior de la barra (bottom: 0). Animado con scaleX para
     * una transición suave entre categorías sin layout shift.
     */}
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        bottom: 0,
        left: '0.75rem',
        right: '0.75rem',
        height: '2px',
        backgroundColor: 'var(--accent-vivid, var(--accent))',
        transformOrigin: 'center',
        transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
        transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    />
  </button>
);

// ─── Skeleton ────────────────────────────────────────────────────────────────────

/** Placeholders de carga mientras llegan las categorías. */
const CategoryPillSkeletons = () => (
  <div className="flex h-full items-center gap-6 px-1">
    {[44, 64, 56, 72, 50].map((w, i) => (
      <div
        key={i}
        className="h-3 animate-pulse rounded-sm"
        style={{ width: `${w}px`, backgroundColor: 'var(--bg-tertiary)' }}
      />
    ))}
  </div>
);
