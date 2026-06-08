/**
 * @file admin-customers-page.tsx
 * @description Vista principal del módulo de Clientes del panel admin.
 * Se monta en la ruta `/admin/clientes`.
 *
 * Características
 * - Listado de clientes (rol CLIENT) con paginación server-side (no carga todos
 *   de golpe).
 * - Búsqueda server-side por nombre, apellido, correo o teléfono (con debounce).
 * - Acciones por cliente: correo (`mailto:`), WhatsApp (`wa.me`) y ver favoritos.
 * - Responsive: tabla en escritorio, tarjetas apiladas en móvil.
 *
 * Estados: cargando (skeleton), error (reintento), vacío, sin resultados de
 * búsqueda y con datos.
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Search, Users, X } from 'lucide-react';

import { useCustomerStore } from '@/features/customers/store/customer.store';
import { CustomersTable } from '@/features/customers/components/customers-table';
import { CustomerCard } from '@/features/customers/components/customer-card';
import { PaginationControls } from '@/features/customers/components/pagination-controls';
import { CustomerFavoritesDrawer } from '@/features/customers/components/customer-favorites-drawer';

/** Milisegundos de espera tras dejar de escribir antes de consultar al backend. */
const SEARCH_DEBOUNCE_MS = 400;

export const AdminCustomersPage = () => {
  const {
    customers,
    pagination,
    isLoading,
    error,
    loadCustomers,
    setSearch,
    setPage,
  } = useCustomerStore();

  // Valor controlado del input; la búsqueda real se dispara con debounce.
  const [searchInput, setSearchInput] = useState('');
  const isFirstRender = useRef(true);

  // ── Carga inicial ───────────────────────────────────────────────────────────
  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  // ── Búsqueda con debounce ─────────────────────────────────────────────────
  // Se omite la primera ejecución para no duplicar la carga inicial.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, setSearch]);

  const hasActiveSearch = searchInput.trim().length > 0;
  const total = pagination?.total ?? 0;
  const isEmpty = !isLoading && !error && customers.length === 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* ── Encabezado ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-3xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--text-primary)',
            letterSpacing: 'var(--tracking-tight)',
            lineHeight: 'var(--leading-tight)',
          }}
        >
          Clientes
        </h1>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
          }}
        >
          Consulta los clientes registrados, contáctalos y revisa sus favoritos.
        </p>
      </motion.div>

      {/* ── Barra de búsqueda ───────────────────────────────────────────────── */}
      {!error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mb-6"
        >
          <div
            className="flex items-center rounded-xl border px-4 py-3"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
            }}
          >
            <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre, correo o teléfono..."
              className="ml-3 w-full bg-transparent outline-none"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
              }}
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="ml-2 rounded-lg p-1 transition-colors hover:bg-[var(--bg-hover)]"
                aria-label="Limpiar búsqueda"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Contador ────────────────────────────────────────────────────────── */}
      {!isLoading && !error && total > 0 && (
        <p
          className="mb-4"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}
        >
          {total} cliente{total !== 1 ? 's' : ''}
          {hasActiveSearch ? ` coinciden con "${searchInput.trim()}"` : ' registrados'}
        </p>
      )}

      {/* ── Estado: cargando ────────────────────────────────────────────────── */}
      {isLoading && <ListSkeleton />}

      {/* ── Estado: error ───────────────────────────────────────────────────── */}
      {!isLoading && error && (
        <ErrorState message={error} onRetry={() => void loadCustomers()} />
      )}

      {/* ── Estado: vacío / sin resultados ──────────────────────────────────── */}
      {isEmpty && <EmptyState hasActiveSearch={hasActiveSearch} />}

      {/* ── Datos ───────────────────────────────────────────────────────────── */}
      {!isLoading && !error && customers.length > 0 && (
        <>
          {/* Escritorio: tabla */}
          <CustomersTable customers={customers} />

          {/* Móvil: tarjetas */}
          <div className="flex flex-col gap-4 md:hidden">
            {customers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </div>

          {pagination && (
            <PaginationControls
              pagination={pagination}
              onPageChange={setPage}
              disabled={isLoading}
            />
          )}
        </>
      )}

      {/* Drawer de favoritos (montado siempre, se muestra según el store) */}
      <CustomerFavoritesDrawer />
    </div>
  );
};

// ─── Estados auxiliares ───────────────────────────────────────────────────────

/** Skeleton de filas mientras carga una página. */
const ListSkeleton = () => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="h-14 animate-pulse border"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          animationDelay: `${i * 60}ms`,
        }}
      />
    ))}
  </div>
);

/** Estado de error con botón de reintento. */
const ErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div
    className="flex flex-col items-center gap-4 border py-20 text-center"
    style={{ borderColor: 'var(--border-color)' }}
  >
    <AlertCircle size={28} strokeWidth={1.5} style={{ color: '#e53e3e' }} />
    <p
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
      }}
    >
      {message}
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="flex items-center gap-2 border px-4 py-2.5 transition-colors duration-200 hover:bg-[var(--bg-hover)]"
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-semibold)',
        borderColor: 'var(--border-strong)',
        color: 'var(--text-secondary)',
      }}
    >
      <RefreshCw size={15} />
      Reintentar
    </button>
  </div>
);

/** Estado vacío: sin clientes registrados o sin resultados de búsqueda. */
const EmptyState = ({ hasActiveSearch }: { hasActiveSearch: boolean }) => (
  <div
    className="flex flex-col items-center gap-3 border py-20 text-center"
    style={{ borderColor: 'var(--border-color)' }}
  >
    <Users size={28} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
    <p
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
      }}
    >
      {hasActiveSearch
        ? 'No se encontraron clientes para esta búsqueda.'
        : 'Aún no hay clientes registrados.'}
    </p>
  </div>
);
