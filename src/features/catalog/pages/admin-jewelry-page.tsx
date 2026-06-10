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
import { AlertCircle, Package2, Plus, RefreshCw, Search } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/modal/confirm-modal';
import { useToastStore } from '@/store/toast.store';
import { SERVER_URL } from '@/api/server-url';
import { ProductCard } from '../components/product-card';
import { ProductCreateForm } from '../components/product-create-form';
import { ProductEditForm } from '../components/product-edit-form';
import { ProductFilters } from '../components/product-filters';
import { resolveCategorySelection } from '../hooks/use-category-selector';
import { FilterService } from '../services/filter.service';
import { productService } from '../services/product.service';
import type { JewelryCategory } from '../types/filter.types';
import type { Product } from '../types/product.types';

/**
Página de administración del catálogo de joyas.
Gestiona el estado de la lista, los filtros y la visibilidad de los modales.
*/
export const AdminJewelryPage = () => {
  const { showToast } = useToastStore();

  // ── Estado de datos ────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Estado de filtros ──────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [categories, setCategories] = useState<JewelryCategory[]>([]);

  // ── Estado de acciones sobre productos ────────────────────────────────────
  const [actionState, setActionState] = useState<{
    id: string;
    type: 'visibility' | 'delete';
  } | null>(null);

  // ── Estado de modales ──────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToHide, setProductToHide] = useState<Product | null>(null);

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

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await FilterService.getCategories();
        setCategories(data);
      } catch {
        setCategories([]);
      }
    };

    void loadCategories();
  }, []);

  const availableSubcategories = useMemo(() => {
    return (
      categories.find((category) => category.id === categoryFilter)
        ?.subCategories ?? []
    );
  }, [categories, categoryFilter]);

  // ── Filtrado local ─────────────────────────────────────────────────────────
  /** Productos filtrados por búsqueda de texto y por estado. */
  const filteredProducts = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = searchLower
        ? product.name.toLowerCase().includes(searchLower)
        : true;
      const matchesStatus = statusFilter
        ? product.status === statusFilter
        : true;
      const resolvedCategory = product.category
        ? resolveCategorySelection(product.category)
        : {
            selectedParentId: product.categoryId,
            selectedSubId: null,
          };
      const matchesCategory = categoryFilter
        ? resolvedCategory.selectedParentId === Number(categoryFilter)
        : true;
      const matchesSubcategory = subcategoryFilter
        ? resolvedCategory.selectedSubId === Number(subcategoryFilter)
        : true;

      return (
        matchesSearch && matchesStatus && matchesCategory && matchesSubcategory
      );
    });
  }, [products, search, statusFilter, categoryFilter, subcategoryFilter]);

  // ── Handlers de visibilidad ────────────────────────────────────────────────
  /**
  Cambia el estado de visibilidad de una joya entre `AVAILABLE` y `HIDDEN`.
  Solicita confirmación antes de ejecutar la acción.
  @param product - Producto cuyo estado se quiere cambiar.
  */
  const handleToggleVisibility = async (product: Product) => {
    if (product.status !== 'HIDDEN') {
      setProductToHide(product);
      return;
    }

    try {
      setActionState({ id: product.id, type: 'visibility' });

      if (product.status === 'HIDDEN') {
        await productService.activate(product.id);
        showToast('success', `"${product.name}" ahora está activa.`);
      } else {
        await productService.hide(product.id);
        showToast('success', `"${product.name}" fue ocultada del catálogo.`);
      }

      await loadProducts();
    } catch {
      showToast('error', 'No se pudo actualizar el estado de la joya.');
    } finally {
      setActionState(null);
    }
  };

  const handleConfirmHide = async () => {
    if (!productToHide) return;

    try {
      setActionState({ id: productToHide.id, type: 'visibility' });
      await productService.hide(productToHide.id);
      showToast(
        'success',
        `"${productToHide.name}" fue ocultada del catálogo.`,
      );
      setProductToHide(null);
      await loadProducts();
    } catch {
      showToast('error', 'No se pudo actualizar el estado de la joya.');
    } finally {
      setActionState(null);
    }
  };

  const handleOpenDelete = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      setActionState({ id: productToDelete.id, type: 'delete' });
      await productService.remove(productToDelete.id);
      showToast('success', `"${productToDelete.name}" fue eliminada.`);
      setProductToDelete(null);
      await loadProducts();
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo eliminar la joya.';
      showToast('error', message);
    } finally {
      setActionState(null);
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
    setCategoryFilter('');
    setSubcategoryFilter('');
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    setSubcategoryFilter('');
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
            backgroundColor: 'var(--accent-vivid, var(--accent))',
            color: 'var(--accent-text)',
            boxShadow: 'var(--shadow-md)',
            whiteSpace: 'nowrap',
          }}
          onHoverStart={(e) => {
            if (!e.currentTarget) return; // Guarda contra desmontaje asíncrono
            (e.currentTarget as HTMLElement).style.backgroundColor =
              'var(--accent-vivid, var(--accent-hover))';
            (e.currentTarget as HTMLElement).style.boxShadow =
              'var(--shadow-accent)';
          }}
          onHoverEnd={(e) => {
            if (!e.currentTarget) return; // Guarda contra desmontaje asíncrono
            (e.currentTarget as HTMLElement).style.backgroundColor =
              'var(--accent-vivid, var(--accent))';
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
        categoryFilter={categoryFilter}
        subcategoryFilter={subcategoryFilter}
        categories={categories}
        availableSubcategories={availableSubcategories}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onCategoryFilterChange={handleCategoryFilterChange}
        onSubcategoryFilterChange={setSubcategoryFilter}
        onClear={handleClearFilters}
      />

      {!loading && !error && products.length > 0 && (
        <motion.p
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-5"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}
        >
          {filteredProducts.length === products.length
            ? `${filteredProducts.length} joya${filteredProducts.length !== 1 ? 's' : ''} disponible${filteredProducts.length !== 1 ? 's' : ''} en el panel`
            : `${filteredProducts.length} joya${filteredProducts.length !== 1 ? 's' : ''} coincide${filteredProducts.length !== 1 ? 'n' : ''} con los filtros activos`}
        </motion.p>
      )}

      {/* ── Listado de productos ─────────────────────────────────── */}
      {loading ? (
        <StateCard
          icon={<Package2 size={24} style={{ color: 'var(--text-muted)' }} />}
          title="Cargando joyas"
          description="Estamos preparando el inventario completo para esta vista."
        />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void loadProducts()} />
      ) : filteredProducts.length === 0 ? (
        <EmptyResultsState onClear={handleClearFilters} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              serverUrl={SERVER_URL}
              processingAction={
                actionState?.id === product.id ? actionState.type : null
              }
              onEdit={handleEdit}
              onToggleVisibility={(p) => {
                void handleToggleVisibility(p);
              }}
              onDelete={handleOpenDelete}
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

      <ConfirmModal
        isOpen={Boolean(productToDelete)}
        variant="danger"
        title="¿Eliminar joya?"
        message={
          productToDelete
            ? `Se eliminará permanentemente "${productToDelete.name}". Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        isLoading={actionState?.type === 'delete'}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        onCancel={() => {
          if (actionState?.type === 'delete') return;
          setProductToDelete(null);
        }}
      />

      <ConfirmModal
        isOpen={Boolean(productToHide)}
        variant="warning"
        title="¿Ocultar joya?"
        message={
          productToHide
            ? `"${productToHide.name}" dejará de aparecer en el catálogo público, pero seguirá disponible en el panel de administración.`
            : ''
        }
        confirmLabel="Sí, ocultar"
        cancelLabel="Cancelar"
        isLoading={actionState?.type === 'visibility'}
        onConfirm={() => {
          void handleConfirmHide();
        }}
        onCancel={() => {
          if (actionState?.type === 'visibility') return;
          setProductToHide(null);
        }}
      />
    </div>
  );
};

interface StateCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const StateCard = ({ icon, title, description }: StateCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center gap-4 rounded-2xl py-16 text-center"
    style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
    }}
  >
    <div
      className="flex h-12 w-12 items-center justify-center rounded-full"
      style={{ backgroundColor: 'var(--bg-tertiary)' }}
    >
      {icon}
    </div>
    <div>
      <p
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </p>
      <p
        className="mt-1"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
        }}
      >
        {description}
      </p>
    </div>
  </motion.div>
);

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center gap-4 rounded-2xl py-16 text-center"
    style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
    }}
  >
    <div
      className="flex h-12 w-12 items-center justify-center rounded-full"
      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
    >
      <AlertCircle size={24} style={{ color: 'var(--color-error)' }} />
    </div>
    <div>
      <p
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-primary)',
        }}
      >
        Error al cargar joyas
      </p>
      <p
        className="mt-1"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
        }}
      >
        {message}
      </p>
    </div>
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onRetry}
      className="flex items-center gap-2 rounded-xl px-5 py-2.5 transition-colors cursor-pointer"
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-medium)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-color)',
        backgroundColor: 'transparent',
      }}
      onHoverStart={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor =
          'var(--bg-hover)';
      }}
      onHoverEnd={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
      }}
    >
      <RefreshCw size={15} />
      Intentar de nuevo
    </motion.button>
  </motion.div>
);

interface EmptyResultsStateProps {
  onClear: () => void;
}

const EmptyResultsState = ({ onClear }: EmptyResultsStateProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center gap-4 rounded-2xl py-16 text-center"
    style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
    }}
  >
    <Search size={32} style={{ color: 'var(--text-muted)' }} />
    <p
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-base)',
        color: 'var(--text-primary)',
      }}
    >
      No se encontraron joyas
    </p>
    <p
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
        maxWidth: '360px',
      }}
    >
      Ajusta la búsqueda o limpia los filtros para volver a ver el inventario
      completo.
    </p>
    <button
      type="button"
      onClick={onClear}
      className="mt-2 rounded-xl px-4 py-2 transition-colors cursor-pointer"
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-medium)',
        color: 'var(--accent-vivid, var(--accent))',
        border: '1px solid var(--accent-vivid, var(--accent))',
        backgroundColor: 'transparent',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor =
          'var(--accent-subtle)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
      }}
    >
      Limpiar filtros
    </button>
  </motion.div>
);
