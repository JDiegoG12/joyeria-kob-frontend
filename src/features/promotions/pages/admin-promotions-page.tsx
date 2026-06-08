/**
 * @file admin-promotions-page.tsx
 * @description Página del módulo de promociones del panel admin de Joyería KOB.
 *
 * Sigue el mismo patrón de encabezado y layout seccionado que
 * `admin-general-page.tsx`. Contiene dos secciones independientes:
 * - **Descuentos por producto** → `ProductDiscountSection`
 * - **Banners del carrusel**    → `PromoBannerSection`
 *
 * ## Ruta
 * `/admin/promociones` — protegida por `ProtectedRoute` con rol `ADMIN`.
 */

import { ImagePlus, Tag } from 'lucide-react';
import { ProductDiscountSection } from '../components/product-discount-section';
import { PromoBannerSection } from '../components/promo-banner-section';

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const SectionHeader = ({
  icon: Icon,
  title,
  description,
}: SectionHeaderProps) => (
  <div className="mb-4 lg:mb-0 lg:pr-6">
    <div className="flex items-center gap-3">
      <Icon
        size={18}
        style={{ color: 'var(--text-muted)', flexShrink: 0 }}
        aria-hidden="true"
      />
      <div>
        <h2
          className="text-[1.05rem] sm:text-[1.15rem] lg:text-[1.25rem]"
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-primary)',
            lineHeight: 'var(--leading-tight)',
          }}
        >
          {title}
        </h2>
        <p
          className="text-[0.9rem] sm:text-sm"
          style={{
            fontFamily: 'var(--font-ui)',
            color: 'var(--text-muted)',
            marginTop: '2px',
          }}
        >
          {description}
        </p>
      </div>
    </div>
  </div>
);

export const AdminPromotionsPage = () => (
  <div
    className="mx-auto w-full max-w-6xl"
    style={{ backgroundColor: 'var(--bg-primary)' }}
  >
    {/* ── Encabezado de página ─────────────────────────────────────── */}
    <div className="mb-8">
      <h1
        className="text-[1.9rem] sm:text-[2.15rem] lg:text-[var(--text-3xl)]"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 'var(--leading-tight)',
        }}
      >
        Promociones
      </h1>
      <p
        className="mt-2 max-w-2xl text-[0.95rem] sm:text-sm"
        style={{
          fontFamily: 'var(--font-body)',
          color: 'var(--text-secondary)',
        }}
      >
        Gestiona los descuentos de productos y los banners promocionales del
        carrusel de la página de inicio.
      </p>
    </div>

    <div className="flex flex-col gap-10 lg:gap-12">
      {/* ── Sección: Descuentos ───────────────────────────────────── */}
      <section
        aria-labelledby="section-discounts"
        className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8"
      >
        <div className="lg:sticky lg:top-[calc(var(--topbar-height)+2rem)] lg:self-start">
          <SectionHeader
            icon={Tag}
            title="Descuentos"
            description="Asigna un valor de descuento en COP a productos del catálogo."
          />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <ProductDiscountSection />
        </div>
      </section>

      {/* ── Sección: Banners del carrusel ─────────────────────────── */}
      <section
        aria-labelledby="section-promo-banners"
        className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8"
      >
        <div className="lg:sticky lg:top-[calc(var(--topbar-height)+2rem)] lg:self-start">
          <SectionHeader
            icon={ImagePlus}
            title="Carrusel"
            description="Imágenes promocionales que aparecen tras el banner principal."
          />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <PromoBannerSection />
        </div>
      </section>
    </div>
  </div>
);
