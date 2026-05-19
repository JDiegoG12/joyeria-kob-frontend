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
 * - Búsqueda por nombre: filtro server-side debounced 450 ms.
 *
 * ## Buscador
 * El backend resuelve la búsqueda directamente en SQL (Prisma `contains`), por
 * lo que opera sobre el catálogo completo y devuelve `pagination.total` con el
 * número real de coincidencias.
 *
 * Optimizaciones de tráfico aplicadas:
 * - **Debounce de 450 ms** sobre el input para evitar disparar fetch por cada tecla.
 * - **Mínimo de 2 caracteres**: términos más cortos no se envían al backend.
 * - **Dedup**: si el último fetch fue con la misma combinación de filtros +
 *   página + término, no se vuelve a llamar.
 * - **AbortController**: se cancela el fetch en vuelo cuando llega otro nuevo
 *   para evitar race conditions (que un response viejo pinte resultados
 *   desfasados) y liberar al backend de enviar un response que se descartaría.
 *
 * Al cambiar la categoría, subcategoría o el slider de precio, el input de
 * búsqueda se limpia para evitar combinaciones vacías sorpresivas.
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

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import axios from 'axios';
import { useCategoryStore } from '@/store/category.store';
import { productService } from '@/features/catalog/services/product.service';
import type {
  CatalogPagination,
  CatalogPriceRange,
} from '@/features/catalog/services/product.service';
import { CatalogFilterSidebar } from '@/features/catalog/components/catalog-filter-sidebar';
import { CatalogMobileFiltersSheet } from '@/features/catalog/components/catalog-mobile-filters-sheet';
import { PublicProductCard } from '@/features/catalog/components/public-product-card';
import { ProductDetailModal } from '@/features/catalog/components/product-detail-modal';
import type { Product } from '@/features/catalog/types/product.types';

// ─── Constantes ───────────────────────────────────────────────────────────────

const PRODUCTS_PER_PAGE = 12;
/**
 * Debounce del input de búsqueda antes de disparar el fetch al backend.
 * 450 ms balancea fluidez percibida y ahorro de tráfico (a 300 ms se disparaban
 * llamadas con cada pequeña pausa entre teclas).
 */
const SEARCH_DEBOUNCE_MS = 450;
/**
 * Mínimo de caracteres requeridos para enviar el filtro `search` al backend.
 * Búsquedas de 0 o 1 caracter devolverían demasiados resultados poco útiles y
 * generarían tráfico innecesario.
 */
