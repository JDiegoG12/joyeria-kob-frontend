/**
 * @file materials-page.tsx
 * @description Página "Materiales" — ruta `/informacion/materiales`.
 */

import { LegalPageLayout } from '../components/legal-page-layout';
import { PolicySection } from '../components/policy-section';
import { MATERIALS_POLICY } from '../data/materials.data';

/** Página de Materiales. */
export const MaterialsPage = () => (
  <LegalPageLayout
    title={MATERIALS_POLICY.title}
    lastUpdated={MATERIALS_POLICY.lastUpdated}
  >
    {MATERIALS_POLICY.sections.map((section, i) => (
      <PolicySection key={i} section={section} />
    ))}
  </LegalPageLayout>
);
