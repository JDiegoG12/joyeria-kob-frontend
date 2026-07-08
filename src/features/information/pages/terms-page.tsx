/**
 * @file terms-page.tsx
 * @description Página "Términos y condiciones de uso" — ruta `/informacion/terminos`.
 */

import { LegalPageLayout } from '../components/legal-page-layout';
import { PolicySection } from '../components/policy-section';
import { TERMS_POLICY } from '../data/terms.data';

/** Página de Términos y condiciones de uso. */
export const TermsPage = () => (
  <LegalPageLayout
    title={TERMS_POLICY.title}
    lastUpdated={TERMS_POLICY.lastUpdated}
    breadcrumbLabel="Términos"
    description="Términos y condiciones de uso de Joyería KOB: condiciones de compra, uso del sitio y políticas de nuestras joyas en oro 18k personalizadas."
  >
    {TERMS_POLICY.sections.map((section, i) => (
      <PolicySection key={i} section={section} />
    ))}
  </LegalPageLayout>
);
