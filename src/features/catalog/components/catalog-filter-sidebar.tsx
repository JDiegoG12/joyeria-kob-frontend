/**
 * @file catalog-filter-sidebar.tsx
 * @description Sidebar de filtros del catálogo público de Joyería KOB.
 *
 * ## Secciones
 * 1. Categorías — acordeón con animación de altura suave (Framer Motion)
 * 2. Filtrar por precio — slider de rango dual que se aplica al soltar (onMouseUp / onTouchEnd)
 *
 * ## Comportamiento del slider de precio
 * - Los valores locales (`localMin` / `localMax`) siguen el pulgar en tiempo real
 *   para dar feedback visual inmediato sin disparar peticiones.
 * - La petición al backend se lanza SOLO al soltar el slider (`onCommit`).
 * - Si el rango aún no está disponible (primera carga), el slider se muestra en skeleton.
 * - Un botón "Limpiar" debajo del slider resetea ambos valores al rango completo.
 *
 * ## Props del PriceRangeSlider
 * | Prop      | Tipo                          | Descripción                               |
 * |-----------|-------------------------------|-------------------------------------------|
 * | min       | number                        | Valor mínimo absoluto (del backend)       |
 * | max       | number                        | Valor máximo absoluto (del backend)       |
 * | valueMin  | number                        | Valor mínimo activo (estado padre)        |
 * | valueMax  | number                        | Valor máximo activo (estado padre)        |
 * | onCommit  | (min: number, max: number)=>void | Callback al soltar el slider           |
 */

import { AnimatePresence, motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useCategoryStore } from '@/store/category.store';
import type { Category } from '@/features/categories/types/category.types';

// ─── Variantes de animación ───────────────────────────────────────────────────

const accordionVariants: Variants = {
  open: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
  },
};

const subItemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.22, ease: 'easeOut' },
  }),
};

const clearButtonVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22 } },
  exit: { opacity: 0, y: 4, transition: { duration: 0.15 } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCOP = (value: number): string =>
  `$${Math.round(value).toLocaleString('es-CO')}`;

// ─── Props del Sidebar ────────────────────────────────────────────────────────

interface CatalogFilterSidebarProps {
  /** Rango real de precios devuelto por el backend. `null` mientras carga. */
  priceRange: { min: number; max: number } | null;
  /** Precio mínimo actualmente aplicado como filtro. */
  minPrice: number | undefined;
  /** Precio máximo actualmente aplicado como filtro. */
  maxPrice: number | undefined;
  /**
   * Callback que se llama SOLO al soltar el slider.
   * Recibe `undefined` en ambos valores cuando se limpia el filtro.
   */
  onPriceCommit: (min: number | undefined, max: number | undefined) => void;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export const CatalogFilterSidebar = ({
  priceRange,
  minPrice,
  maxPrice,
  onPriceCommit,
}: CatalogFilterSidebarProps) => {
  const {
    categories,
    isLoading,
    loadCategories,
    selectedCatalogCategoryId,
    selectedCatalogSubCategoryId,
    selectCatalogCategory,
    selectCatalogSubCategory,
  } = useCategoryStore();

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const rootCategories = categories.filter((cat) => cat.parentId === null);
  const hasActiveFilter =
    selectedCatalogCategoryId !== null || selectedCatalogSubCategoryId !== null;

  const hasPriceFilter =
    priceRange !== null &&
    (minPrice !== undefined || maxPrice !== undefined) &&
    (minPrice !== priceRange.min || maxPrice !== priceRange.max);

  return (
    <aside aria-label="Filtros del catálogo" className="w-full select-none">
      {/* ── Título ── */}
      <div className="mb-8">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.6rem, 2.5vw, var(--text-3xl))',
            fontWeight: 'var(--font-bold)',
            letterSpacing: 'var(--tracking-display)',
            lineHeight: 'var(--leading-tight)',
            color: 'var(--text-accent)',
          }}
        >
          CATÁLOGO
        </h1>
        <div
          className="mt-3 h-px w-full"
          style={{
            background:
              'linear-gradient(to right, var(--border-strong) 60%, transparent)',
          }}
          aria-hidden="true"
        />
      </div>

      {/* ── Lista de categorías ── */}
      <nav aria-label="Categorías del catálogo">
        {isLoading ? (
          <CategorySkeletonList />
        ) : (
          <ul role="list" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {rootCategories.map((category, idx) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: idx * 0.06,
                  duration: 0.3,
                  ease: 'easeOut',
                }}
              >
                <CategoryAccordionItem
                  category={category}
                  isExpanded={selectedCatalogCategoryId === category.id}
                  selectedCategoryId={selectedCatalogCategoryId}
                  selectedSubCategoryId={selectedCatalogSubCategoryId}
                  onSelectCategory={selectCatalogCategory}
                  onSelectSubCategory={selectCatalogSubCategory}
                />
              </motion.div>
            ))}
          </ul>
        )}
      </nav>

      {/* ── Botón limpiar filtros de categoría ── */}
      <AnimatePresence>
        {hasActiveFilter && (
          <motion.div
            variants={clearButtonVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mt-7"
          >
            <div
              className="mb-5 h-px w-full"
              style={{ backgroundColor: 'var(--border-color)' }}
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => selectCatalogCategory(null)}
              className="group flex cursor-pointer items-center gap-2 transition-opacity duration-150 hover:opacity-70"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-semibold)',
                letterSpacing: 'var(--tracking-widest)',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              <span
                className="flex h-4 w-4 items-center justify-center border transition-colors duration-150 group-hover:border-current"
                style={{
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-muted)',
                }}
                aria-hidden="true"
              >
                <X size={10} strokeWidth={2.5} />
              </span>
              Limpiar filtros
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Separador antes del filtro de precio ── */}
      <div
        className="my-8 h-px w-full"
        style={{
          background:
            'linear-gradient(to right, var(--border-strong) 60%, transparent)',
        }}
        aria-hidden="true"
      />

      {/* ── Sección de filtro de precio ── */}
      <section aria-label="Filtrar por precio">
        {/* Título de sección */}
        <h2
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-semibold)',
            letterSpacing: 'var(--tracking-widest)',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            marginBottom: '1.25rem',
          }}
        >
          FILTRAR POR
        </h2>

        {priceRange === null ? (
          <PriceSliderSkeleton />
        ) : (
          <PriceRangeSlider
            min={priceRange.min}
            max={priceRange.max}
            valueMin={minPrice ?? priceRange.min}
            valueMax={maxPrice ?? priceRange.max}
            onCommit={onPriceCommit}
            hasPriceFilter={hasPriceFilter}
          />
        )}
      </section>
    </aside>
  );
};

// ─── Slider de rango de precio ────────────────────────────────────────────────

interface PriceRangeSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onCommit: (min: number | undefined, max: number | undefined) => void;
  hasPriceFilter: boolean;
}

