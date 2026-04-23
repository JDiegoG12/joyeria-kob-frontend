/**
 * @file admin-general-page.tsx
 * @description Página principal del módulo de configuración general
 * del panel de administración de Joyería KOB.
 *
 * ## Estructura visual
 * La página se organiza en secciones temáticas separadas por un encabezado
 * descriptivo. Cada sección agrupa una o más tarjetas de configuración
 * relacionadas. Esta estructura facilita agregar nuevas configuraciones
 * en el futuro sin modificar las secciones existentes.
 *
 * ## Secciones actuales
 * - **Inventario y precios** → `GoldPriceCard`
 *
 * ## Cómo agregar una nueva configuración
 * 1. Crea el componente de tarjeta en `features/general/components/`.
 * 2. Si pertenece a una sección existente, agrégala dentro de ese bloque.
 * 3. Si es una categoría nueva, copia el bloque `<section>` y cambia
 *    el título, descripción e ícono del encabezado.
 *
 * ## Ruta
 * `/admin/general` — protegida por `ProtectedRoute` con rol `ADMIN`.
 */

import { DollarSign } from 'lucide-react';
import { GoldPriceCard } from '@/features/general/components/gold-price-card';

// ─── Tipos internos ───────────────────────────────────────────────────────────

/**
 * Datos de encabezado para una sección de configuración.
 * Se usa para mantener uniforme la apariencia de todas las secciones.
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
 * Encabezado visual reutilizable para cada sección de configuración.
 * Mantiene consistencia tipográfica y de espaciado entre secciones.
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
 * Organiza las configuraciones en secciones temáticas expandibles.
 */
export const AdminGeneralPage = () => (
  <div className="mx-auto max-w-3xl">
    {/* Encabezado de página */}
    <div className="mb-8">
      <div className="flex items-center gap-3">
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--text-primary)',
              lineHeight: 'var(--leading-tight)',
            }}
          >
            Configuración general
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
              marginTop: '2px',
            }}
          >
            Parámetros globales que afectan el comportamiento de toda la
            aplicación.
          </p>
        </div>
      </div>
    </div>

    {/* ── Sección: Inventario y precios ──────────────────────────────────── */}
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
     * ── Aquí irán nuevas secciones en el futuro ──────────────────────────
     *
     * Ejemplo de nueva sección:
     *
     * <div className="mt-10">
     *   <SectionHeader
     *     icon={Store}
     *     title="Información de la tienda"
     *     description="Datos de contacto y ubicación de la joyería."
     *   />
     *   <StoreInfoCard />
     * </div>
     */}
  </div>
);
