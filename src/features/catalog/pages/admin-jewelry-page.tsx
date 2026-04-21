/**
@file admin-jewelry-page.tsx
@description Página principal de gestión de joyas del panel de administración
de Joyería KOB.

Responsabilidades
- Cargar y mostrar el listado completo de joyas en modo admin.
- Proveer filtros de búsqueda por nombre/descripción y por estado.
- Permitir crear una nueva joya mediante el botón "Nueva joya" que
  abre el modal `ProductCreateForm`.
- Permitir editar una joya existente mediante el modal `ProductEditForm`.
- Permitir ocultar o activar una joya con confirmación previa.

Flujo de creación
- Click "Nueva joya" → isCreateOpen = true → ProductCreateForm visible
- onSuccess() → recarga lista → cierra modal
- onClose()   → cierra modal (con confirmación si hay datos)

Flujo de edición
- Click "Editar" en ProductCard → selectedProduct = product, isEditOpen = true
- ProductEditForm visible
- onSuccess() → recarga lista → cierra modal
*/

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { ProductCard } from '../components/product-card';
import { ProductCreateForm } from '../components/product-create-form';
import { ProductEditForm } from '../components/product-edit-form';
import { ProductFilters } from '../components/product-filters';
import { productService } from '../services/product.service';
import type { Product } from '../types/product.types';

/**
Página de administración del catálogo de joyas.
Gestiona el estado de la lista, los filtros y la visibilidad de los modales.
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
  Carga el listado completo de productos desde el backend en modo admin.
  Los productos ocultos o sin stock también se incluyen.
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
  Cambia el estado de visibilidad de una joya entre `AVAILABLE` y `HIDDEN`.
  Solicita confirmación antes de ejecutar la acción.
  @param product - Producto cuyo estado se quiere cambiar.
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
  Abre el modal de edición con el producto seleccionado.
  @param product - Producto a editar.
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
  Ejecutado tras una edición exitosa.
  Recarga la lista y cierra el modal.
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
  Ejecutado tras una creación exitosa.
  Recarga la lista y cierra el modal.
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
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* ── Encabezado con botón de crear ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
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
            Gestión de Joyas
          </h1>
          <p
            className="mt-2"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            Administra productos, edita y controla su visibilidad.
          </p>
        </div>

        {/* Botón Nueva Joya (Feedback premium sin alterar cursor del SO) */}
        <motion.button
          onClick={handleOpenCreate}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 sm:w-auto cursor-pointer transition-all duration-200"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-semibold)',
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-text)',
            boxShadow: 'var(--shadow-md)',
            whiteSpace: 'nowrap',
          }}
          onHoverStart={(e) => {
            if (!e.currentTarget) return; // Guarda contra desmontaje asíncrono
            (e.currentTarget as HTMLElement).style.backgroundColor =
              'var(--accent-hover)';
            (e.currentTarget as HTMLElement).style.boxShadow =
              'var(--shadow-accent)';
          }}
          onHoverEnd={(e) => {
            if (!e.currentTarget) return; // Guarda contra desmontaje asíncrono
            (e.currentTarget as HTMLElement).style.backgroundColor =
              'var(--accent)';
            (e.currentTarget as HTMLElement).style.boxShadow =
              'var(--shadow-md)';
          }}
        >
          <Plus size={17} />
          Nueva joya
        </motion.button>
      </motion.div>

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
  );
};