const PriceRangeSlider = ({
  min,
  max,
  valueMin,
  valueMax,
  onCommit,
  hasPriceFilter,
}: PriceRangeSliderProps) => {
  // Valores locales para feedback visual inmediato mientras el pulgar se mueve
  const [localMin, setLocalMin] = useState(valueMin);
  const [localMax, setLocalMax] = useState(valueMax);

  // Sincronizar valores locales si el padre resetea (p. ej. al cambiar categoría)
  useEffect(() => {
    setLocalMin(valueMin);
  }, [valueMin]);

  useEffect(() => {
    setLocalMax(valueMax);
  }, [valueMax]);

  const range = max - min || 1;
  const leftPct = ((localMin - min) / range) * 100;
  const rightPct = ((localMax - min) / range) * 100;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), localMax - 1);
    setLocalMin(val);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), localMin + 1);
    setLocalMax(val);
  };

  const handleCommit = () => {
    const isFullRange = localMin === min && localMax === max;
    onCommit(
      isFullRange ? undefined : localMin,
      isFullRange ? undefined : localMax,
    );
  };

  const handleClear = () => {
    setLocalMin(min);
    setLocalMax(max);
    onCommit(undefined, undefined);
  };

  return (
    <div>
      {/* Etiqueta de rango activo */}
      <div
        className="mb-4 flex items-center justify-between"
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-secondary)',
          letterSpacing: 'var(--tracking-wide)',
        }}
      >
        <span>{formatCOP(localMin)}</span>
        <span>{formatCOP(localMax)}</span>
      </div>

      {/* Track + pulgares */}
      <div className="relative" style={{ height: '20px' }}>
        {/* Riel de fondo */}
        <div
          className="absolute top-1/2 w-full -translate-y-1/2 rounded-full"
          style={{
            height: '3px',
            backgroundColor: 'var(--bg-tertiary)',
          }}
        />

        {/* Riel activo (entre los dos pulgares) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full"
          style={{
            height: '3px',
            left: `${leftPct}%`,
            width: `${rightPct - leftPct}%`,
            backgroundColor: 'var(--accent)',
            transition: 'left 0.05s, width 0.05s',
          }}
          aria-hidden="true"
        />

        {/* Input mínimo */}
        <SliderThumbInput
          id="price-min"
          label="Precio mínimo"
          value={localMin}
          min={min}
          max={max}
          onChange={handleMinChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          zIndex={localMin > max - (max - min) * 0.1 ? 4 : 3}
        />

        {/* Input máximo */}
        <SliderThumbInput
          id="price-max"
          label="Precio máximo"
          value={localMax}
          min={min}
          max={max}
          onChange={handleMaxChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          zIndex={2}
        />
      </div>

      {/* Limpiar filtro de precio */}
      <AnimatePresence>
        {hasPriceFilter && (
          <motion.button
            type="button"
            onClick={handleClear}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            className="group mt-5 flex cursor-pointer items-center gap-2 transition-opacity duration-150 hover:opacity-70"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-semibold)',
              letterSpacing: 'var(--tracking-widest)',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <span
              className="flex h-4 w-4 items-center justify-center border transition-colors duration-150 group-hover:border-current"
              style={{
                borderColor: 'var(--border-strong)',
                color: 'var(--text-muted)',
              }}
              aria-hidden="true"
            >
              <X size={10} strokeWidth={2.5} />
            </span>
            Limpiar precio
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Input de pulgar del slider ───────────────────────────────────────────────

interface SliderThumbInputProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMouseUp: () => void;
  onTouchEnd: () => void;
  zIndex: number;
}

const SliderThumbInput = ({
  id,
  label,
  value,
  min,
  max,
  onChange,
  onMouseUp,
  onTouchEnd,
  zIndex,
}: SliderThumbInputProps) => {
  const thumbRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* Estilos del input range personalizados via <style> inyectado */}
      <style>{`
        .kob-slider {
          -webkit-appearance: none;
          appearance: none;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 100%;
          height: 20px;
          background: transparent;
          outline: none;
          pointer-events: none;
          margin: 0;
        }
        .kob-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background-color: var(--accent);
          border: 2.5px solid var(--bg-secondary);
          box-shadow: 0 0 0 1.5px var(--accent);
          cursor: pointer;
          pointer-events: all;
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .kob-slider::-webkit-slider-thumb:hover,
        .kob-slider:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px var(--accent-subtle);
          transform: scale(1.12);
        }
        .kob-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background-color: var(--accent);
          border: 2.5px solid var(--bg-secondary);
          box-shadow: 0 0 0 1.5px var(--accent);
          cursor: pointer;
          pointer-events: all;
        }
      `}</style>

      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        ref={thumbRef}
        id={id}
        type="range"
        className="kob-slider"
        style={{ zIndex }}
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        onMouseUp={onMouseUp}
        onTouchEnd={onTouchEnd}
      />
    </>
  );
};

// ─── Item de acordeón ─────────────────────────────────────────────────────────

interface CategoryAccordionItemProps {
  category: Category;
  isExpanded: boolean;
  selectedCategoryId: number | null;
  selectedSubCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
  onSelectSubCategory: (id: number | null) => void;
}