const SEARCH_MIN_CHARS = 2;

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

  /*
   * Solo necesitamos los IDs seleccionados (para construir el query del
   * backend) y `loadCategories` (defensivo: garantiza la carga aunque la
   * sidebar/sheet también la disparen). Las acciones de selección de
   * categoría viven dentro de los componentes que las controlan.
   */
  const {
    loadCategories,
    selectedCatalogCategoryId,
    selectedCatalogSubCategoryId,
  } = useCategoryStore();

  /**
   * Estado del bottom sheet de filtros móvil.
   *
   * El sheet contiene categorías + slider de precio, reutilizando el
   * `CatalogFilterSidebar` por dentro. Es independiente del sidebar de
   * desktop (que sigue visible en `lg+`) y solo se usa en `<lg`.
   */
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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
  /**
   * Término debounced que se envía al backend.
   *
   * Reglas de transformación respecto a `searchInput`:
   * - Se aplica `trim()` para descartar espacios accidentales.
   * - Si el resultado tiene menos de `SEARCH_MIN_CHARS` caracteres, se
   *   guarda como cadena vacía → no se envía filtro `search` al backend.
   * - **No** se aplica `toLowerCase()`: el backend usa `contains` insensible
   *   a mayúsculas y conservar el case original mejora el texto del contador
   *   y del empty state (`"X resultados para "Anillo""` vs `"anillo"`).
   */
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce del término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      setSearchTerm(trimmed.length >= SEARCH_MIN_CHARS ? trimmed : '');
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

  /**
   * Ref con el AbortController de la petición en vuelo. Antes de disparar una
   * nueva petición se aborta la anterior para evitar race conditions: si el
   * usuario tipea rápido y se encolan dos requests, queremos garantizar que
   * el response que pinta el grid es siempre el del último filtro activo.
   */
  const inFlightControllerRef = useRef<AbortController | null>(null);

  /**
   * Ref con la "key" del último fetch lanzado (combinación serializada de
   * filtros + página + término). Si la siguiente llamada tiene la misma key,
   * se omite el fetch — defensa barata contra duplicados (ej. el debounce
   * dispara pero el término no cambió, o el usuario hace click en la misma
   * página).
   */
  const lastFetchKeyRef = useRef<string | null>(null);

  const fetchCatalog = useCallback(
    async (page: number, search: string) => {
      const activeCategoryId =
        selectedCatalogSubCategoryId ?? selectedCatalogCategoryId;

      const fetchKey = JSON.stringify({
        categoryId: activeCategoryId ?? null,
        minPrice: minPrice ?? null,
        maxPrice: maxPrice ?? null,
        search,
        page,
      });

      if (lastFetchKeyRef.current === fetchKey) return;
      lastFetchKeyRef.current = fetchKey;

      // Cancela la petición previa todavía en vuelo, si la hay.
      inFlightControllerRef.current?.abort();
      const controller = new AbortController();
      inFlightControllerRef.current = controller;

      setLoadingProducts(true);
      try {
        const result = await productService.getCatalog(
          {
            categoryId: activeCategoryId,
            minPrice,
            maxPrice,
            search: search || undefined,
            page,
            limit: PRODUCTS_PER_PAGE,
          },
          controller.signal,
        );

        if (!mountedRef.current || controller.signal.aborted) return;

        setProducts(result.products);
        setPagination(result.pagination);
        setPriceRange(result.priceRange);
      } catch (error) {
        // Una cancelación intencional no es un error real; ignorarla evita
        // limpiar el grid mientras un fetch posterior todavía está cargando.
        if (axios.isCancel(error) || controller.signal.aborted) return;
        if (!mountedRef.current) return;
        setProducts([]);
        setPriceRange(null);
      } finally {
        // Solo apagamos el loader si esta petición sigue siendo la activa;
        // si fue abortada por una posterior, dejamos que esa otra lo apague.
        if (mountedRef.current && inFlightControllerRef.current === controller) {
          setLoadingProducts(false);
        }
      }
    },
    [
      selectedCatalogCategoryId,
      selectedCatalogSubCategoryId,
      minPrice,
      maxPrice,
    ],
  );

  /**
   * Effect de filtros (categoría/precio): resetea la página, limpia el input
   * y el término de búsqueda, y dispara el fetch desde la página 1.
   *
   * Importante: limpiamos `searchTerm` directamente además de `searchInput`
   * para evitar que durante el debounce (450 ms) el contador siga mostrando
   * el término anterior aunque los productos ya correspondan al nuevo filtro.
   * La doble actualización de `searchTerm` que esto provoca (aquí y de nuevo
   * cuando el debounce dispare un setter idéntico) es absorbida por la dedup
   * de `fetchCatalog`.
   */
  useEffect(() => {
    setCurrentPage(1);
    setGridKey((k) => k + 1);
    setSearchInput('');
    setSearchTerm('');
    void fetchCatalog(1, '');
  }, [
    selectedCatalogCategoryId,
    selectedCatalogSubCategoryId,
    minPrice,
    maxPrice,
    fetchCatalog,
  ]);

  /**
   * Effect del buscador server-side: cuando cambia el término debounced,
   * volvemos a página 1 y disparamos un fetch incluyendo `search`.
   *
   * Se separa del effect anterior para no resetear `searchInput` cuando lo
   * único que cambió es el propio término.
   */
  useEffect(() => {
    setCurrentPage(1);
    setGridKey((k) => k + 1);
    void fetchCatalog(1, searchTerm);
  }, [searchTerm, fetchCatalog]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    void fetchCatalog(page, searchTerm);
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

  /**
   * Cantidad de filtros activos — informativo para el botón móvil "Filtros (n)"
   * y la cabecera del bottom sheet.
   *
   * Se cuenta:
   * · Categoría raíz seleccionada (1 si != null).
   * · Subcategoría seleccionada (1 si != null).
   * · Filtro de precio activo (1 si min/max difieren del rango completo
   *   devuelto por el backend).
   *
   * Se evita marcar el precio como "activo" mientras `priceRange` aún es
   * `null` (primera carga), para que el botón no parpadee con "Filtros (1)"
   * antes de que el usuario haga nada.
   */
  const priceFilterActive =
    priceRange !== null &&
    (minPrice !== undefined || maxPrice !== undefined) &&
    (minPrice !== priceRange.min || maxPrice !== priceRange.max);

  const activeFiltersCount =
    (selectedCatalogCategoryId !== null ? 1 : 0) +
    (selectedCatalogSubCategoryId !== null ? 1 : 0) +
    (priceFilterActive ? 1 : 0);

  const resolvedGridVariants = shouldReduceMotion ? {} : gridContainerVariants;
  const resolvedCardVariants = shouldReduceMotion
    ? { hidden: {}, visible: {}, exit: {} }
    : cardVariants;

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

              {/* ── Botón "Filtros" — solo móvil ──
               *
               * Reemplaza los pills horizontales (que no escalaban bien con
               * muchas categorías y dejaban el slider de precio fuera del
               * alcance del usuario móvil). Abre el bottom sheet con
               * categorías + slider de precio en una sola UI consistente.
               *
               * El badge "(n)" solo aparece cuando hay filtros activos —
               * evita ruido visual en el estado limpio.
               */}
              <div className="mb-5 lg:hidden">
                <motion.button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  className="flex w-full cursor-pointer items-center justify-between border px-4 py-3 transition-colors duration-200 hover:bg-[var(--bg-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  style={{
                    borderColor:
                      activeFiltersCount > 0
                        ? 'var(--accent)'
                        : 'var(--border-strong)',
                    backgroundColor: 'transparent',
                  }}
                  aria-label={
                    activeFiltersCount > 0
                      ? `Abrir filtros, ${activeFiltersCount} activos`
                      : 'Abrir filtros del catálogo'
                  }
                  aria-haspopup="dialog"
                  aria-expanded={mobileFiltersOpen}
                >
                  <span className="flex items-center gap-2.5">
                    <Filter
                      size={15}
                      strokeWidth={1.8}
                      style={{
                        color:
                          activeFiltersCount > 0
                            ? 'var(--accent)'
                            : 'var(--text-secondary)',
                      }}
                      aria-hidden="true"
                    />
                    <span
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-bold)',
                        letterSpacing: 'var(--tracking-widest)',
                        textTransform: 'uppercase',
                        color:
                          activeFiltersCount > 0
                            ? 'var(--text-accent)'
                            : 'var(--text-secondary)',
                      }}
                    >
                      Filtros
                    </span>
                  </span>

                  {/*
                   * Badge contador animado: aparece/desaparece con AnimatePresence
                   * para suavizar la transición entre "sin filtros" y "n filtros".
                   */}
                  <AnimatePresence mode="popLayout">
                    {activeFiltersCount > 0 && (
                      <motion.span
                        key={activeFiltersCount}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="inline-flex h-5 min-w-5 items-center justify-center px-1.5"
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '10px',
                          fontWeight: 'var(--font-bold)',
                          letterSpacing: 'var(--tracking-wide)',
                          color: 'var(--accent-text)',
                          backgroundColor: 'var(--accent)',
                          borderRadius: '999px',
                          lineHeight: 1,
                        }}
                      >
                        {activeFiltersCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
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
                              key={pagination.total}
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ display: 'inline-block' }}
                            >
                              {pagination.total}
                            </motion.span>{' '}
                            {pagination.total === 1
                              ? 'resultado'
                              : 'resultados'}{' '}
                            para &ldquo;{searchTerm}&rdquo;.
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
                ) : products.length > 0 ? (
                  <motion.div
                    key={`grid-${gridKey}-page-${currentPage}`}
                    className="grid grid-cols-2 gap-4 sm:grid-cols-3"
                    variants={resolvedGridVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {products.map((product) => (
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
                        className="h-full"
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

      {/*
       * Bottom sheet de filtros móviles.
       * El propio componente lleva `lg:hidden` internamente, así que es
       * seguro montarlo siempre — no afecta la vista desktop.
       */}
      <CatalogMobileFiltersSheet
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        priceRange={priceRange}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onPriceCommit={handlePriceCommit}
        productCount={pagination.total}
        activeFiltersCount={activeFiltersCount}
      />
    </>
  );
};

// ─── Componentes auxiliares ───────────────────────────────────────────────────

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
        ? `No se encontraron joyas con "${searchTerm}".`
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
