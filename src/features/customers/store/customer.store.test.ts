/**
 * @file customer.store.test.ts
 * @description Tests del store de Clientes: carga paginada, manejo de error,
 * y las acciones setSearch/setPage que resetean la página y recargan.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCustomerStore } from './customer.store';
import { CustomerService } from '@/features/customers/services/customer.service';

vi.mock('@/features/customers/services/customer.service', () => ({
  CustomerService: {
    getCustomers: vi.fn(),
    getCustomerFavorites: vi.fn(),
  },
}));

const showToast = vi.hoisted(() => vi.fn());
vi.mock('@/store/toast.store', () => ({
  useToastStore: { getState: () => ({ showToast }) },
}));

const mockedService = vi.mocked(CustomerService);

beforeEach(() => {
  vi.clearAllMocks();
  useCustomerStore.setState({
    customers: [],
    pagination: null,
    search: '',
    page: 1,
    limit: 10,
    isLoading: false,
    error: null,
  });
});

describe('loadCustomers', () => {
  it('carga la página y guarda customers + pagination', async () => {
    mockedService.getCustomers.mockResolvedValue({
      customers: [{ id: '1' }],
      pagination: { total: 1 },
    } as never);

    await useCustomerStore.getState().loadCustomers();

    const state = useCustomerStore.getState();
    expect(state.customers).toHaveLength(1);
    expect(state.pagination).toEqual({ total: 1 });
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('guarda un error y muestra toast cuando la carga falla', async () => {
    mockedService.getCustomers.mockRejectedValue(new Error('boom'));

    await useCustomerStore.getState().loadCustomers();

    const state = useCustomerStore.getState();
    expect(state.error).toMatch(/No se pudieron cargar/);
    expect(state.isLoading).toBe(false);
    expect(showToast).toHaveBeenCalledWith('error', expect.any(String));
  });
});

describe('setSearch', () => {
  it('actualiza el término, vuelve a la página 1 y recarga', () => {
    useCustomerStore.setState({ page: 5 });
    mockedService.getCustomers.mockResolvedValue({
      customers: [],
      pagination: null,
    } as never);

    useCustomerStore.getState().setSearch('ana');

    const state = useCustomerStore.getState();
    expect(state.search).toBe('ana');
    expect(state.page).toBe(1);
    expect(mockedService.getCustomers).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: 'ana',
    });
  });
});

describe('setPage', () => {
  it('cambia de página y recarga con los filtros vigentes', () => {
    mockedService.getCustomers.mockResolvedValue({
      customers: [],
      pagination: null,
    } as never);

    useCustomerStore.getState().setPage(3);

    expect(useCustomerStore.getState().page).toBe(3);
    expect(mockedService.getCustomers).toHaveBeenCalledWith({
      page: 3,
      limit: 10,
      search: '',
    });
  });
});

describe('drawer de favoritos', () => {
  it('openFavorites abre el drawer y carga los favoritos del cliente', async () => {
    mockedService.getCustomerFavorites.mockResolvedValue([{ id: 1 }] as never);
    const customer = { id: 'c1', name: 'Ana' };

    await useCustomerStore.getState().openFavorites(customer as never);

    const drawer = useCustomerStore.getState().favoritesDrawer;
    expect(drawer.open).toBe(true);
    expect(drawer.customer).toBe(customer);
    expect(drawer.items).toHaveLength(1);
    expect(drawer.isLoading).toBe(false);
  });

  it('closeFavorites limpia el estado del drawer', () => {
    useCustomerStore.setState({
      favoritesDrawer: {
        open: true,
        customer: { id: 'c1' } as never,
        items: [{ id: 1 }] as never,
        isLoading: false,
        error: null,
      },
    });

    useCustomerStore.getState().closeFavorites();

    const drawer = useCustomerStore.getState().favoritesDrawer;
    expect(drawer.open).toBe(false);
    expect(drawer.customer).toBeNull();
    expect(drawer.items).toHaveLength(0);
  });
});
