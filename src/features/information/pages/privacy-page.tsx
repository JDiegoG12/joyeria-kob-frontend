/**
 * @file privacy-page.tsx
 * @description Página "Política de privacidad" — ruta `/informacion/privacidad`.
 */

import { LegalPageLayout } from '../components/legal-page-layout';
import { PolicySection } from '../components/policy-section';
import { PRIVACY_POLICY } from '../data/privacy.data';

/** Página de Política de privacidad. */
export const PrivacyPage = () => (
  <LegalPageLayout
    title={PRIVACY_POLICY.title}
    lastUpdated={PRIVACY_POLICY.lastUpdated}
    breadcrumbLabel="Privacidad"
    description="Política de privacidad de Joyería KOB: cómo recolectamos, usamos y protegemos tus datos personales al comprar joyas de oro 18k."
  >
    {PRIVACY_POLICY.sections.map((section, i) => (
      <PolicySection key={i} section={section} />
    ))}
  </LegalPageLayout>
);
