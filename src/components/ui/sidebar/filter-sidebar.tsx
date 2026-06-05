/**
 * @file filter-sidebar.tsx
 * @description Drawer de filtros del catálogo de Joyería KOB.
 *
 * ## Estrategia de posicionamiento
 * El panel ya no ocupa una columna fija del catálogo. Se renderiza como
 * drawer superpuesto desde la derecha:
 * - Móvil: 100% del ancho para foco total.
 * - Desktop: ancho controlado para mantener el catálogo visible detrás.
 *
 * ## Interacción con categorías
 *
 * Expandir/colapsar una categoría y filtrar por ella son acciones separadas:
 *
 * ```
 * Clic en cabecera de categoría → toggleExpanded()  (solo abre/cierra visualmente)
 * Clic en "Ver todos"           → selectAllInCategory()  (activa filtro completo)
 * Clic en subcategoría          → toggleSubCategory()    (filtro por subcategoría)
 * ```
 *
 * Los filtros seleccionados se mantienen aunque el usuario colapse la categoría.
 * Múltiples subcategorías pueden estar activas al mismo tiempo.
 *
 * ## Conexión con el store
 * Consume `useFilterStore` directamente. No recibe props de datos —
 * solo `isOpen` y `onClose` para el drawer.
 *
 * ## Uso
 * ```tsx
 * <FilterSidebar
 *   isOpen={sidebarOpen}
 *   onClose={() => setSidebarOpen(false)}
 * />
 * ```
 */

import { useEffect } from 'react';
import { X, SlidersHorizontal, ChevronDown, ChevronRight } from 'lucide-react';
import { useFilterStore } from '@/store/filter.store';
import type { JewelryCategory } from '@/features/catalog/types/filter.types';

interface FilterSidebarProps {
  /** Si el drawer está abierto. */
  isOpen: boolean;
  /** Callback para cerrar el drawer. */
  onClose: () => void;
}

/**
 * Drawer de filtros del catálogo.
 * Carga las categorías al montarse y reacciona al store de filtros.
 */
