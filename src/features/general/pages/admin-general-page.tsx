/**
 * @file admin-general-page.tsx
 * @description Página principal del módulo de configuración general
 * del panel de administración de Joyería KOB.
 *
 * ## Estructura visual
 * La página sigue el mismo patrón de encabezado que el resto de módulos
 * del panel admin (categorías, joyas, clientes): título en `font-display`
 * a `text-3xl` desde los bordes de la página, sin `max-w` ni ícono en el
 * encabezado principal.
 *
 * ## Layout por secciones
 * En desktop ya no se usa una grilla 1:1 entre tarjetas. Cada categoría
 * de configuración se renderiza como una fila propia con:
 * - una columna izquierda compacta para contexto de sección
 * - una columna derecha más amplia para apilar las tarjetas de esa sección
 *
 * Esto escala mejor cuando una categoría, como Apariencia, acumule varias
 * tarjetas en el futuro y evita que una sola tarjeta quede emparejada de
 * forma artificial con otra sección distinta.
 *
 * ## Secciones actuales
 * - **Inventario y precios** → `GoldPriceCard`
 * - **Apariencia** → `HeroBannerCard`
 * - **Página de inicio** → `FeaturedProductsCard`
 * - **Contenido social** → `SocialContentCard`
 *
 * ## Cómo agregar una nueva configuración
 * 1. Crea el componente de tarjeta en `features/general/components/`.
 * 2. Si pertenece a una sección existente, agrégala dentro de la columna
 *    de tarjetas de ese `<section>`.
 * 3. Si es una categoría nueva, copia el bloque `<section>` con su
 *    `SectionHeader` correspondiente.
 *
 * ## Ruta
 * `/admin/general` — protegida por `ProtectedRoute` con rol `ADMIN`.
 */

import { DollarSign, Layout, Star } from 'lucide-react';

import { GoldPriceCard } from '@/features/general/components/gold-price-card';
import { HeroBannerCard } from '@/features/general/components/hero-banner-card';
import { SocialContentCard } from '@/features/general/components/social-content-card';

import { FeaturedProductsCard } from '@/features/featured-products/components/featured-products-card';

// ─── Tipos internos ───────────────────────────────────────────────────────────

/**
 * Props del encabezado de cada sección de configuración.
 * Se usa para mantener consistencia tipográfica y de espaciado
 * entre todas las secciones de la página.
 */
interface SectionHeaderProps {
  /** Ícono representativo de la sección (componente de lucide-react). */
  icon: React.ElementType;

  /** Título corto de la sección. */
  title: string;

  /** Descripción breve del tipo de configuraciones que contiene. */
  description: string;
}

// ─── Subcomponente: encabezado de sección ────────────────────────────────────

/**
 * Encabezado visual reutilizable para cada bloque de configuración.
 * Muestra un ícono inline, un título y una descripción corta.
 * No debe confundirse con el encabezado de página — este vive dentro
 * del contenido y separa visualmente grupos de tarjetas relacionadas.
 *
 * @internal Solo se usa dentro de `AdminGeneralPage`.
 */
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

// ─── Página ───────────────────────────────────────────────────────────────────

/**
 * Página de configuración general del panel de administración.
 *
 * ## Layout
 * Usa una secuencia vertical de secciones. En desktop cada sección se divide
 * internamente en una columna de contexto y otra de contenido, lo que mantiene
 * el escaneo claro sin obligar a emparejar tarjetas de naturaleza distinta.
 *
 * En móvil y tablet todo colapsa a una sola columna.
 *
 * El encabezado de página sigue el mismo patrón visual que el resto de
 * módulos del panel (categorías, joyas): sin `max-w`, sin ícono contenedor,
 * `font-display` + `text-3xl` para el título principal.
 */
export const AdminGeneralPage = () => (
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
        Configuración general
      </h1>

      <p
        className="mt-2 max-w-2xl text-[0.95rem] sm:text-sm"
        style={{
          fontFamily: 'var(--font-body)',
          color: 'var(--text-secondary)',
        }}
      >
        Parámetros globales que afectan el comportamiento de toda la aplicación.
      </p>
    </div>

    <div className="flex flex-col gap-10 lg:gap-12">
      {/* ── Sección: Inventario y precios ─────────────────────────── */}
      <section
        aria-labelledby="section-prices"
        className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8"
      >
        <div className="lg:sticky lg:top-[calc(var(--topbar-height)+2rem)] lg:self-start">
          <SectionHeader
            icon={DollarSign}
            title="Inventario y precios"
            description="Variables de referencia usadas en el cálculo de precios del catálogo."
          />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <GoldPriceCard />

          {/*
           * Aquí irán futuras tarjetas de esta sección.
           * Ejemplo: <TaxRateCard />, <ShippingBaseCard />
           */}
        </div>
      </section>

      {/* ── Sección: Apariencia ───────────────────────────────────── */}
      <section
        aria-labelledby="section-appearance"
        className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8"
      >
        <div className="lg:sticky lg:top-[calc(var(--topbar-height)+2rem)] lg:self-start">
          <SectionHeader
            icon={Layout}
            title="Apariencia"
            description="Personalización visual de la página de inicio de la tienda."
          />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <HeroBannerCard />

          {/*
           * Aquí irán futuras tarjetas de esta sección.
           * Ejemplo: <AnnouncementBarCard />, <ThemeCard />, <LogoCard />
           */}
        </div>
      </section>

      {/* ── Sección: Página de inicio ─────────────────────────────── */}
      <section
        aria-labelledby="section-home"
        className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8"
      >
        <div className="lg:sticky lg:top-[calc(var(--topbar-height)+2rem)] lg:self-start">
          <SectionHeader
            icon={Star}
            title="Página de inicio"
            description="Productos que aparecen en la sección de destacados de la página de inicio."
          />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <FeaturedProductsCard />

          {/*
           * Aquí irán futuras tarjetas relacionadas con la página de inicio.
           * Ejemplo: <PromoSlidesCard />, <ServicesOrderCard />
           */}
        </div>
      </section>

      {/* ── Sección: Contenido social ─────────────────────────────── */}
      <section
        aria-labelledby="section-social-content"
        className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8"
      >
        <div className="lg:sticky lg:top-[calc(var(--topbar-height)+2rem)] lg:self-start">
          <SectionHeader
            icon={Layout}
            title="Contenido social"
            description="Videos y contenido multimedia mostrado en la página de inicio."
          />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <SocialContentCard />

          {/*
           * Aquí irán futuras tarjetas relacionadas con contenido multimedia.
           * Ejemplo: <InstagramFeedCard />, <TikTokFeedCard />
           */}
        </div>
      </section>
    </div>
  </div>
);