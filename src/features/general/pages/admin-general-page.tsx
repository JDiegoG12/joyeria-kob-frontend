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
 * El contenido de configuración sí usa `max-w-3xl` para que las tarjetas
 * no se estiren indefinidamente en pantallas muy anchas.
 *
 * ## Secciones actuales
 * - **Apariencia** → `HeroBannerCard`
 * - **Inventario y precios** → `GoldPriceCard`
 *
 * ## Cómo agregar una nueva configuración
 * 1. Crea el componente de tarjeta en `features/general/components/`.
 * 2. Si pertenece a una sección existente, agrégala dentro de ese bloque `<section>`.
 * 3. Si es una categoría nueva, copia el bloque `<section>` y cambia
 *    el título, descripción e ícono del `SectionHeader`.
 *
 * ## Ruta
 * `/admin/general` — protegida por `ProtectedRoute` con rol `ADMIN`.
 */

import { DollarSign, Layout } from 'lucide-react';
import { GoldPriceCard } from '@/features/general/components/gold-price-card';
import { HeroBannerCard } from '@/features/general/components/hero-banner-card';

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
  <div className="mb-4 flex items-center gap-3">
    <Icon
      size={18}
      style={{ color: 'var(--text-muted)', flexShrink: 0 }}
      aria-hidden="true"
    />
    <div>
      <h2
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-primary)',
          lineHeight: 'var(--leading-tight)',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-muted)',
          marginTop: '2px',
        }}
      >
        {description}
      </p>
    </div>
  </div>
);

// ─── Página ───────────────────────────────────────────────────────────────────

/**
 * Página de configuración general del panel de administración.
 *
 * El encabezado de página sigue el mismo patrón visual que el resto de
 * módulos del panel (categorías, joyas): sin `max-w`, sin ícono contenedor,
 * `font-display` + `text-3xl` para el título principal.
 *
 * El área de tarjetas usa `max-w-3xl` para que el contenido editable no
 * se estire en pantallas muy anchas, mejorando la legibilidad del formulario.
 */
export const AdminGeneralPage = () => (
  <div style={{ backgroundColor: 'var(--bg-primary)' }}>
    {/* ── Encabezado de página — sin max-w, igual que categorías ────────── */}
    <div className="mb-8">
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-3xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 'var(--leading-tight)',
        }}
      >
        Configuración general
      </h1>
      <p
        className="mt-2"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
        }}
      >
        Parámetros globales que afectan el comportamiento de toda la aplicación.
      </p>
    </div>

    {/* ── Contenido de configuración — max-w para legibilidad del formulario */}
    <div className="max-w-3xl space-y-10">
      {/* ── Sección: Apariencia ─────────────────────────────────────────── */}
      <section aria-labelledby="section-appearance">
        <SectionHeader
          icon={Layout}
          title="Apariencia"
          description="Personalización visual de la página principal de la tienda."
        />

        <HeroBannerCard />

        {/*
         * Aquí irán futuras tarjetas de esta sección.
         * Ejemplo: <AnnouncementBarCard />, <ThemeCard />
         */}
      </section>

      {/* ── Sección: Inventario y precios ──────────────────────────────── */}
      <section aria-labelledby="section-prices">
        <SectionHeader
          icon={DollarSign}
          title="Inventario y precios"
          description="Variables de referencia usadas en el cálculo de precios del catálogo."
        />

        <GoldPriceCard />

        {/*
         * Aquí irán futuras tarjetas de esta sección.
         * Ejemplo: <TaxRateCard />, <ShippingBaseCard />
         */}
      </section>

      {/*
       * ── Aquí irán nuevas secciones en el futuro ────────────────────────
       *
       * Ejemplo de nueva sección:
       *
       * <div>
       *   <SectionHeader
       *     icon={Store}
       *     title="Información de la tienda"
       *     description="Datos de contacto y ubicación de la joyería."
       *   />
       *   <StoreInfoCard />
       * </div>
       */}
    </div>
  </div>
);
