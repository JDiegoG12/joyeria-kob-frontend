/**
 * @file catalog-page.tsx
 * @description Catálogo público de joyas de Joyería KOB.
 *
 * A diferencia de la home, esta página sí concentra la carga de productos,
 * filtros de categoría y presentación comercial del inventario.
 */

import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useCategoryStore } from '@/store/category.store';
import { productService } from '@/features/catalog/services/product.service';
import type { Product } from '@/features/catalog/types/product.types';

const serverUrl = import.meta.env.VITE_API_URL.replace('/api', '');

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=85';

const formatPrice = (price: number | string) =>
  `$ ${Number(price).toLocaleString('es-CO')}`;

export const CatalogPage = () => {
  const {
    categories,
    loadCategories,
    selectedCatalogCategoryId,
    selectedCatalogSubCategoryId,
    selectCatalogCategory,
    selectCatalogSubCategory,
  } = useCategoryStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    let mounted = true;
    const activeCategoryId =
      selectedCatalogSubCategoryId ?? selectedCatalogCategoryId;

    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const data = await productService.getPublic({
          categoryId: activeCategoryId,
        });
        if (mounted) {
          setProducts(data.filter((product) => product.status !== 'HIDDEN'));
        }
      } catch {
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoadingProducts(false);
      }
    };

    void loadProducts();
    return () => {
      mounted = false;
    };
  }, [selectedCatalogCategoryId, selectedCatalogSubCategoryId]);

  const rootCategories = categories.filter(
    (category) => category.parentId === null,
  );
  const activeCategory = categories.find(
    (category) => category.id === selectedCatalogCategoryId,
  );
  const activeSubCategories = activeCategory?.children ?? [];

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      `${product.name} ${product.description} ${product.category?.name ?? ''}`
        .toLowerCase()
        .includes(query),
    );
  }, [products, search]);

  return (
    <div className="overflow-x-hidden">
      <section className="py-12 sm:py-16">
        <div
          className="mx-auto px-5 sm:px-6 lg:px-10"
          style={{ maxWidth: 'var(--content-max-width)' }}
        >
          <div className="max-w-3xl">
            <p
              className="mb-3 uppercase"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-bold)',
                letterSpacing: 'var(--tracking-widest)',
                color: 'var(--text-muted)',
              }}
            >
              Catálogo
            </p>
            <h1
              className="text-[2.7rem] sm:text-[var(--text-4xl)]"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 'var(--font-bold)',
                lineHeight: 'var(--leading-tight)',
                letterSpacing: 'var(--tracking-display)',
                color: 'var(--text-primary)',
              }}
            >
              Joyas disponibles
            </h1>
            <p className="mt-4">
              Explora piezas publicadas, filtra por categoría y encuentra una
              joya lista para acompañarte o inspirar un encargo a medida.
            </p>
          </div>
        </div>
      </section>

      <section
        className="border-y py-5"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div
          className="mx-auto grid gap-4 px-5 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-10"
          style={{ maxWidth: 'var(--content-max-width)' }}
        >
          <div className="flex min-w-0 flex-wrap gap-2">
            <CategoryButton
              active={selectedCatalogCategoryId === null}
              label="Todo"
              onClick={() => selectCatalogCategory(null)}
            />
            {rootCategories.map((category) => (
              <CategoryButton
                key={category.id}
                active={selectedCatalogCategoryId === category.id}
                label={category.name}
                onClick={() => selectCatalogCategory(category.id)}
              />
            ))}
          </div>

          <label
            className="flex min-w-0 items-center gap-2 rounded-sm border px-3 py-2"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
            }}
          >
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <span className="sr-only">Buscar joya</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar joya"
              className="min-w-0 bg-transparent outline-none"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
              }}
            />
          </label>
        </div>

        {activeSubCategories.length > 0 && (
          <div
            className="mx-auto mt-4 flex flex-wrap gap-2 px-5 sm:px-6 lg:px-10"
            style={{ maxWidth: 'var(--content-max-width)' }}
          >
            {activeSubCategories.map((category) => (
              <CategoryButton
                key={category.id}
                active={selectedCatalogSubCategoryId === category.id}
                label={category.name}
                compact
                onClick={() =>
                  selectCatalogSubCategory(
                    selectedCatalogSubCategoryId === category.id
                      ? null
                      : category.id,
                  )
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="py-12 sm:py-16">
        <div
          className="mx-auto px-5 sm:px-6 lg:px-10"
          style={{ maxWidth: 'var(--content-max-width)' }}
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={18} style={{ color: 'var(--accent)' }} />
              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-secondary)',
                }}
              >
                {visibleProducts.length} piezas
              </p>
            </div>
          </div>

          {loadingProducts ? (
            <ProductSkeletonGrid />
          ) : visibleProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product) => (
                <PublicProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div
              className="rounded-md border p-8 text-center"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-secondary)',
                }}
              >
                No encontramos joyas con estos filtros.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

interface CategoryButtonProps {
  active: boolean;
  label: string;
  compact?: boolean;
  onClick: () => void;
}

const CategoryButton = ({
  active,
  label,
  compact = false,
  onClick,
}: CategoryButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="cursor-pointer rounded-sm border transition-colors duration-200 hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    style={{
      padding: compact ? '0.45rem 0.75rem' : '0.65rem 0.95rem',
      borderColor: active ? 'var(--accent)' : 'var(--border-color)',
      backgroundColor: active ? 'var(--accent)' : 'transparent',
      color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-xs)',
      fontWeight: active ? 'var(--font-bold)' : 'var(--font-semibold)',
      letterSpacing: 'var(--tracking-widest)',
      textTransform: 'uppercase',
    }}
  >
    {label}
  </button>
);

const PublicProductCard = ({ product }: { product: Product }) => {
  const image = product.images?.[0]
    ? `${serverUrl}/uploads/products/${product.images[0]}`
    : FALLBACK_IMAGE;

  return (
    <article
      className="group overflow-hidden rounded-md border shadow-[var(--shadow-sm)] transition-shadow duration-300 hover:shadow-[var(--shadow-md)]"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div
        className="aspect-[4/5] overflow-hidden"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      >
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
          loading="lazy"
        />
      </div>
      <div className="p-5">
        <p
          className="uppercase"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-bold)',
            letterSpacing: 'var(--tracking-wide)',
            color: 'var(--text-muted)',
          }}
        >
          {product.category?.name ?? 'Joyería KOB'}
        </p>
        <h2
          className="mt-2"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-semibold)',
            lineHeight: 'var(--leading-tight)',
            color: 'var(--text-primary)',
          }}
        >
          {product.name}
        </h2>
        <p
          className="mt-3 line-clamp-2"
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
          }}
        >
          {product.description}
        </p>
        <p
          className="mt-5"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--text-primary)',
          }}
        >
          {formatPrice(product.calculatedPrice)}
        </p>
      </div>
    </article>
  );
};

const ProductSkeletonGrid = () => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {[1, 2, 3, 4, 5, 6].map((item) => (
      <div
        key={item}
        className="h-[430px] animate-pulse rounded-md border"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor:
            'color-mix(in srgb, var(--bg-secondary) 64%, transparent)',
        }}
      />
    ))}
  </div>
);
