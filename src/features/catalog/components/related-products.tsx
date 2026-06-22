/**
 * @file related-products.tsx
 * @description Sección "También te puede interesar" de la página completa de
 * producto (`/producto/:slug`). Muestra hasta 6 productos de la misma categoría
 * raíz que el producto actual, excluyéndolo.
 *
 * ## Por qué la categoría raíz (y no la subcategoría exacta)
 * Para asegurar un pool razonable de resultados: una subcategoría muy específica
 * podría tener pocos (o ningún) producto adicional. La categoría raíz agrupa a
 * sus subcategorías, de modo que se muestran "joyas de la misma familia". Si aun
 * así no hay ninguna además de la actual, la sección no se renderiza.
 *
 * ## Comportamiento de las tarjetas
 * Se reutiliza `PublicProductCard` con el mismo patrón que la home: el `<Link>`
 * del nombre apunta a la ficha canónica (`/producto/:slug`) para SEO y
 * ctrl/cmd-click, mientras que el click normal navega a `/catalogo?product=<id>`,
 * que abre el `ProductDetailModal` sobre el catálogo — exactamente el
 * comportamiento de cualquier tarjeta del catálogo.
 *
 * ## Animación
 * La grilla entra al hacer scroll (`whileInView`) con un stagger de tarjetas y
 * cada una tiene lift al hover + hundimiento al press — idéntico al grid del
 * catálogo, para que la sección se sienta parte del mismo sistema. Todo respeta
 * `prefers-reduced-motion`.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
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

// ─── Variantes de animación (mismas que el grid del catálogo) ──────────────────

const gridContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
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
};

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
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} delayMs={i * 80} />
          ))}
        </div>
      </div>
    );
  }

  // Sin relacionados: no renderizamos nada (ni el título).
  if (related.length === 0) return null;

  const resolvedGridVariants = shouldReduceMotion ? {} : gridContainerVariants;
  const resolvedCardVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : cardVariants;

  return (
    <motion.section
      className="mt-12 sm:mt-16"
      aria-labelledby="related-heading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <SectionHeading />
      <motion.div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        variants={resolvedGridVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        {related.map((p) => (
          <motion.div
            key={p.id}
            variants={resolvedCardVariants}
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
            className="h-full"
            style={{ cursor: 'pointer' }}
          >
            <PublicProductCard
              product={p}
              to={buildProductPath(p)}
              onClick={() => navigate(`/catalogo?product=${p.id}`)}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
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
        fontSize: 'var(--text-2xl)',
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
