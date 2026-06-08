/**
 * @file customer.store.ts
 * @description Store Zustand del módulo de Clientes (panel administrativo).
 *
 * Maneja:
 * - El listado paginado con búsqueda server-side (`customers`, `pagination`,
 *   `search`, `page`, `limit`).
 * - El drawer de favoritos de un cliente (`favoritesDrawer`).
 *
 * La paginación y la búsqueda son server-side: cada cambio de `page` o `search`
 * dispara una nueva petición al backend (no se cargan todos los clientes de
 * golpe).
 */

import { create } from 'zustand';
import { CustomerService } from '@/features/customers/services/customer.service';
import { useToastStore } from '@/store/toast.store';
import type {
  Customer,
  CustomerFavorite,
  CustomersPagination,
} from '@/features/customers/types/customer.types';

/** Cantidad de clientes por página. */
const DEFAULT_LIMIT = 10;

// ─── Forma del estado ───────────────────────────────────────────────────────

interface CustomerState {
  /** Clientes de la página actual. */
  customers: Customer[];
  /** Metadatos de paginación de la última respuesta, o `null` si aún no hay. */
  pagination: CustomersPagination | null;
  /** Término de búsqueda activo. */
  search: string;
  /** Página actual solicitada (1-indexada). */
  page: number;
  /** Registros por página. */
  limit: number;
  /** `true` mientras se carga una página del listado. */
  isLoading: boolean;
  /** Mensaje de error de carga del listado, o `null`. */
  error: string | null;

  /** Estado del drawer de favoritos de un cliente. */
  favoritesDrawer: {
    open: boolean;
    customer: Customer | null;
    items: CustomerFavorite[];
    isLoading: boolean;
    error: string | null;
  };

  // ── Acciones del listado ──────────────────────────────────────────────────

  /** Carga la página actual desde el backend con los filtros vigentes. */
  loadCustomers: () => Promise<void>;
  /**
   * Actualiza el término de búsqueda, vuelve a la página 1 y recarga.
   * @param search - Nuevo término (la página lo invoca ya con debounce).
   */
  setSearch: (search: string) => void;
  /**
   * Cambia de página y recarga.
   * @param page - Página destino (1-indexada).
   */
  setPage: (page: number) => void;

  // ── Acciones del drawer de favoritos ──────────────────────────────────────

  /** Abre el drawer y carga los favoritos del cliente recibido. */
  openFavorites: (customer: Customer) => Promise<void>;
  /** Cierra el drawer de favoritos y limpia su estado. */
  closeFavorites: () => void;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useCustomerStore = create<CustomerState>()((set, get) => ({
  customers: [],
  pagination: null,
  search: '',
  page: 1,
  limit: DEFAULT_LIMIT,
  isLoading: false,
  error: null,

  favoritesDrawer: {
    open: false,
    customer: null,
    items: [],
    isLoading: false,
    error: null,
  },

  // ── loadCustomers ───────────────────────────────────────────────────────────
  loadCustomers: async () => {
    const { page, limit, search } = get();
    set({ isLoading: true, error: null });
    try {
      const result = await CustomerService.getCustomers({ page, limit, search });
      set({
        customers: result.customers,
        pagination: result.pagination,
        isLoading: false,
      });
    } catch {
      set({
        error: 'No se pudieron cargar los clientes. Intenta de nuevo.',
        isLoading: false,
      });
      useToastStore
        .getState()
        .showToast('error', 'Error al cargar el listado de clientes.');
    }
  },

  // ── setSearch ───────────────────────────────────────────────────────────────
  setSearch: (search) => {
    set({ search, page: 1 });
    void get().loadCustomers();
  },

  // ── setPage ─────────────────────────────────────────────────────────────────
  setPage: (page) => {
    set({ page });
    void get().loadCustomers();
  },

  // ── openFavorites ─────────────────────────────────────────────────────────
  openFavorites: async (customer) => {
    set({
      favoritesDrawer: {
        open: true,
        customer,
        items: [],
        isLoading: true,
        error: null,
      },
    });
    try {
      const items = await CustomerService.getCustomerFavorites(customer.id);
      set((state) => ({
        favoritesDrawer: { ...state.favoritesDrawer, items, isLoading: false },
      }));
    } catch {
      set((state) => ({
        favoritesDrawer: {
          ...state.favoritesDrawer,
          isLoading: false,
          error: 'No se pudieron cargar los favoritos del cliente.',
        },
      }));
      useToastStore
        .getState()
        .showToast('error', 'Error al cargar los favoritos del cliente.');
    }
  },

  // ── closeFavorites ──────────────────────────────────────────────────────────
  closeFavorites: () => {
    set({
      favoritesDrawer: {
        open: false,
        customer: null,
        items: [],
        isLoading: false,
        error: null,
      },
    });
  },
}));
