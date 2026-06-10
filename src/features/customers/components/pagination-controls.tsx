/**
 * @file pagination-controls.tsx
 * @description Controles de paginación reutilizables (Anterior / Siguiente +
 * indicador "Página X de Y"). Pensado para paginación server-side: solo emite
 * el número de página solicitado vía `onPageChange`.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CustomersPagination } from '@/features/customers/types/customer.types';

interface PaginationControlsProps {
  pagination: CustomersPagination;
  /** Se invoca con la página destino al pulsar Anterior/Siguiente. */
  onPageChange: (page: number) => void;
  /** Deshabilita los botones mientras carga la nueva página. */
  disabled?: boolean;
}

const buttonStyle: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--text-secondary)',
  borderColor: 'var(--border-strong)',
};

export const PaginationControls = ({
  pagination,
  onPageChange,
  disabled = false,
}: PaginationControlsProps) => {
  const { page, totalPages, total, hasPrevPage, hasNextPage } = pagination;

  // Sin resultados: no hay nada que paginar.
  if (total === 0) return null;

  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-muted)',
        }}
      >
        Página {page} de {totalPages}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || !hasPrevPage}
          className="flex items-center gap-1 border px-3 py-2 transition-colors duration-200 enabled:hover:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          style={buttonStyle}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} strokeWidth={1.8} aria-hidden="true" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || !hasNextPage}
          className="flex items-center gap-1 border px-3 py-2 transition-colors duration-200 enabled:hover:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          style={buttonStyle}
          aria-label="Página siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
