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
  >
    {TERMS_POLICY.sections.map((section, i) => (
      <PolicySection key={i} section={section} />
    ))}
  </LegalPageLayout>
);