export const FilterSidebar = ({ isOpen, onClose }: FilterSidebarProps) => {
  const {
    categories,
    isLoading,
    error,
    filters,
    loadCategories,
    clearFilters,
  } = useFilterStore();

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const hasActiveFilters =
    filters.categoryId !== null || filters.subCategoryIds.length > 0;

  return (
    <>
      {/* ── Overlay oscuro ───────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        style={{ backgroundColor: 'var(--bg-overlay)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panel principal del drawer ────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 right-0 z-[60] flex h-dvh w-full flex-col
          overflow-hidden border-l border-[var(--border-color)] dark:border-white/5
          backdrop-blur-2xl
          transition-transform duration-300 ease-in-out
          sm:max-w-[420px]
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--bg-secondary) 86%, transparent)',
          boxShadow: '0 34px 120px rgba(0, 0, 0, 0.22)',
          backdropFilter: 'blur(28px) saturate(170%)',
          WebkitBackdropFilter: 'blur(28px) saturate(170%)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Filtros del catálogo"
      >
        {/* ── Cabecera: título + botones de acción ─────────────────────────────── */}
        <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-[var(--border-color)] px-6 py-6 dark:border-white/5">
          <div className="min-w-0">
            <span
              className="mb-2 inline-flex items-center gap-2"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-bold)',
                color: 'var(--accent)',
                letterSpacing: 'var(--tracking-wide)',
                textTransform: 'uppercase',
              }}
            >
              <SlidersHorizontal size={15} />
              Selección privada
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--font-bold)',
                lineHeight: 'var(--leading-tight)',
                color: 'var(--text-primary)',
              }}
            >
              Filtros
            </h2>
            <p
              className="mt-2"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              Refina el catálogo por categoría y colección.
            </p>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            {/* Botón limpiar — solo cuando hay filtros activos */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="cursor-pointer rounded-md px-3 py-2 transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--accent)',
                  fontWeight: 'var(--font-medium)',
                }}
              >
                Limpiar
              </button>
            )}

            <button
              onClick={onClose}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Cerrar filtros"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Cuerpo: lista de categorías con scroll propio ────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          {/* Estado: cargando */}
          {isLoading && (
            <div className="flex flex-col gap-3 px-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-md"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                />
              ))}
            </div>
          )}

          {/* Estado: error de carga */}
          {error && !isLoading && (
            <div className="px-5">
              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-error)',
                }}
              >
                {error}
              </p>
              <button
                onClick={loadCategories}
                className="mt-2"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--accent)',
                }}
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Estado: datos listos */}
          {!isLoading && !error && (
            <ul className="flex flex-col gap-2">
              {categories.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  onClose={onClose}
                />
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
};

// ─── Subcomponente: ítem de categoría con subcategorías ──────────────────────

interface CategoryItemProps {
  /** Categoría principal a renderizar con sus subcategorías. */
  category: JewelryCategory;
  /** Callback para cerrar el cajón móvil si fuera necesario. */
  onClose: () => void;
}

/**
 * Ítem de categoría principal con sus subcategorías colapsables.
 *
 * ## Comportamiento
 * - Pulsar la cabecera de la categoría la expande/colapsa visualmente
 *   sin tocar los filtros activos.
 * - Dentro de la categoría expandida aparece la opción "Ver todos"
 *   que aplica el filtro para toda la categoría.
 * - Cada subcategoría tiene su propio checkbox — se pueden activar
 *   varias al mismo tiempo.
 * - Los filtros persisten aunque el usuario colapse la categoría.
 *
 * @internal Solo se usa dentro de `FilterSidebar`.
 */
const CategoryItem = ({ category }: CategoryItemProps) => {
  const {
    filters,
    expandedCategoryId,
    toggleExpanded,
    selectAllInCategory,
    toggleSubCategory,
  } = useFilterStore();

  const isExpanded = expandedCategoryId === category.id;

  /**
   * Indica si esta categoría tiene algún filtro activo (todos o subcategorías).
   * Se usa para mostrar el indicador visual en la cabecera aunque esté colapsada.
   */
  const hasActiveFilter =
    filters.categoryId === category.id &&
    (filters.showAllInCategory || filters.subCategoryIds.length > 0);

  /** Cuenta los filtros activos para mostrar en el badge. */
  const activeCount =
    filters.categoryId === category.id
      ? filters.showAllInCategory
        ? 'Todos'
        : filters.subCategoryIds.length > 0
          ? filters.subCategoryIds.length
          : null
      : null;

  const isAllSelected =
    filters.categoryId === category.id && filters.showAllInCategory;

  return (
    <li>
      {/* ── Cabecera de la categoría: expande/colapsa visualmente ── */}
      <button
        onClick={() => toggleExpanded(category.id)}
        className="flex w-full cursor-pointer items-center justify-between rounded-md px-4 py-3.5 transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        style={{
          backgroundColor: hasActiveFilter
            ? 'var(--accent-subtle)'
            : 'transparent',
          boxShadow: hasActiveFilter
            ? 'inset 3px 0 0 var(--accent), inset 0 0 0 1px color-mix(in srgb, var(--accent) 24%, transparent)'
            : 'inset 3px 0 0 transparent',
        }}
      >
        <span className="flex items-center gap-2">
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-base)',
              fontWeight: hasActiveFilter
                ? 'var(--font-semibold)'
                : 'var(--font-medium)',
              color: hasActiveFilter ? 'var(--accent)' : 'var(--text-primary)',
            }}
          >
            {category.label}
          </span>

          {/* Badge de filtros activos — visible aunque la categoría esté colapsada */}
          {activeCount !== null && (
            <span
              className="flex items-center justify-center rounded-full px-1.5 py-0.5"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-text)',
                fontSize: '0.65rem',
                minWidth: '1.2rem',
              }}
            >
              {activeCount}
            </span>
          )}
        </span>

        {isExpanded ? (
          <ChevronDown
            size={16}
            style={{
              color: hasActiveFilter ? 'var(--accent)' : 'var(--text-muted)',
            }}
          />
        ) : (
          <ChevronRight
            size={16}
            style={{
              color: hasActiveFilter ? 'var(--accent)' : 'var(--text-muted)',
            }}
          />
        )}
      </button>

      {/* ── Contenido expandido: "Ver todos" + subcategorías ─────── */}
      {isExpanded && (
        <ul className="py-1">
          {/* Opción "Ver todos" — filtra por la categoría completa */}
          <li>
            <button
              onClick={() => selectAllInCategory(category.id)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-md py-2.5 pl-8 pr-5 transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              style={{
                backgroundColor: isAllSelected
                  ? 'var(--bg-active)'
                  : 'transparent',
              }}
            >
              {/* Checkbox circular para diferenciar de las subcategorías */}
              <span
                className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: isAllSelected
                    ? 'var(--accent)'
                    : 'transparent',
                  border: isAllSelected
                    ? '2px solid var(--accent)'
                    : '2px solid var(--border-strong)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {isAllSelected && (
                  <span
                    className="block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--accent-text)' }}
                  />
                )}
              </span>

              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  color: isAllSelected
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                  fontWeight: isAllSelected
                    ? 'var(--font-semibold)'
                    : 'var(--font-medium)',
                  fontStyle: 'italic',
                }}
              >
                Ver todos
              </span>
            </button>
          </li>

          {/* Subcategorías individuales con checkbox cuadrado */}
          {category.subCategories.map((sub) => {
            const isSubActive =
              filters.categoryId === category.id &&
              filters.subCategoryIds.includes(sub.id);

            return (
              <li key={sub.id}>
                <button
                  onClick={() => toggleSubCategory(sub.id, category.id)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-md py-2.5 pl-8 pr-5 transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  style={{
                    backgroundColor: isSubActive
                      ? 'var(--bg-active)'
                      : 'transparent',
                  }}
                >
                  {/* Checkbox cuadrado para subcategorías */}
                  <span
                    className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded"
                    style={{
                      backgroundColor: isSubActive
                        ? 'var(--accent)'
                        : 'transparent',
                      border: isSubActive
                        ? '2px solid var(--accent)'
                        : '2px solid var(--border-strong)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {isSubActive && (
                      <svg
                        width="9"
                        height="7"
                        viewBox="0 0 9 7"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M1 3.5L3.5 6L8 1"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>

                  <span
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 'var(--text-sm)',
                      color: isSubActive
                        ? 'var(--text-primary)'
                        : 'var(--text-secondary)',
                      fontWeight: isSubActive
                        ? 'var(--font-medium)'
                        : 'var(--font-normal)',
                    }}
                  >
                    {sub.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
};
