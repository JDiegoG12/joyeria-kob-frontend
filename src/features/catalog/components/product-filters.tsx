interface ProductFiltersProps {
  search: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onClear: () => void;
}

export const ProductFilters = ({
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onClear,
}: ProductFiltersProps) => {
  return (
    <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 shadow-sm md:flex-row">
      <input
        type="text"
        placeholder="Buscar joya..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 rounded-xl border border-[var(--border-color)] bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />

      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="rounded-xl border border-[var(--border-color)] bg-transparent px-4 py-3"
      >
        <option value="">Todos los estados</option>
        <option value="AVAILABLE">Activos</option>
        <option value="OUT_OF_STOCK">Sin stock</option>
        <option value="HIDDEN">Ocultos</option>
      </select>

      <button
        type="button"
        onClick={onClear}
        className="rounded-xl border border-[var(--border-color)] px-5 py-3 transition hover:bg-[var(--bg-tertiary)]"
      >
        Limpiar
      </button>
    </div>
  );
};