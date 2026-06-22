/**
 * @file product-breadcrumb.tsx
 * @description Breadcrumb del detalle de producto, COMPARTIDO entre el modal del
 * catálogo (`ProductDetailContent` en `layout="modal"`) y la página completa
 * (`ProductPage`, ruta `/producto/:slug`).
 *
 * Se extrajo del propio `ProductDetailContent` para poder reposicionarlo: en el
 * modal sigue viviendo dentro de la columna de info (salida idéntica a la
 * original), mientras que en la página se monta a nivel de página, con aire y
 * en una sola línea con scroll horizontal en móvil.
 *
 * ## Navegación por `mode`
 * - `modal`: cada ítem cierra el modal (`onClose`) y, cuando aplica, fija la
 *   categoría/subcategoría en el store; el catálogo subyacente se re-filtra solo.
 * - `page`: no hay catálogo debajo, así que los ítems fijan el store y navegan
 *   a la ruta destino (`/` o `/catalogo`).
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useCategoryStore } from '@/store/category.store';
import type { Product } from '@/features/catalog/types/product.types';

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProductBreadcrumbProps {
  /** Producto del que se deriva la ruta de categorías. */
  product: Product;
  /**
   * Contexto de uso. `modal` cierra el modal en cada salto; `page` navega a la
   * ruta destino y aplica un layout con más aire + scroll horizontal en móvil.
   */
  mode: 'modal' | 'page';
  /** Cierre del modal. Solo se usa (y se espera) en `mode="modal"`. */
  onClose?: () => void;
}

// ─── Componente ──────────────────────────────────────────────────────────────

/**
 * Ruta de navegación "Inicio › Catálogo › Categoría › Subcategoría" del detalle
 * de producto. Cada ítem aplica el filtro correspondiente en el catálogo.
 */
export const ProductBreadcrumb = ({
  product,
  mode,
  onClose,
}: ProductBreadcrumbProps) => {
  const isModal = mode === 'modal';
  // En `page` el breadcrumb es de una sola línea con scroll, así que los
  // separadores no deben encogerse; en `modal` se conserva el markup original.
  const chevronClass = isModal ? undefined : 'shrink-0';

  // ── Hint de scroll (solo `page`) ──────────────────────────────────────────
  // En móvil la ruta completa puede no caber. Detectamos el desbordamiento real
  // y, solo entonces, aplicamos una máscara que desvanece el borde derecho para
  // insinuar que hay más contenido al hacer scroll (sin afectar rutas cortas).
  const scrollRef = useRef<HTMLElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);

  const rootCategoryName =
    product.category?.parent?.name ?? product.category?.name ?? null;
  const subCategoryName = product.category?.parent
    ? product.category.name
    : null;

  useEffect(() => {
    if (isModal) return;
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollWidth > el.clientWidth + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isModal, rootCategoryName, subCategoryName]);

  const SCROLL_MASK =
    'linear-gradient(to right, #000 0%, #000 88%, transparent 100%)';

  const navigate = useNavigate();
  const { selectCatalogCategory, selectCatalogSubCategory } =
    useCategoryStore();

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
      {/* Oculta la barra de scroll del breadcrumb en `page` (móvil) sin perder
          el desplazamiento horizontal. */}
      {!isModal && (
        <style>{`
          .product-breadcrumb-scroll::-webkit-scrollbar { display: none; }
        `}</style>
      )}

      <nav
        ref={isModal ? undefined : scrollRef}
        aria-label="Ruta de navegación"
        className={
          isModal
            ? 'mb-4 flex flex-wrap items-center gap-1 uppercase'
            : 'product-breadcrumb-scroll flex min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto whitespace-nowrap uppercase'
        }
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-xs)',
          letterSpacing: 'var(--tracking-wide)',
          color: 'var(--text-muted)',
          ...(isModal
            ? {}
            : {
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
                ...(overflowing
                  ? { maskImage: SCROLL_MASK, WebkitMaskImage: SCROLL_MASK }
                  : {}),
              }),
        }}
      >
        <Crumb label="Inicio" onClick={handleCrumbHome} noShrink={!isModal} />
        <ChevronRight size={10} aria-hidden="true" className={chevronClass} />
        <Crumb
          label="Catálogo"
          onClick={handleCrumbCatalog}
          noShrink={!isModal}
        />
        {rootCategoryName && (
          <>
            <ChevronRight size={10} aria-hidden="true" className={chevronClass} />
            <Crumb
              label={rootCategoryName}
              onClick={handleCrumbRoot}
              noShrink={!isModal}
            />
          </>
        )}
        {subCategoryName && (
          <>
            <ChevronRight size={10} aria-hidden="true" className={chevronClass} />
            <Crumb
              label={subCategoryName}
              onClick={handleCrumbSub}
              accent
              noShrink={!isModal}
            />
          </>
        )}
      </nav>
    </>
  );
};

// ─── Crumb ───────────────────────────────────────────────────────────────────

interface CrumbProps {
  /** Texto visible del ítem. */
  label: string;
  /** Acción al hacer click (navegar y/o filtrar el catálogo). */
  onClick: () => void;
  /** Resalta el ítem (color de acento + bold). Reservado para la subcategoría. */
  accent?: boolean;
  /**
   * Evita que el ítem se encoja. Se usa solo en `mode="page"` (breadcrumb de
   * una línea con scroll). En `modal` se omite para conservar el markup original.
   */
  noShrink?: boolean;
}

/**
 * Ítem clickeable del breadcrumb del detalle de producto.
 */
const Crumb = ({ label, onClick, accent = false, noShrink = false }: CrumbProps) => {
  const restColor = accent ? 'var(--text-accent)' : 'var(--text-muted)';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${noShrink ? 'shrink-0 ' : ''}cursor-pointer rounded-sm transition-colors duration-200 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]`}
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
