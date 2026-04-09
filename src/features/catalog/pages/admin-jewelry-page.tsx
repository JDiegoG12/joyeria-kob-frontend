import { useEffect, useMemo, useState } from 'react';
import { productService } from '../services/product.service';
import type { Product } from '../types/product.types';

export const AdminJewelryPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [material, setMaterial] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await productService.getAll();
        console.log('PRODUCTOS FRONT:', data);
        setProducts(data);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los productos.');
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, []);

  const materials = useMemo(() => {
    const unique = new Set(
      products.map((product) => product.material).filter(Boolean),
    );
    return Array.from(unique);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchLower = search.toLowerCase();

      const matchesSearch =
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower);

      const matchesMaterial = material
        ? product.material.toLowerCase() === material.toLowerCase()
        : true;

      return matchesSearch && matchesMaterial;
    });
  }, [products, search, material]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <h1 className="font-serif text-4xl tracking-tight">
            Gestión de Joyas
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Administra productos, edita y controla su visibilidad.
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 shadow-sm md:flex-row">
          <input
            type="text"
            placeholder="Buscar joya..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-xl border border-[var(--border-color)] bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />

          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="rounded-xl border border-[var(--border-color)] bg-transparent px-4 py-3"
          >
            <option value="">Todos los materiales</option>
            {materials.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearch('');
              setMaterial('');
            }}
            className="rounded-xl border border-[var(--border-color)] px-5 py-3 transition hover:bg-[var(--bg-tertiary)]"
          >
            Limpiar
          </button>
        </div>

        {loading ? (
          <p>Cargando productos...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : filteredProducts.length === 0 ? (
          <p>No hay productos para mostrar.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 shadow-md transition duration-300 hover:shadow-lg"
              >
                <div className="mb-4 flex h-44 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900">
                  <span className="text-sm text-[var(--text-muted)]">
                    {product.imageUrl ? 'Imagen cargada' : product.material}
                  </span>
                </div>

                <h3 className="text-lg font-semibold">{product.name}</h3>

                <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">
                  {product.description}
                </p>

                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  Material: {product.material}
                </p>

                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Stock: {product.stock}
                </p>

                <p className="mt-3 text-xl font-semibold text-[var(--accent)]">
                  ${product.priceCop.toLocaleString('es-CO')}
                </p>

                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-xs ${
                    product.stock > 0
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                      : 'bg-red-500/20 text-red-600 dark:text-red-400'
                  }`}
                >
                  {product.stock > 0 ? 'Disponible' : 'Sin stock'}
                </span>

                <div className="mt-4 flex gap-2">
                  <button className="flex-1 rounded-xl bg-[var(--accent)] py-2 text-white transition hover:opacity-90">
                    Editar
                  </button>

                  <button className="flex-1 rounded-xl border border-[var(--border-color)] py-2 transition hover:bg-[var(--bg-tertiary)]">
                    Ocultar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};