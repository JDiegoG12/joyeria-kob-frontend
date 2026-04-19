/**
 * @file home-page.tsx
 * @description Catálogo público con dirección editorial de lujo.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useCategoryStore } from '@/store/category.store';
import { productService } from '@/features/catalog/services/product.service';
import type { Product } from '@/features/catalog/types/product.types';

const FALLBACK_CATEGORIES = [
  { id: -1, label: 'Anillos' },
  { id: -2, label: 'Aretes' },
  { id: -3, label: 'Cadenas' },
  { id: -4, label: 'Pulseras' },
  { id: -5, label: 'Dijes' },
  { id: -6, label: 'Relojes' },
] as const;

const EDITORIAL_FALLBACK = [
  {
    id: 'editorial-anillo',
    name: 'Anillo Meridian',
    description: 'Oro pulido con una silueta limpia y atemporal.',
    category: 'Oro 18k',
    price: '$ 2.850.000',
    image:
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'editorial-aretes',
    name: 'Aretes Celeste',
    description: 'Brillo delicado para ceremonias de todos los días.',
    category: 'Diamantes',
    price: '$ 3.420.000',
    image:
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'editorial-cadena',
    name: 'Cadena Maison',
    description: 'Eslabones finos con caída natural sobre la piel.',
    category: 'Edición limitada',
    price: '$ 1.980.000',
    image:
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1200&q=85',
  },
] as const;

const serverUrl = import.meta.env.VITE_API_URL.replace('/api', '');

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Revela el contenido con fade-in y slide-up cuando entra al viewport.
 */
