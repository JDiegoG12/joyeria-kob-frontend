/**
 * @file related-products.tsx
 * @description Sección "También te puede interesar" de la página completa de
 * producto (`/producto/:slug`). Muestra hasta 6 productos de la misma categoría
 * raíz que el producto actual, excluyéndolo, en un carrusel horizontal.
 *
 * ## Por qué la categoría raíz (y no la subcategoría exacta)
 * Para asegurar un pool razonable de resultados: una subcategoría muy específica
 * podría tener pocos (o ningún) producto adicional. La categoría raíz agrupa a
 * sus subcategorías, de modo que se muestran "joyas de la misma familia". Si aun
 * así no hay ninguna además de la actual, la sección no se renderiza.
 *
 * ## Carrusel
 * Replica el patrón de los carruseles del sitio (`social-content-carousel`):
 * track `flex overflow-x-auto` con `scroll-snap-type: x mandatory` (inercia
 * táctil nativa, sin librerías), flechas en desktop que se desvanecen en los
 * extremos, dots por slide y soporte de `prefers-reduced-motion`. Se ven varias
 * tarjetas con asomo de la siguiente para invitar al swipe (~2 en móvil, ~3 en
 * tablet, ~4 en desktop).
 *
 * ## Comportamiento de las tarjetas
 * Se reutiliza `PublicProductCard` con el mismo patrón que la home: el `<Link>`
 * del nombre apunta a la ficha canónica (`/producto/:slug`) para SEO y
 * ctrl/cmd-click, mientras que el click normal navega a `/catalogo?product=<id>`,
 * que abre el `ProductDetailModal` sobre el catálogo — exactamente el
 * comportamiento de cualquier tarjeta del catálogo.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { productService } from '@/features/catalog/services/product.service';
import { PublicProductCard } from '@/features/catalog/components/public-product-card';
import { ProductCardSkeleton } from '@/features/catalog/components/product-card-skeleton';
import { buildProductPath } from '@/features/catalog/utils/product-slug';
import type { Product } from '@/features/catalog/types/product.types';

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Máximo de tarjetas a mostrar en la sección. */
const MAX_RELATED = 6;
/**
 * Cuántos productos pedir al backend. Pedimos un poco más del máximo para tener
 * margen al excluir el producto actual de la lista devuelta.
 */
const FETCH_LIMIT = MAX_RELATED + 2;

/**
 * Ancho de cada slide por breakpoint. En móvil la tarjeta es grande y se CENTRA
 * (≈1 visible con asomo simétrico, como el carrusel de redes); desde `sm` se
 * alinea al inicio mostrando varias (≈2 / 3 / 4) con asomo de la siguiente.
 */
const SLIDE_WIDTH = 'w-[84%] shrink-0 sm:w-[44%] md:w-[31.5%] lg:w-[23.5%]';

// ─── Props ───────────────────────────────────────────────────────────────────

interface RelatedProductsProps {
  /** Producto actualmente visible — se usa su categoría y se excluye del listado. */
  product: Product;
}

// ─── Componente ──────────────────────────────────────────────────────────────

/**
 * Sección de productos relacionados por categoría. Se oculta por completo
 * mientras no haya resultados (o si la carga falla), para no dejar un título
 * suelto sin contenido.
 */
