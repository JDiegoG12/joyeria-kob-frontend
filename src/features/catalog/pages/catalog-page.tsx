/**
 * @file catalog-page.tsx
 * @description Catálogo público de joyas de Joyería KOB.
 *
 * ## Layout
 * - Desktop (≥1024px): sidebar 1/4 + grid de productos 3/4
 * - Móvil (<1024px): pills de categorías + grid 2 columnas
 *
 * ## Fuente de datos
 * Consume `GET /products/catalog` con paginación y filtros server-side.
 * El backend devuelve 12 productos por página, el rango real de precios de
 * la categoría activa y la metadata de paginación completa.
 *
 * ## Filtros activos
 * - Categoría / subcategoría: gestionados en `category.store`
 * - Rango de precio: estado local (`minPrice`, `maxPrice`), se aplica al soltar el slider
 * - Búsqueda por nombre: filtro client-side sobre los productos de la página actual
 *   (debounced 300 ms). Muestra aviso si hay más páginas para alertar al usuario.
 *
 * ## Buscador
 * El backend no tiene soporte para `search` en `/catalog`, por lo que el filtrado
 * se aplica sobre los productos ya cargados en la página activa. Se muestra un
 * aviso cuando `pagination.totalPages > 1` para que el usuario sepa que puede
 * haber resultados en otras páginas.
 *
 * ## Deep-linking de producto vía query param
 * El catálogo escucha el query param `?product=<uuid>`. Si está presente al
 * montar (o al cambiar), se carga el producto correspondiente y se abre
 * automáticamente el `ProductDetailModal`. Esto permite que la sección
 * "Productos destacados" de la home navegue directamente al detalle de un
 * producto sin duplicar la UI del modal.
 *
 * Cuando el usuario cierra el modal, el query param se limpia para mantener
 * la URL sincronizada con el estado real de la página.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useCategoryStore } from '@/store/category.store';
import { productService } from '@/features/catalog/services/product.service';
import type {
  CatalogPagination,
  CatalogPriceRange,
} from '@/features/catalog/services/product.service';
import { CatalogFilterSidebar } from '@/features/catalog/components/catalog-filter-sidebar';
import { PublicProductCard } from '@/features/catalog/components/public-product-card';
import { ProductDetailModal } from '@/features/catalog/components/product-detail-modal';
import type { Product } from '@/features/catalog/types/product.types';

// ─── Constantes ───────────────────────────────────────────────────────────────

const PRODUCTS_PER_PAGE = 12;
const SEARCH_DEBOUNCE_MS = 300;

// ─── Variantes de animación ───────────────────────────────────────────────────

const gridContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
  exit: {
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

const barVariants: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const emptyVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35 } },
};

// ─── Componente principal ─────────────────────────────────────────────────────

export const CatalogPage = () => {
  const shouldReduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    categories,
    loadCategories,
    selectedCatalogCategoryId,
    selectedCatalogSubCategoryId,
    selectCatalogCategory,
    selectCatalogSubCategory,
  } = useCategoryStore();

  // ── Estado del catálogo ──────────────────────────────────────────────────────

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [pagination, setPagination] = useState<CatalogPagination>({
    total: 0,
    page: 1,
    limit: PRODUCTS_PER_PAGE,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [priceRange, setPriceRange] = useState<CatalogPriceRange | null>(null);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [gridKey, setGridKey] = useState(0);

  // ── Estado del buscador ──────────────────────────────────────────────────────

  /** Texto que el usuario escribe en tiempo real. */
  const [searchInput, setSearchInput] = useState('');
  /** Término debounced que se usa para filtrar. */
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce del término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput.trim().toLowerCase());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Productos filtrados por el buscador client-side
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter((p) => p.name.toLowerCase().includes(searchTerm));
  }, [products, searchTerm]);

  // ── Carga inicial de categorías ──────────────────────────────────────────────

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  // ── Fetch del catálogo server-side ───────────────────────────────────────────

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchCatalog = useCallback(
    async (page: number) => {
      const activeCategoryId =
        selectedCatalogSubCategoryId ?? selectedCatalogCategoryId;

      setLoadingProducts(true);
      try {
        const result = await productService.getCatalog({
          categoryId: activeCategoryId,
          minPrice,
          maxPrice,
          page,
          limit: PRODUCTS_PER_PAGE,
        });

        if (!mountedRef.current) return;

        setProducts(result.products);
        setPagination(result.pagination);
        setPriceRange(result.priceRange);
      } catch {
        if (!mountedRef.current) return;
        setProducts([]);
        setPriceRange(null);
      } finally {
        if (mountedRef.current) setLoadingProducts(false);
      }
    },
    [
      selectedCatalogCategoryId,
      selectedCatalogSubCategoryId,
      minPrice,
      maxPrice,
    ],
  );

  useEffect(() => {
    setCurrentPage(1);
    setGridKey((k) => k + 1);
    setSearchInput(''); // Limpiar búsqueda al cambiar filtros
    void fetchCatalog(1);
  }, [
    selectedCatalogCategoryId,
    selectedCatalogSubCategoryId,
    minPrice,
    maxPrice,
    fetchCatalog,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSearchInput(''); // Limpiar búsqueda al cambiar de página
    void fetchCatalog(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Deep-linking: abrir modal de detalle cuando llega `?product=<uuid>` ──────
  //
  // Caso de uso: la sección "Productos destacados" de la home navega a
  // /catalogo?product=<uuid> al hacer click en una tarjeta. Aquí detectamos
  // ese param y cargamos el producto para reutilizar el `ProductDetailModal`
  // existente del catálogo en lugar de duplicar UI en otra ruta.
  //
  // **Importante sobre el ciclo de cierre del modal**
  // El effect NO depende de `selectedProduct?.id` para evitar reaperturas.
  // Cuando se cierra el modal se hacen DOS updates (`setSelectedProduct(null)`
  // + `setSearchParams({})`); si no viajan en el mismo batch, un render
  // intermedio dejaría `selectedProduct=null` con `productIdFromUrl='X'`, y
  // un effect que mire `selectedProduct?.id` reabriría el modal.
  //
  // **Importante sobre StrictMode (React 19 dev)**
  // El ref `lastFetchedProductIdRef` se asigna DENTRO de la promesa, tras
  // hidratar `selectedProduct`. Si lo hacemos antes del await, el primer
  // run del effect (que StrictMode cancela inmediatamente) deja el ref
  // marcado, y el segundo run salta el fetch sin haber abierto el modal
  // jamás. Asignar el ref después garantiza que solo "recordamos" lo que
  // realmente cargamos en el estado.
  const productIdFromUrl = searchParams.get('product');
  const lastFetchedProductIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!productIdFromUrl) {
      // URL limpia: olvidamos el último id para que una próxima navegación
      // al mismo producto (back/forward, click de nuevo) vuelva a abrir.
      lastFetchedProductIdRef.current = null;
      return;
    }

    // Si ya hidratamos `selectedProduct` con este mismo id, no repetimos
    // el fetch (evita reaperturas tras un cierre y dobles requests en el
    // re-render inmediato a setSelectedProduct).
    if (lastFetchedProductIdRef.current === productIdFromUrl) return;

    let cancelled = false;
    void (async () => {
      try {
        const product = await productService.getById(productIdFromUrl);
        if (!cancelled) {
          // El ref SOLO se marca tras setear el estado. Así StrictMode puede
          // disparar el effect dos veces en montaje sin que la primera (que
          // siempre se cancela) bloquee a la segunda.
          lastFetchedProductIdRef.current = productIdFromUrl;
          setSelectedProduct(product);
        }
      } catch {
        if (!cancelled) {
          // El producto del deep-link no existe o falló su carga: limpiamos
          // el param para que la URL refleje el estado real (sin modal).
          // No tocamos el ref porque nunca se llegó a marcar.
          setSearchParams({}, { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productIdFromUrl, setSearchParams]);

  /**
   * Cierra el modal de detalle y limpia el query param `product` para
   * mantener la URL en sintonía con el estado de la página.
   *
   * El ref `lastFetchedProductIdRef` se limpia automáticamente en el effect
   * cuando `productIdFromUrl` vuelva a `null`, así que aquí no hace falta
   * tocarlo manualmente.
   */
  const handleCloseDetail = () => {
    setSelectedProduct(null);
    if (searchParams.get('product')) {
      setSearchParams({}, { replace: true });
    }
  };

  // ── Callback del slider de precios ───────────────────────────────────────────

  const handlePriceCommit = (
    min: number | undefined,
    max: number | undefined,
  ) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  // ── Datos derivados ──────────────────────────────────────────────────────────

  const rootCategories = categories.filter((c) => c.parentId === null);
  const activeCategory = categories.find(
    (c) => c.id === selectedCatalogCategoryId,
  );
  const subCategories = activeCategory?.children ?? [];

  const resolvedGridVariants = shouldReduceMotion ? {} : gridContainerVariants;
  const resolvedCardVariants = shouldReduceMotion
    ? { hidden: {}, visible: {}, exit: {} }
    : cardVariants;

  /** Si hay búsqueda activa y más páginas, alertar al usuario */
  const showSearchPageWarning =
    searchTerm.length > 0 && pagination.totalPages > 1;

  return (
    <>
      <div
        className="min-h-screen"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div
          className="mx-auto px-4 sm:px-6 lg:px-8"
          style={{ maxWidth: 'var(--content-max-width)' }}
        >
          <div className="flex gap-0 py-8 sm:py-12 lg:gap-0">
            {/* ── Sidebar 1/4 — solo desktop ── */}
            <div
              className="hidden lg:block lg:w-1/4 flex-shrink-0 border-r pr-8"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="sticky top-24">
                <CatalogFilterSidebar
                  priceRange={priceRange}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  onPriceCommit={handlePriceCommit}
                />
              </div>
            </div>

            {/* ── Contenido 3/4 ── */}
            <div className="min-w-0 w-full lg:w-3/4 lg:pl-8">
              {/* Título móvil */}
              <div className="mb-5 lg:hidden">
                <h1
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-3xl)',
                    fontWeight: 'var(--font-bold)',
                    letterSpacing: 'var(--tracking-display)',
                    lineHeight: 'var(--leading-tight)',
                    color: 'var(--text-primary)',
                  }}
                >
                  CATÁLOGO
                </h1>
                <div
                  className="mt-3 h-px w-full"
                  style={{
                    background:
                      'linear-gradient(to right, var(--border-strong) 60%, transparent)',
                  }}
                  aria-hidden="true"
                />
              </div>

              {/* ── Pills de categorías — solo móvil ── */}
              <div className="mb-5 lg:hidden">
                <div className="flex flex-wrap gap-2">
                  {[{ id: null, name: 'Todo' }, ...rootCategories].map(
                    (cat, i) => (
                      <motion.div
                        key={cat.id ?? 'all'}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.25 }}
                      >
                        <CategoryPill
                          label={cat.name}
                          active={selectedCatalogCategoryId === cat.id}
                          onClick={() =>
                            selectCatalogCategory(cat.id as number | null)
                          }
                        />
                      </motion.div>
                    ),
                  )}
                </div>
                <AnimatePresence>
                  {subCategories.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.28 }}
                      className="mt-2 flex flex-wrap gap-2 overflow-hidden"
                    >
                      {subCategories.map((sub, i) => (
                        <motion.div
                          key={sub.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <CategoryPill
                            label={sub.name}
                            active={selectedCatalogSubCategoryId === sub.id}
                            compact
                            onClick={() =>
                              selectCatalogSubCategory(
                                selectedCatalogSubCategoryId === sub.id
                                  ? null
                                  : sub.id,
                              )
                            }
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Barra superior: contador + buscador ── */}
              <motion.div
                variants={barVariants}
                initial="hidden"
                animate="visible"
                className="mb-6 border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                {/* Fila principal: contador izquierda, buscador derecha */}
                <div className="flex items-center gap-4 px-5 py-3">
                  {/* Contador de resultados */}
                  <p
                    className="flex-shrink-0"
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {loadingProducts ? (
                      <span
                        className="inline-block h-4 w-36 animate-pulse rounded"
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                      />
                    ) : (
                      <>
                        {searchTerm ? (
                          <>
                            <motion.span
                              key={filteredProducts.length}
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ display: 'inline-block' }}
                            >
                              {filteredProducts.length}
                            </motion.span>{' '}
                            {filteredProducts.length === 1
                              ? 'resultado'
                              : 'resultados'}{' '}
                            en esta página.
                          </>
                        ) : (
                          <>
                            Hay{' '}
                            <motion.span
                              key={pagination.total}
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ display: 'inline-block' }}
                            >
                              {pagination.total}
                            </motion.span>{' '}
                            {pagination.total === 1 ? 'producto' : 'productos'}.
                          </>
                        )}
                      </>
                    )}
                  </p>

                  {/* Separador vertical */}
                  <div
                    className="hidden h-5 sm:block"
                    style={{
                      width: '1px',
                      backgroundColor: 'var(--border-color)',
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />

                  {/* Buscador */}
                  <div className="relative flex-1">
                    <label htmlFor="catalog-search" className="sr-only">
                      Buscar joya por nombre
                    </label>
                    {/* Ícono de lupa */}
                    <span
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Search size={14} strokeWidth={1.8} />
                    </span>
                    <input
                      id="catalog-search"
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Buscar por nombre…"
                      autoComplete="off"
                      style={{
                        width: '100%',
                        paddingLeft: '2rem',
                        paddingRight: searchInput ? '2rem' : '0.75rem',
                        paddingTop: '0.4rem',
                        paddingBottom: '0.4rem',
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-primary)',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--border-color)',
                        outline: 'none',
                        transition:
                          'border-color 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.boxShadow =
                          '0 0 0 2px var(--accent-subtle)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          'var(--border-color)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    {/* Botón limpiar búsqueda */}
                    <AnimatePresence>
                      {searchInput && (
                        <motion.button
                          type="button"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          onClick={() => setSearchInput('')}
                          aria-label="Limpiar búsqueda"
                          className="absolute right-2.5 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center"
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '2px',
                            color: 'var(--text-muted)',
                            fontSize: '0.6rem',
                          }}
                        >
                          ✕
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Aviso: la búsqueda solo aplica en la página actual */}
                <AnimatePresence>
                  {showSearchPageWarning && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t px-5 py-2"
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                        borderColor: 'var(--border-color)',
                        letterSpacing: 'var(--tracking-wide)',
                      }}
                    >
                      La búsqueda aplica sobre los {products.length} productos
                      de esta página. Navega a otras páginas para buscar en el
                      catálogo completo.
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* ── Grid de productos ── */}
              <AnimatePresence mode="wait">
                {loadingProducts ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProductSkeletonGrid />
                  </motion.div>
                ) : filteredProducts.length > 0 ? (
                  <motion.div
                    key={`grid-${gridKey}-page-${currentPage}-search-${searchTerm}`}
                    className="grid grid-cols-2 gap-4 sm:grid-cols-3"
                    variants={resolvedGridVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {filteredProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        variants={resolvedCardVariants}
                        whileHover={
                          shouldReduceMotion
                            ? {}
                            : {
                                y: -4,
                                boxShadow: 'var(--shadow-md)',
                                transition: { duration: 0.22, ease: 'easeOut' },
                              }
                        }
                        whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                        style={{ cursor: 'pointer' }}
                      >
                        <PublicProductCard
                          product={product}
                          onClick={() => setSelectedProduct(product)}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    variants={emptyVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <EmptyState searchTerm={searchTerm} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Paginación server-side ── */}
              <AnimatePresence>
                {!loadingProducts && pagination.totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <Pagination
                      currentPage={currentPage}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalle — su cierre también limpia el query param ?product */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={handleCloseDetail}
      />
    </>
  );
};

// ─── Componentes auxiliares ───────────────────────────────────────────────────

interface CategoryPillProps {
  label: string;
  active: boolean;
  compact?: boolean;
  onClick: () => void;
}

const CategoryPill = ({
  label,
  active,
  compact = false,
  onClick,
}: CategoryPillProps) => (
  <button
    type="button"
    onClick={onClick}
    className="cursor-pointer border transition-all duration-200"
    style={{
      padding: compact ? '0.3rem 0.65rem' : '0.5rem 0.9rem',
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-xs)',
      fontWeight: active ? 'var(--font-bold)' : 'var(--font-semibold)',
      letterSpacing: 'var(--tracking-widest)',
      textTransform: 'uppercase' as const,
      borderColor: active ? 'var(--accent)' : 'var(--border-color)',
      backgroundColor: active ? 'var(--accent)' : 'transparent',
      color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
    }}
  >
    {label}
  </button>
);

const ProductSkeletonGrid = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="animate-pulse border"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          animationDelay: `${i * 80}ms`,
        }}
      >
        <div className="p-3">
          <div
            className="aspect-square w-full"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          />
        </div>
        <div
          className="h-px w-full"
          style={{ backgroundColor: 'var(--border-color)' }}
        />
        <div className="px-3 pb-4 pt-3 text-center">
          <div
            className="mx-auto h-3 w-3/4 rounded"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          />
          <div
            className="mx-auto mt-2 h-3 w-1/2 rounded"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          />
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ searchTerm }: { searchTerm: string }) => (
  <div
    className="border py-20 text-center"
    style={{ borderColor: 'var(--border-color)' }}
  >
    <div
      className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border"
      style={{
        borderColor: 'var(--border-strong)',
        color: 'var(--text-muted)',
      }}
      aria-hidden="true"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    </div>
    <p
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-semibold)',
        letterSpacing: 'var(--tracking-wide)',
        color: 'var(--text-secondary)',
      }}
    >
      {searchTerm
        ? `No se encontraron joyas con "${searchTerm}" en esta página.`
        : 'No hay productos disponibles en esta categoría.'}
    </p>
  </div>
);

