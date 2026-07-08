/**
 * @file product-page.tsx
 * @description Página completa de detalle de producto — ruta `/producto/:slug`.
 *
 * A diferencia del `ProductDetailModal` (que se abre como overlay desde el
 * catálogo), esta es una página navegable e indexable con su propia URL,
 * `<title>` y `<meta name="description">`. Reutiliza exactamente la misma UI
 * vía `ProductDetailContent` (`layout="page"`).
 *
 * ## Carga del producto
 * El `:slug` tiene la forma `<nombre-en-slug>-<uuid>`. Se extrae el UUID con
 * {@link extractProductId} y se pide el producto con `productService.getById`.
 * Así una visita directa (sin pasar por el catálogo) renderiza la página
 * completa, no el modal.
 *
 * ## Slug canónico
 * Si el slug de la URL no coincide con el canónico del producto (p. ej. el
 * nombre cambió, o alguien enlazó solo con el id), se reemplaza la URL por la
 * canónica con `navigate(..., { replace: true })` para evitar URLs duplicadas.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useReducedMotion } from 'framer-motion';
import { LayoutGrid } from 'lucide-react';
import { productService } from '@/features/catalog/services/product.service';
import { ProductDetailContent } from '@/features/catalog/components/product-detail-content';
import { ProductBreadcrumb } from '@/features/catalog/components/product-breadcrumb';
import { RelatedProducts } from '@/features/catalog/components/related-products';
import { OutlineButtonLink } from '@/components/ui/outline-button-link';
import {
  buildProductSlug,
  extractProductId,
} from '@/features/catalog/utils/product-slug';
import type { Product } from '@/features/catalog/types/product.types';
import { SITE_NAME, truncateForMeta } from '@/config/seo';
import { buildProductJsonLd } from '@/config/structured-data';

type LoadStatus = 'loading' | 'ready' | 'error';

/** Construye la meta description del producto a partir de su descripción real. */
const buildProductDescription = (product: Product): string => {
  const base =
    product.description?.trim() ||
    `${product.name} en oro 18k, diseño personalizado de ${SITE_NAME}.`;
  return truncateForMeta(base);
};

export const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');

  // ── Carga del producto por el id embebido en el slug ──────────────────────
  useEffect(() => {
    const id = slug ? extractProductId(slug) : null;
    if (!id) {
      setStatus('error');
      return;
    }

    let cancelled = false;
    setStatus('loading');
    productService
      .getById(id)
      .then((p) => {
        if (cancelled) return;
        setProduct(p);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ── Redirección al slug canónico ──────────────────────────────────────────
  useEffect(() => {
    if (status !== 'ready' || !product || !slug) return;
    const canonical = buildProductSlug(product);
    if (slug !== canonical) {
      navigate(`/producto/${canonical}`, { replace: true });
    }
  }, [status, product, slug, navigate]);

  if (status === 'loading') return <ProductPageSkeleton />;

  if (status === 'error' || !product) return <ProductNotFound />;

  // Entrada escalonada coherente con el resto del sitio (fade + leve translate),
  // que respeta `prefers-reduced-motion`. El header entra primero; el bloque del
  // producto lo sigue con un pequeño retardo.
  const headerMotion = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: -8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: 'easeOut' as const },
      };
  const blockMotion = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: {
          duration: 0.5,
          delay: 0.08,
          ease: [0.22, 1, 0.36, 1] as const,
        },
      };

  return (
    <>
      <Helmet>
        <title>{`${product.name} | ${SITE_NAME}`}</title>
        <meta name="description" content={buildProductDescription(product)} />
        {/* Datos estructurados schema.org/Product — misma forma que el backend. */}
        <script type="application/ld+json">
          {JSON.stringify(buildProductJsonLd(product))}
        </script>
      </Helmet>

      <div className="bg-silk min-h-screen">
        <div
          className="mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
          style={{ maxWidth: 'var(--product-max-width)' }}
        >
          {/* ── Cabecera de página: breadcrumb + acción "ir al catálogo" ──
              En sm+ van en una fila (breadcrumb a la izquierda, botón a la
              derecha). En móvil se apilan y el botón ocupa el ancho completo,
              quedando separado de "Comprar por WhatsApp" (que vive en la
              columna de info) para que no compitan. */}
          <motion.div
            {...headerMotion}
            className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <ProductBreadcrumb product={product} mode="page" />
            </div>

            <OutlineButtonLink
              to="/catalogo"
              size="sm"
              className="w-full shrink-0 sm:w-auto"
            >
              <LayoutGrid size={15} strokeWidth={1.8} aria-hidden="true" />
              Ir al catálogo completo
            </OutlineButtonLink>
          </motion.div>

          {/* ── Bloque principal del producto (galería + info) ──
              Se conserva la tarjeta con borde (estética de marca), pero ahora
              rodeada de contexto de página real: breadcrumb arriba, relacionados
              abajo y footer fluyendo, de modo que ya no lee como un modal suelto. */}
          <motion.div
            {...blockMotion}
            className="flex flex-col overflow-hidden border sm:flex-row"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <ProductDetailContent product={product} layout="page" />
          </motion.div>

          {/* ── También te puede interesar ── */}
          <RelatedProducts product={product} />
        </div>
      </div>
    </>
  );
};

