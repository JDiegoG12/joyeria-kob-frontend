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
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { productService } from '@/features/catalog/services/product.service';
import { ProductDetailContent } from '@/features/catalog/components/product-detail-content';
import {
  buildProductSlug,
  extractProductId,
} from '@/features/catalog/utils/product-slug';
import type { Product } from '@/features/catalog/types/product.types';
import { PageLoader } from '@/features/shared/pages/page-loader';
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

  if (status === 'loading') return <PageLoader />;

  if (status === 'error' || !product) return <ProductNotFound />;

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
          style={{ maxWidth: '64rem' }}
        >
          <div
            className="flex flex-col overflow-hidden border sm:flex-row"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <ProductDetailContent product={product} layout="page" />
          </div>
        </div>
      </div>
    </>
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
        <Link
          to="/catalogo"
          className="mt-8 inline-block border px-6 py-3 transition-colors duration-200 hover:bg-[var(--bg-hover)]"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-accent)',
            borderColor: 'var(--border-strong)',
          }}
        >
          Volver al catálogo
        </Link>
      </div>
    </div>
  </>
);
