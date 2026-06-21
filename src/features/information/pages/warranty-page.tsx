/**
 * @file warranty-page.tsx
 * @description Página "Política de garantía, reembolso y devoluciones" — ruta
 * `/informacion/garantia`.
 */

import { LegalPageLayout } from '../components/legal-page-layout';
import { PolicySection } from '../components/policy-section';
import { WARRANTY_POLICY } from '../data/warranty.data';

/** Página de Política de garantía, reembolso y devoluciones. */
export const WarrantyPage = () => (
  <LegalPageLayout
    title={WARRANTY_POLICY.title}
    lastUpdated={WARRANTY_POLICY.lastUpdated}
    breadcrumbLabel="Garantía"
    description="Política de garantía, reembolso y devoluciones de Joyería KOB para joyas de oro 18k personalizadas. Conoce tus derechos y nuestros tiempos."
  >
    {WARRANTY_POLICY.sections.map((section, i) => (
      <PolicySection key={i} section={section} />
    ))}
  </LegalPageLayout>
);
