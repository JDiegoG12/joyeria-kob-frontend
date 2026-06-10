import { Search, SlidersHorizontal, Tag, X } from 'lucide-react';
import type { JewelryCategory } from '../types/filter.types';

interface ProductFiltersProps {
  search: string;
  statusFilter: string;
  categoryFilter: string;
  subcategoryFilter: string;
  categories: JewelryCategory[];
  availableSubcategories: JewelryCategory['subCategories'];
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onSubcategoryFilterChange: (value: string) => void;
  onClear: () => void;
}

const SELECT_BASE_STYLE = {
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-primary)',
  backgroundColor: 'var(--bg-secondary)',
  borderColor: 'var(--border-color)',
};

export const ProductFilters = ({
  search,
  statusFilter,
  categoryFilter,
  subcategoryFilter,
  categories,
  availableSubcategories,
  onSearchChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onSubcategoryFilterChange,
  onClear,
}: ProductFiltersProps) => {
  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(statusFilter) ||
    Boolean(categoryFilter) ||
    Boolean(subcategoryFilter);

  return (
    <section className="mb-8 flex flex-col gap-4">
      <div
        className="flex items-center rounded-xl border px-4 py-3 transition-all"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <Search
          size={16}
          style={{ color: 'var(--text-muted)', flexShrink: 0 }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar joya por nombre..."
          className="ml-3 w-full bg-transparent outline-none"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => {
            (e.currentTarget.parentElement as HTMLElement).style.borderColor =
              'var(--accent-vivid, var(--accent))';
            (e.currentTarget.parentElement as HTMLElement).style.boxShadow =
              '0 0 0 3px var(--accent-subtle)';
          }}
          onBlur={(e) => {
            (e.currentTarget.parentElement as HTMLElement).style.borderColor =
              'var(--border-color)';
            (e.currentTarget.parentElement as HTMLElement).style.boxShadow =
              'var(--shadow-xs)';
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="ml-2 rounded-lg p-1 transition-colors cursor-pointer"
            aria-label="Limpiar búsqueda"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                'var(--bg-hover)';
              (e.currentTarget as HTMLElement).style.color =
                'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                'transparent';
              (e.currentTarget as HTMLElement).style.color =
                'var(--text-muted)';
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div
        className="rounded-2xl border p-4 sm:p-5"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="mb-4 flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'var(--accent-subtle)' }}
          >
            <SlidersHorizontal
              size={16}
              style={{ color: 'var(--accent-vivid, var(--accent))' }}
            />
          </div>
          <div>
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-muted)',
                letterSpacing: 'var(--tracking-wide)',
                textTransform: 'uppercase',
              }}
            >
              Filtros del listado
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              Acota por estado, categoría o subcategoría.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--text-secondary)',
                letterSpacing: 'var(--tracking-wide)',
                textTransform: 'uppercase',
              }}
            >
              Categoría
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="min-h-11 cursor-pointer rounded-xl border px-4 py-3 outline-none transition-all"
              style={SELECT_BASE_STYLE}
              onFocus={(e) => {
                e.currentTarget.style.borderColor =
                  'var(--accent-vivid, var(--accent))';
                e.currentTarget.style.boxShadow =
                  '0 0 0 3px var(--accent-subtle)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--text-secondary)',
                letterSpacing: 'var(--tracking-wide)',
                textTransform: 'uppercase',
              }}
            >
              Subcategoría
            </span>
            <select
              value={subcategoryFilter}
              onChange={(e) => onSubcategoryFilterChange(e.target.value)}
              disabled={!categoryFilter}
              className="min-h-11 cursor-pointer rounded-xl border px-4 py-3 outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
              style={SELECT_BASE_STYLE}
              onFocus={(e) => {
                e.currentTarget.style.borderColor =
                  'var(--accent-vivid, var(--accent))';
                e.currentTarget.style.boxShadow =
                  '0 0 0 3px var(--accent-subtle)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="">
                {categoryFilter
                  ? 'Todas las subcategorías'
                  : 'Selecciona una categoría'}
              </option>
              {availableSubcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--text-secondary)',
                letterSpacing: 'var(--tracking-wide)',
                textTransform: 'uppercase',
              }}
            >
              Estado
            </span>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="min-h-11 cursor-pointer rounded-xl border px-4 py-3 outline-none transition-all"
              style={SELECT_BASE_STYLE}
              onFocus={(e) => {
                e.currentTarget.style.borderColor =
                  'var(--accent-vivid, var(--accent))';
                e.currentTarget.style.boxShadow =
                  '0 0 0 3px var(--accent-subtle)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="">Todos los estados</option>
              <option value="AVAILABLE">Activos</option>
              <option value="OUT_OF_STOCK">Sin stock</option>
              <option value="HIDDEN">Ocultos</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Tag size={14} style={{ color: 'var(--text-muted)' }} />
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              {categoryFilter && subcategoryFilter
                ? 'La categoría principal sigue aplicando mientras filtras una subcategoría.'
                : categoryFilter
                  ? 'La categoría incluye también sus subcategorías.'
                  : 'Usa los filtros para revisar el inventario con más precisión.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClear}
            disabled={!hasActiveFilters}
            className="cursor-pointer rounded-xl border px-4 py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: hasActiveFilters
                ? 'var(--accent-vivid, var(--accent))'
                : 'var(--text-muted)',
              borderColor: hasActiveFilters
                ? 'var(--accent-vivid, var(--accent))'
                : 'var(--border-color)',
              backgroundColor: 'transparent',
              alignSelf: 'flex-start',
            }}
            onMouseEnter={(e) => {
              if (!hasActiveFilters) return;
              (e.currentTarget as HTMLElement).style.backgroundColor =
                'var(--accent-subtle)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                'transparent';
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </section>
  );
};
