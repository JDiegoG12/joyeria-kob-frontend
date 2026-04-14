import { useEffect, useMemo, useState } from 'react';
import { ProductCard } from '../components/product-card';
import { ProductEditForm } from '../components/product-edit-form';
import { ProductFilters } from '../components/product-filters';
import { productService } from '../services/product.service';
import type { Product } from '../types/product.types';

export const AdminJewelryPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await productService.getAll();
      setProducts(data);
    } catch {
      setError('No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchLower = search.toLowerCase();

      const matchesSearch =
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter
        ? product.status === statusFilter
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

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

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setSelectedProduct(null);
    setIsEditOpen(false);
  };

  const handleEditSuccess = async () => {
    await loadProducts();
    handleCloseEdit();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
  };

  const serverUrl = import.meta.env.VITE_API_URL.replace('/api', '');

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 lg:p-8">
      <div className="w-full">
        <div className="mb-10">
          <h1 className="font-serif text-4xl tracking-tight">
            Gestión de Joyas
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Administra productos, edita y controla su visibilidad.
          </p>
        </div>

        <ProductFilters
          search={search}
          statusFilter={statusFilter}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onClear={handleClearFilters}
        />

        {loading ? (
          <p>Cargando productos...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : filteredProducts.length === 0 ? (
          <p>No hay productos para mostrar.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const isProcessing = actionLoadingId === product.id;

              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  serverUrl={serverUrl}
                  isProcessing={isProcessing}
                  onEdit={handleEdit}
                  onToggleVisibility={(selectedProduct) => {
                    void handleToggleVisibility(selectedProduct);
                  }}
                />
              );
            })}
          </div>
        )}

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