export const RelatedProducts = ({ product }: RelatedProductsProps) => {
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Categoría raíz del producto: si es subcategoría, su `parentId`; si es raíz,
  // su propio `id`. Fallback al `categoryId` plano por si `category` no viniera.
  const rootCategoryId =
    product.category?.parentId ?? product.category?.id ?? product.categoryId;

  useEffect(() => {
    if (rootCategoryId == null) {
      setRelated([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);

    productService
      .getCatalog({ categoryId: rootCategoryId, limit: FETCH_LIMIT }, controller.signal)
      .then((result) => {
        if (cancelled) return;
        const filtered = result.products
          .filter((p) => p.id !== product.id)
          .slice(0, MAX_RELATED);
        setRelated(filtered);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled || axios.isCancel(error)) return;
        setRelated([]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [rootCategoryId, product.id]);

  // Mientras carga reservamos espacio con un esqueleto SIN encabezado: así el
  // título "También te puede interesar" solo aparece junto a contenido real y no
  // parpadea (aparecer → desaparecer) cuando la categoría no tiene relacionados.
  if (loading) {
    return (
      <div className="mt-12 sm:mt-16" aria-hidden="true">
        <div className="flex gap-4 overflow-hidden sm:gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={SLIDE_WIDTH}>
              <ProductCardSkeleton delayMs={i * 80} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Sin relacionados: no renderizamos nada (ni el título).
  if (related.length === 0) return null;

  return (
    <motion.section
      className="mt-12 sm:mt-16"
      aria-labelledby="related-heading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <SectionHeading />
      <RelatedCarousel products={related} />
    </motion.section>
  );
};

// ─── Carrusel ──────────────────────────────────────────────────────────────────

interface RelatedCarouselProps {
  products: Product[];
}

/**
 * Carrusel horizontal de tarjetas de producto. Scroll-snap nativo (swipe en
 * táctil), flechas en desktop y dots por slide. Las flechas/dots se ocultan si
 * el contenido no desborda. Respeta `prefers-reduced-motion`.
 */
const RelatedCarousel = ({ products }: RelatedCarouselProps) => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion() ?? false;

  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  /** Si el track desborda; si no, ocultamos flechas y dots. */
  const [overflowing, setOverflowing] = useState(false);

  /**
   * `true` en móvil (`< sm`), donde las tarjetas se anclan al CENTRO. En ese
   * modo la posición de scroll y el índice activo se calculan centrando la
   * tarjeta en el viewport, no alineándola al borde izquierdo. Coincide con el
   * breakpoint del `scroll-snap-align` inyectado más abajo.
   */
  const isCenterMode = (): boolean =>
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 639px)').matches;

  /**
   * Distancia en px entre el inicio de dos slides consecutivos (ancho de la
   * tarjeta + gap). Se mide del DOM para no hardcodear el gap responsive.
   */
  const getStep = useCallback((): number => {
    const a = slideRefs.current[0];
    const b = slideRefs.current[1];
    if (a && b) return b.offsetLeft - a.offsetLeft;
    return a?.offsetWidth ?? 1;
  }, []);

  /** Recalcula `activeIndex`, `canPrev/canNext` y si hay overflow. */
  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    setOverflowing(maxScroll > 1);
    setCanPrev(track.scrollLeft > 1);
    setCanNext(track.scrollLeft < maxScroll - 1);

    let idx: number;
    if (isCenterMode()) {
      // Tarjeta cuyo centro queda más cerca del centro del viewport.
      const viewportCenter = track.scrollLeft + track.clientWidth / 2;
      idx = 0;
      let best = Infinity;
      slideRefs.current.forEach((el, i) => {
        if (!el) return;
        const cardCenter = el.offsetLeft + el.offsetWidth / 2;
        const dist = Math.abs(cardCenter - viewportCenter);
        if (dist < best) {
          best = dist;
          idx = i;
        }
      });
    } else {
      const step = getStep();
      idx = Math.round(track.scrollLeft / step);
    }
    setActiveIndex(Math.max(0, Math.min(products.length - 1, idx)));
  }, [getStep, products.length]);

  /*
   * Suscripción al scroll del track (acotada con rAF) + recálculo en resize.
   * `sync()` inicial cubre el primer render para fijar overflow/flechas.
   */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(sync);
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', sync);
    sync();

    return () => {
      cancelAnimationFrame(rafId);
      track.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', sync);
    };
  }, [sync]);

  /** Avanza ~una página (ancho visible) en la dirección dada. */
  const scrollByPage = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: dir * track.clientWidth * 0.9,
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    });
  };

  /**
   * Lleva el slide `idx` a su posición de reposo: centrado en móvil, alineado al
   * borde izquierdo desde `sm`. En móvil se mide la tarjeta del DOM para
   * centrarla con exactitud (las del medio quedan centradas; la primera y la
   * última reposan en los extremos, como en cualquier carrusel).
   */
  const scrollToIndex = (idx: number) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = slideRefs.current[idx];
    const left =
      isCenterMode() && slide
        ? slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2
        : idx * getStep();
    track.scrollTo({
      left,
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    // Gutters laterales en desktop (`md+`, donde aparecen las flechas) para que
    // vivan FUERA de las tarjetas y nunca queden sobre una. En móvil el carrusel
    // ocupa todo el ancho y la interacción es por swipe.
    <div className="relative md:px-14 lg:px-16">
      {/* Oculta la scrollbar del track y define el anclaje del snap por
          breakpoint: en móvil cada tarjeta se centra (asomo simétrico a ambos
          lados → la activa nunca queda pegada a un lado); desde `sm` se ancla al
          inicio para la fila multi-tarjeta de tablet/desktop. */}
      <style>{`
        [data-related-track]::-webkit-scrollbar { display: none; }
        [data-related-slide] {
          scroll-snap-align: center;
          /* Un swipe = una tarjeta: impide que la inercia salte varias de golpe. */
          scroll-snap-stop: always;
        }
        @media (min-width: 640px) {
          [data-related-slide] {
            scroll-snap-align: start;
            scroll-snap-stop: normal;
          }
        }
      `}</style>

      {/* ── Track ──────────────────────────────────────────────────────────
          `py-2` deja aire vertical para que el lift de hover (y su sombra) no se
          recorte: `overflow-x-auto` fuerza a recortar el eje vertical. */}
      <div
        ref={trackRef}
        data-related-track
        role="region"
        aria-roledescription="carrusel"
        aria-label="Productos relacionados"
        className="flex gap-4 overflow-x-auto px-1 py-2 sm:gap-5"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollSnapType: 'x mandatory',
          scrollBehavior: shouldReduceMotion ? 'auto' : 'smooth',
          overscrollBehaviorX: 'contain',
        }}
      >
        {products.map((p, i) => (
          <div
            key={p.id}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            data-related-slide
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`Producto ${i + 1} de ${products.length}`}
            className={SLIDE_WIDTH}
          >
            <motion.div
              className="h-full"
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: -4,
                      boxShadow: 'var(--shadow-md)',
                      transition: { duration: 0.22, ease: 'easeOut' },
                    }
              }
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              style={{ cursor: 'pointer' }}
            >
              <PublicProductCard
                product={p}
                to={buildProductPath(p)}
                onClick={() => navigate(`/catalogo?product=${p.id}`)}
              />
            </motion.div>
          </div>
        ))}
      </div>

      {/* ── Flechas (desktop) — solo si hay overflow ─────────────────────── */}
      {overflowing && (
        <>
          <CarouselArrow
            direction="prev"
            disabled={!canPrev}
            onClick={() => scrollByPage(-1)}
          />
          <CarouselArrow
            direction="next"
            disabled={!canNext}
            onClick={() => scrollByPage(1)}
          />
        </>
      )}

      {/* ── Dots ─────────────────────────────────────────────────────────── */}
      {overflowing && (
        <div
          className="mt-7 flex items-center justify-center gap-2.5"
          role="tablist"
          aria-label="Seleccionar producto"
        >
          {products.map((p, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                onClick={() => scrollToIndex(i)}
                aria-label={`Ver producto ${i + 1} de ${products.length}`}
                aria-current={isActive ? 'true' : undefined}
                aria-selected={isActive}
                className="cursor-pointer transition-all duration-300 ease-out"
                style={{
                  width: isActive ? '26px' : '8px',
                  height: '8px',
                  borderRadius: '999px',
                  backgroundColor: isActive
                    ? 'var(--accent-marker)'
                    : 'var(--border-strong)',
                  opacity: isActive ? 1 : 0.5,
                  border: 'none',
                  padding: 0,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Flecha de navegación ─────────────────────────────────────────────────────

interface CarouselArrowProps {
  direction: 'prev' | 'next';
  disabled: boolean;
  onClick: () => void;
}

/**
 * Flecha lateral del carrusel. Oculta en móvil (allí la interacción es swipe);
 * visible desde `md`. Mismo diseño discreto que los carruseles del sitio:
 * pastilla circular translúcida con desenfoque que se desvanece en los extremos.
 */
const CarouselArrow = ({ direction, disabled, onClick }: CarouselArrowProps) => {
  const isPrev = direction === 'prev';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-hidden={disabled}
      tabIndex={disabled ? -1 : 0}
      aria-label={isPrev ? 'Productos anteriores' : 'Siguientes productos'}
      className={`absolute top-[calc(50%-1.5rem)] z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full backdrop-blur-sm transition-[opacity,background-color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-default md:flex ${
        isPrev ? 'left-2 lg:left-3' : 'right-2 lg:right-3'
      }`}
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-primary) 80%, transparent)',
        color: 'var(--accent-marker)',
        border:
          '1px solid color-mix(in srgb, var(--border-strong) 70%, transparent)',
        boxShadow: 'var(--shadow-sm)',
        opacity: disabled ? 0 : 1,
        pointerEvents: disabled ? 'none' : undefined,
      }}
    >
      {isPrev ? (
        <ChevronLeft size={18} strokeWidth={1.75} />
      ) : (
        <ChevronRight size={18} strokeWidth={1.75} />
      )}
    </button>
  );
};

// ─── Auxiliares ──────────────────────────────────────────────────────────────

/** Encabezado de la sección, con la estética editorial del sitio. */
const SectionHeading = () => (
  <div className="mb-6 sm:mb-8">
    <h2
      id="related-heading"
      className="uppercase"
      style={{
        fontFamily: 'var(--font-display)',
        // Escala con el viewport: más pequeño en móvil (evita el título enorme
        // que envolvía a dos líneas) y crece hasta `--text-2xl` en desktop.
        fontSize: 'clamp(var(--text-lg), 4.5vw, var(--text-2xl))',
        fontWeight: 'var(--font-bold)',
        letterSpacing: 'var(--tracking-display)',
        lineHeight: 'var(--leading-tight)',
        color: 'var(--text-primary)',
      }}
    >
      También te puede interesar
    </h2>
    <div
      className="mt-3 h-px w-full"
      style={{
        background:
          'linear-gradient(to right, var(--border-strong) 60%, transparent)',
      }}
      aria-hidden="true"
    />
  </div>
);
