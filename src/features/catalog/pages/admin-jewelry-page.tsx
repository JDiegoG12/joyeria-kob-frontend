/**
 * @file admin-jewelry-page.tsx
 * @description Página principal de gestión de joyas del panel de administración
 * de Joyería KOB.
 *
 * ## Responsabilidades
 * - Cargar y mostrar el listado completo de joyas en modo admin.
 * - Proveer filtros de búsqueda por nombre/descripción y por estado.
 * - Permitir crear una nueva joya mediante el botón "Agregar joya" que
 *   abre el modal `ProductCreateForm`.
 * - Permitir editar una joya existente mediante el modal `ProductEditForm`.
 * - Permitir ocultar o activar una joya con confirmación previa.
 *
 * ## Flujo de creación
 * ```
 * Click "Agregar joya" → isCreateOpen = true → ProductCreateForm visible
 *   → onSuccess() → recarga lista → cierra modal
 *   → onClose()   → cierra modal (con confirmación si hay datos)
 * ```
 *
 * ## Flujo de edición
 * ```
 * Click "Editar" en ProductCard → selectedProduct = product, isEditOpen = true
 *   → ProductEditForm visible
 *   → onSuccess() → recarga lista → cierra modal
 * ```
 */

import { useEffect, useMemo, useState } from 'react';
import { ProductCard } from '../components/product-card';
import { ProductCreateForm } from '../components/product-create-form';
import { ProductEditForm } from '../components/product-edit-form';
import { ProductFilters } from '../components/product-filters';
import { productService } from '../services/product.service';
import type { Product } from '../types/product.types';

/**
 * Página de administración del catálogo de joyas.
 * Gestiona el estado de la lista, los filtros y la visibilidad de los modales.
 */
export const AdminJewelryPage = () => {
  // ── Estado de datos ────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Estado de filtros ──────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ── Estado de acciones sobre productos ────────────────────────────────────
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // ── Estado de modales ──────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const serverUrl = import.meta.env.VITE_API_URL.replace('/api', '');

  // ── Carga de productos ─────────────────────────────────────────────────────

  /**
   * Carga el listado completo de productos desde el backend en modo admin.
   * Los productos ocultos o sin stock también se incluyen.
   */
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await productService.getAll();
      setProducts(data);
    } catch {
      setError('No se pudieron cargar los productos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  // ── Filtrado local ─────────────────────────────────────────────────────────

  /** Productos filtrados por búsqueda de texto y por estado. */
  const filteredProducts = useMemo(() => {
    const searchLower = search.toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter
        ? product.status === statusFilter
        : true;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  // ── Handlers de visibilidad ────────────────────────────────────────────────

  /**
   * Cambia el estado de visibilidad de una joya entre `AVAILABLE` y `HIDDEN`.
   * Solicita confirmación antes de ejecutar la acción.
   *
   * @param product - Producto cuyo estado se quiere cambiar.
   */
  const handleToggleVisibility = async (product: Product) => {
    const actionText = product.status === 'HIDDEN' ? 'activar' : 'ocultar';

    const confirmed = window.confirm(
      `¿Seguro que deseas ${actionText} la joya "${product.name}"?`,
    );
    if (!confirmed) return;

    try {
      setActionLoadingId(product.id);

      if (product.status === 'HIDDEN') {
        await productService.activate(product.id);
      } else {
        await productService.hide(product.id);
      }

      await loadProducts();
    } catch {
      window.alert('No se pudo actualizar el estado del producto.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Handlers del modal de edición ─────────────────────────────────────────

  /**
   * Abre el modal de edición con el producto seleccionado.
   *
   * @param product - Producto a editar.
   */
  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsEditOpen(true);
  };

  /** Cierra el modal de edición y limpia la selección. */
  const handleCloseEdit = () => {
    setSelectedProduct(null);
    setIsEditOpen(false);
  };

  /**
   * Ejecutado tras una edición exitosa.
   * Recarga la lista y cierra el modal.
   */
  const handleEditSuccess = async () => {
    await loadProducts();
    handleCloseEdit();
  };

  // ── Handlers del modal de creación ────────────────────────────────────────

  /** Abre el modal de creación de joya. */
  const handleOpenCreate = () => {
    setIsCreateOpen(true);
  };

  /** Cierra el modal de creación. */
  const handleCloseCreate = () => {
    setIsCreateOpen(false);
  };

  /**
   * Ejecutado tras una creación exitosa.
   * Recarga la lista y cierra el modal.
   */
  const handleCreateSuccess = async () => {
    await loadProducts();
    handleCloseCreate();
  };

  // ── Limpiar filtros ────────────────────────────────────────────────────────

  /** Resetea todos los filtros activos a su valor inicial. */
  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 lg:p-8">
      <div className="w-full">
        {/* ── Encabezado con botón de crear ──────────────────────── */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-4xl tracking-tight text-[var(--text-primary)]">
              Gestión de Joyas
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Administra productos, edita y controla su visibilidad.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="shrink-0 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-text)] shadow-[var(--shadow-accent)] transition hover:opacity-90 active:scale-95"
          >
            + Agregar joya
          </button>
        </div>

        {/* ── Filtros ─────────────────────────────────────────────── */}
        <ProductFilters
          search={search}
          statusFilter={statusFilter}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onClear={handleClearFilters}
        />

        {/* ── Listado de productos ─────────────────────────────────── */}
        {loading ? (
          <p className="text-[var(--text-secondary)]">Cargando productos...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-[var(--text-secondary)]">
            No hay productos para mostrar.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                serverUrl={serverUrl}
                isProcessing={actionLoadingId === product.id}
                onEdit={handleEdit}
                onToggleVisibility={(p) => {
                  void handleToggleVisibility(p);
                }}
              />
            ))}
          </div>
        )}

        {/* ── Modal de creación ────────────────────────────────────── */}
        <ProductCreateForm
          isOpen={isCreateOpen}
          onClose={handleCloseCreate}
          onSuccess={() => {
            void handleCreateSuccess();
          }}
        />

        {/* ── Modal de edición ─────────────────────────────────────── */}
        <ProductEditForm
          product={selectedProduct}
          isOpen={isEditOpen}
          onClose={handleCloseEdit}
          onSuccess={() => {
            void handleEditSuccess();
          }}
        />
      </div>
    </div>
  );
};