// ─── Estado: cargando ────────────────────────────────────────────────────────

/**
 * Esqueleto con la silueta real de la página (cabecera + galería cuadrada +
 * columna de info). Reemplaza al spinner genérico para reducir la sensación de
 * espera y evitar el salto de layout cuando llega el producto.
 */
const ProductPageSkeleton = () => {
  const bar = (className: string) => (
    <div
      className={`animate-pulse ${className}`}
      style={{ backgroundColor: 'var(--bg-tertiary)' }}
    />
  );

  return (
    <div className="bg-silk min-h-screen" aria-hidden="true">
      <div
        className="mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
        style={{ maxWidth: 'var(--product-max-width)' }}
      >
        {/* Cabecera */}
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          {bar('h-4 w-48 rounded')}
          {bar('h-9 w-full sm:w-44')}
        </div>

        {/* Bloque del producto */}
        <div
          className="flex flex-col overflow-hidden border sm:flex-row"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          {bar('aspect-square w-full sm:w-1/2')}
          <div className="w-full p-6 sm:w-1/2 sm:p-8 lg:p-10">
            {bar('h-3 w-40 rounded')}
            {bar('mt-5 h-7 w-3/4 rounded')}
            <div className="mt-5 space-y-2">
              {bar('h-3 w-full rounded')}
              {bar('h-3 w-5/6 rounded')}
              {bar('h-3 w-2/3 rounded')}
            </div>
            <div
              className="mt-8 h-px w-full"
              style={{ backgroundColor: 'var(--border-color)' }}
            />
            {bar('mt-5 h-8 w-1/2 rounded')}
            {bar('mt-6 h-12 w-full')}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Estado: producto no encontrado ──────────────────────────────────────────

/** Mensaje sobrio cuando el slug no resuelve a ningún producto. */
const ProductNotFound = () => (
  <>
    <Helmet>
      <title>{`Producto no encontrado | ${SITE_NAME}`}</title>
      <meta name="robots" content="noindex" />
    </Helmet>

    <div className="bg-silk flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <h1
          className="uppercase"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-3xl)',
            fontWeight: 'var(--font-bold)',
            letterSpacing: 'var(--tracking-display)',
            color: 'var(--text-primary)',
          }}
        >
          Producto no encontrado
        </h1>
        <p
          className="mt-4"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}
        >
          La joya que buscas no está disponible o el enlace es incorrecto.
        </p>
        <OutlineButtonLink to="/catalogo" size="md" className="mt-8">
          Volver al catálogo
        </OutlineButtonLink>
      </div>
    </div>
  </>
);