const Reveal = ({ children, delay = 0, className = '' }: RevealProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.18 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Página de inicio con el catálogo público de joyas.
 * Accesible en la ruta `/catalogo` para todos los usuarios.
 */
export const HomePage = () => {
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

  useEffect(() => {
    loadCategories();
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

  const categoryItems =
    categories.length > 0
      ? categories
          .filter((category) => category.parentId === null)
          .map((category) => ({
            id: category.id,
            label: category.name,
            children: category.children ?? [],
          }))
      : FALLBACK_CATEGORIES;

  const activeCategory = categories.find(
    (category) => category.id === selectedCatalogCategoryId,
  );
  const activeSubCategories = activeCategory?.children ?? [];
  const hasSubCategories = activeSubCategories.length > 0;
  const visibleProducts = useMemo(() => products.slice(0, 8), [products]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <style>
        {`
          @keyframes subCategoryIn {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <section className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-20 px-5 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <Reveal>
          <div className="grid min-h-[62vh] gap-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <div className="max-w-5xl space-y-8">
              <p
                className="uppercase"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-bold)',
                  letterSpacing: 'var(--tracking-widest)',
                  color: 'var(--accent)',
                }}
              >
                Oro 18K · Hecho a medida
              </p>

              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(3.6rem, 10vw, 9rem)',
                  fontWeight: 'var(--font-bold)',
                  lineHeight: 0.86,
                  letterSpacing: 'var(--tracking-display)',
                  color: 'var(--text-primary)',
                  textShadow: '0 24px 90px rgba(0, 0, 0, 0.10)',
                }}
              >
                Lujo diseñado para quedarse.
              </h1>

              <p
                className="max-w-2xl"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-lg)',
                  color: 'var(--text-secondary)',
                }}
              >
                Una curaduría de piezas precisas, silenciosas y memorables.
                Materiales nobles, proporciones serenas y acabados pensados para
                perdurar.
              </p>
            </div>

            <div
              className="rounded-md border border-black/10 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/5"
              style={{
                backgroundColor:
                  'color-mix(in srgb, var(--bg-secondary) 62%, transparent)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 'var(--font-semibold)',
                  lineHeight: 'var(--leading-tight)',
                  color: 'var(--text-primary)',
                }}
              >
                Piezas que imponen presencia.
              </p>
              <p
                className="mt-4"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                }}
              >
                Explora anillos, aretes, cadenas y detalles de brillo íntimo
                desde una selección pensada con criterio de atelier.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="flex flex-col border-y border-black/10 py-5 dark:border-white/5">
            <div className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
              <nav
                className="flex w-max min-w-full items-center gap-8"
                aria-label="Categorías del catálogo"
              >
                <CategoryButton
                  active={selectedCatalogCategoryId === null}
                  label="Todo"
                  onClick={() => selectCatalogCategory(null)}
                />
                {categoryItems.map((category) => (
                  <CategoryButton
                    key={category.id}
                    active={
                      category.id > 0 &&
                      selectedCatalogCategoryId === category.id
                    }
                    label={category.label}
                    onClick={() => {
                      if (category.id > 0) selectCatalogCategory(category.id);
                    }}
                  />
                ))}
              </nav>
            </div>

            <div
              className={`overflow-hidden transition-[max-height,opacity,margin-top] duration-500 ease-out ${
                hasSubCategories
                  ? 'mt-5 max-h-20 opacity-100'
                  : 'mt-0 max-h-0 opacity-0'
              }`}
              aria-hidden={!hasSubCategories}
            >
              <div className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
                <nav
                  className="flex w-max min-w-full items-center gap-3"
                  aria-label="Subcategorías del catálogo"
                >
                  {activeSubCategories.map((subCategory, index) => (
                    <SubCategoryButton
                      key={subCategory.id}
                      active={selectedCatalogSubCategoryId === subCategory.id}
                      label={subCategory.name}
                      delay={index * 55}
                      onClick={() =>
                        selectCatalogSubCategory(
                          selectedCatalogSubCategoryId === subCategory.id
                            ? null
                            : subCategory.id,
                        )
                      }
                    />
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </Reveal>

        <section className="space-y-10" aria-label="Piezas destacadas">
          <Reveal delay={180}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p
                  className="uppercase"
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
                <h2
                  className="mt-2"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(2rem, 4vw, 4rem)',
                    fontWeight: 'var(--font-semibold)',
                    lineHeight: 'var(--leading-tight)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Selección esencial
                </h2>
              </div>
            </div>
          </Reveal>

          {loadingProducts ? (
            <ProductSkeletonGrid />
          ) : visibleProducts.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
              {visibleProducts.map((product, index) => (
                <Reveal key={product.id} delay={80 * index}>
                  <CatalogProductCard product={product} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-3">
              {EDITORIAL_FALLBACK.map((piece, index) => (
                <Reveal key={piece.id} delay={80 * index}>
                  <EditorialProductCard piece={piece} />
                </Reveal>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
};

interface CategoryButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

const CategoryButton = ({ active, label, onClick }: CategoryButtonProps) => (
  <button
    onClick={onClick}
    className="relative flex-shrink-0 cursor-pointer py-2 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
    style={{
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-xs)',
      fontWeight: active ? 'var(--font-bold)' : 'var(--font-semibold)',
      letterSpacing: 'var(--tracking-widest)',
      textTransform: 'uppercase',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    }}
  >
    {label}
    <span
      className={`absolute right-0 -bottom-0.5 left-0 h-px transition-opacity duration-300 ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: 'var(--accent)' }}
    />
  </button>
);

interface SubCategoryButtonProps {
  active: boolean;
  label: string;
  delay: number;
  onClick: () => void;
}

const SubCategoryButton = ({
  active,
  label,
  delay,
  onClick,
}: SubCategoryButtonProps) => (
  <button
    onClick={onClick}
    className="relative flex-shrink-0 cursor-pointer rounded-full border border-black/10 px-4 py-2 opacity-0 transition-[opacity,transform,background-color] duration-500 ease-out hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] dark:border-white/5"
    style={{
      animation: `subCategoryIn 520ms ease-out ${delay}ms forwards`,
      backgroundColor: active
        ? 'color-mix(in srgb, var(--accent) 10%, transparent)'
        : 'color-mix(in srgb, var(--bg-secondary) 38%, transparent)',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-xs)',
      fontWeight: active ? 'var(--font-bold)' : 'var(--font-medium)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      transform: 'translateY(-8px)',
    }}
  >
    {label}
    {active && (
      <span
        className="absolute top-1/2 left-2 h-1 w-1 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: 'var(--accent)' }}
      />
    )}
  </button>
);

const formatPrice = (price: number | string) => {
  return `$ ${Number(price).toLocaleString('es-CO')}`;
};

const CatalogProductCard = ({ product }: { product: Product }) => {
  const image = product.images?.[0]
    ? `${serverUrl}/uploads/products/${product.images[0]}`
    : EDITORIAL_FALLBACK[0].image;

  return (
    <article className="group rounded-md border border-black/10 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.06)] transition-all duration-[600ms] ease-out hover:-translate-y-1 hover:shadow-[0_34px_110px_rgba(0,0,0,0.12)] dark:border-white/5">
      <div className="aspect-[4/5] overflow-hidden rounded-md bg-[var(--bg-tertiary)]">
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <div className="px-1 pt-5">
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
        <h3
          className="mt-2"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-primary)',
            lineHeight: 'var(--leading-tight)',
          }}
        >
          {product.name}
        </h3>
        <p
          className="mt-3 line-clamp-2"
          style={{
            fontFamily: 'var(--font-ui)',
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

const EditorialProductCard = ({
  piece,
}: {
  piece: (typeof EDITORIAL_FALLBACK)[number];
}) => (
  <article className="group rounded-md border border-black/10 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.06)] transition-all duration-[600ms] ease-out hover:-translate-y-1 hover:shadow-[0_34px_110px_rgba(0,0,0,0.12)] dark:border-white/5">
    <div className="aspect-[4/5] overflow-hidden rounded-md bg-[var(--bg-tertiary)]">
      <img
        src={piece.image}
        alt={piece.name}
        className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105"
        loading="lazy"
      />
    </div>
    <div className="px-1 pt-5">
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
        {piece.category}
      </p>
      <h3
        className="mt-2"
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-primary)',
          lineHeight: 'var(--leading-tight)',
        }}
      >
        {piece.name}
      </h3>
      <p
        className="mt-3"
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
        }}
      >
        {piece.description}
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
        {piece.price}
      </p>
    </div>
  </article>
);

const ProductSkeletonGrid = () => (
  <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
    {[1, 2, 3, 4].map((item) => (
      <div
        key={item}
        className="h-[460px] animate-pulse rounded-md border border-black/10 dark:border-white/5"
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--bg-secondary) 54%, transparent)',
        }}
      />
    ))}
  </div>
);
