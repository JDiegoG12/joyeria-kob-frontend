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
      
      {/* 🔍 Input búsqueda */}
      <input
        type="text"
        placeholder="Buscar joya..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 rounded-xl border border-[var(--border-color)] bg-transparent px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />

      {/* 🔽 Select */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="cursor-pointer rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] transition hover:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      >
        <option value="" className="bg-white text-black">
          Todos los estados
        </option>
        <option value="AVAILABLE" className="bg-white text-black">
          Activos
        </option>
        <option value="OUT_OF_STOCK" className="bg-white text-black">
          Sin stock
        </option>
        <option value="HIDDEN" className="bg-white text-black">
          Ocultos
        </option>
      </select>

      {/* 🧹 Botón limpiar */}
      <button
        type="button"
        onClick={onClear}
        className="cursor-pointer rounded-xl border border-[var(--border-color)] px-5 py-3 transition-all duration-200 hover:bg-[var(--bg-tertiary)] active:scale-95"
      >
        Limpiar
      </button>
    </div>
  );
};