const CategoryAccordionItem = ({
  category,
  isExpanded,
  selectedCategoryId,
  selectedSubCategoryId,
  onSelectCategory,
  onSelectSubCategory,
}: CategoryAccordionItemProps) => {
  const subCategories = category.children ?? [];
  const hasSubCategories = subCategories.length > 0;

  const handleCategoryClick = () => {
    onSelectCategory(isExpanded ? null : category.id);
  };

  const handleSubCategoryClick = (subId: number) => {
    onSelectSubCategory(selectedSubCategoryId === subId ? null : subId);
  };

  return (
    <li
      className="relative border-b"
      style={{ borderColor: 'var(--border-color)', listStyle: 'none' }}
    >
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            layoutId="active-category-bar"
            className="absolute left-0 top-0 h-full w-0.5"
            style={{ backgroundColor: 'var(--accent)' }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleCategoryClick}
        aria-expanded={isExpanded}
        className="flex w-full cursor-pointer items-center justify-between py-4 pl-4 pr-1 text-left transition-colors duration-200"
        style={{ background: 'none', border: 'none' }}
      >
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: isExpanded ? 'var(--font-bold)' : 'var(--font-medium)',
            letterSpacing: 'var(--tracking-wide)',
            textTransform: 'uppercase' as const,
            color: isExpanded ? 'var(--text-accent)' : 'var(--text-secondary)',
            transition: 'color 0.2s ease',
          }}
        >
          {category.name}
        </span>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          style={{
            color: isExpanded ? 'var(--text-accent)' : 'var(--text-muted)',
            flexShrink: 0,
          }}
        >
          <ChevronDown size={15} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && hasSubCategories && (
          <motion.div
            variants={accordionVariants}
            initial="closed"
            animate="open"
            exit="closed"
            style={{ overflow: 'hidden' }}
            aria-hidden={!isExpanded}
          >
            <ul
              role="list"
              style={{
                listStyle: 'none',
                margin: 0,
                padding: '0 0 1rem 1.25rem',
              }}
            >
              {subCategories.map((sub, i) => {
                const isSubActive =
                  selectedCategoryId === category.id &&
                  selectedSubCategoryId === sub.id;

                return (
                  <motion.li
                    key={sub.id}
                    custom={i}
                    variants={subItemVariants}
                    initial="hidden"
                    animate="visible"
                    style={{ listStyle: 'none' }}
                  >
                    <button
                      type="button"
                      onClick={() => handleSubCategoryClick(sub.id)}
                      className="group relative flex w-full cursor-pointer items-center gap-2 py-2 text-left"
                      style={{ background: 'none', border: 'none' }}
                    >
                      <motion.span
                        className="block h-1 w-1 flex-shrink-0 rounded-full"
                        animate={{
                          backgroundColor: isSubActive
                            ? 'var(--accent)'
                            : 'var(--border-strong)',
                          scale: isSubActive ? 1.5 : 1,
                        }}
                        transition={{ duration: 0.18 }}
                        aria-hidden="true"
                      />
                      <span
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: isSubActive
                            ? 'var(--font-bold)'
                            : 'var(--font-normal)',
                          letterSpacing: 'var(--tracking-wide)',
                          textTransform: 'uppercase' as const,
                          color: isSubActive
                            ? 'var(--text-accent)'
                            : 'var(--text-muted)',
                          transition: 'color 0.18s ease',
                        }}
                      >
                        {sub.name}
                      </span>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

// ─── Skeletons ────────────────────────────────────────────────────────────────

const CategorySkeletonList = () => (
  <ul
    role="list"
    aria-label="Cargando categorías"
    style={{ listStyle: 'none', margin: 0, padding: 0 }}
  >
    {[72, 60, 80, 55, 68].map((w, i) => (
      <li
        key={i}
        className="border-b py-4 pl-4"
        style={{ borderColor: 'var(--border-color)', listStyle: 'none' }}
      >
        <div
          className="h-3 animate-pulse rounded-sm"
          style={{ width: `${w}%`, backgroundColor: 'var(--bg-tertiary)' }}
        />
      </li>
    ))}
  </ul>
);

const PriceSliderSkeleton = () => (
  <div>
    <div className="mb-4 flex justify-between">
      <div
        className="h-3 w-24 animate-pulse rounded"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      />
      <div
        className="h-3 w-24 animate-pulse rounded"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      />
    </div>
    <div
      className="h-1.5 w-full animate-pulse rounded-full"
      style={{ backgroundColor: 'var(--bg-tertiary)' }}
    />
  </div>
);