// ─── Paginación ───────────────────────────────────────────────────────────────

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const buildPageRange = (
  currentPage: number,
  totalPages: number,
): (number | null)[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | null)[] = [1];

  if (currentPage > 3) pages.push(null);

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (currentPage < totalPages - 2) pages.push(null);

  pages.push(totalPages);
  return pages;
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  const pageRange = buildPageRange(currentPage, totalPages);

  return (
    <nav
      aria-label="Navegación de páginas del catálogo"
      className="mt-14 flex items-center justify-center gap-1"
    >
      <motion.button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Página anterior"
        whileHover={currentPage !== 1 ? { scale: 1.08 } : {}}
        whileTap={currentPage !== 1 ? { scale: 0.94 } : {}}
        transition={{ duration: 0.15 }}
        className="flex h-9 w-9 cursor-pointer items-center justify-center border transition-colors duration-150 disabled:cursor-not-allowed"
        style={{
          borderColor: 'var(--border-color)',
          color:
            currentPage === 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
          opacity: currentPage === 1 ? 0.4 : 1,
          backgroundColor: 'transparent',
        }}
      >
        <ChevronLeft size={15} strokeWidth={1.5} />
      </motion.button>

      {pageRange.map((page, idx) =>
        page === null ? (
          <span
            key={`ellipsis-${idx}`}
            className="flex h-9 w-9 items-center justify-center"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <motion.button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-label={`Ir a la página ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.15 }}
            className="relative flex h-9 w-9 cursor-pointer items-center justify-center border transition-colors duration-150"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              fontWeight:
                currentPage === page
                  ? 'var(--font-bold)'
                  : 'var(--font-normal)',
              borderColor:
                currentPage === page ? 'var(--accent)' : 'var(--border-color)',
              backgroundColor:
                currentPage === page ? 'var(--accent)' : 'transparent',
              color:
                currentPage === page
                  ? 'var(--accent-text)'
                  : 'var(--text-secondary)',
            }}
          >
            {page}
          </motion.button>
        ),
      )}

      <motion.button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Página siguiente"
        whileHover={currentPage !== totalPages ? { scale: 1.08 } : {}}
        whileTap={currentPage !== totalPages ? { scale: 0.94 } : {}}
        transition={{ duration: 0.15 }}
        className="flex h-9 w-9 cursor-pointer items-center justify-center border transition-colors duration-150 disabled:cursor-not-allowed"
        style={{
          borderColor: 'var(--border-color)',
          color:
            currentPage === totalPages
              ? 'var(--text-muted)'
              : 'var(--text-secondary)',
          opacity: currentPage === totalPages ? 0.4 : 1,
          backgroundColor: 'transparent',
        }}
      >
        <ChevronRight size={15} strokeWidth={1.5} />
      </motion.button>
    </nav>
  );
};
