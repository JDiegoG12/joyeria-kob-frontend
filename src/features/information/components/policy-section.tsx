/**
 * @file policy-section.tsx
 * @description Sección de un documento de política: un encabezado opcional
 * (`<h2>`) seguido de sus bloques de contenido (párrafos y listas).
 *
 * Reutilizable únicamente dentro de la feature `information`. El texto proviene
 * de los datos tipados (`data/*.data.ts`); aquí solo vive la presentación.
 */

import type { IPolicyBlock, IPolicySection } from '../data/policy.types';

interface PolicySectionProps {
  /** Sección a renderizar (encabezado opcional + bloques). */
  section: IPolicySection;
}

/**
 * Renderiza una sección de política: encabezado `<h2>` (si existe) y sus bloques
 * en orden.
 *
 * @param section - Datos de la sección provenientes de `data/`.
 */
export const PolicySection = ({ section }: PolicySectionProps) => (
  <section className="mt-10 first:mt-0">
    {section.heading && (
      <h2
        translate="no"
        className="mb-3"
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--font-semibold)',
          letterSpacing: 'var(--tracking-tight)',
          color: 'var(--text-primary)',
        }}
      >
        {section.heading}
      </h2>
    )}

    <div className="space-y-4">
      {section.blocks.map((block, i) => (
        <PolicyBlockView key={i} block={block} />
      ))}
    </div>
  </section>
);

interface PolicyBlockViewProps {
  /** Bloque de contenido (párrafo o lista). */
  block: IPolicyBlock;
}

/**
 * Renderiza un único bloque de contenido. Hace early-return según `kind` para
 * evitar anidación: `list` → lista de viñetas; `paragraph` → párrafo con una
 * etiqueta opcional en negrita (`lead`) al inicio.
 *
 * @param block - Bloque a renderizar.
 */
const PolicyBlockView = ({ block }: PolicyBlockViewProps) => {
  if (block.kind === 'list') {
    return (
      <ul className="ml-5 list-disc space-y-2.5">
        {block.items.map((item, i) => (
          <li key={i} style={POLICY_TEXT_STYLE}>
            {item}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p style={POLICY_TEXT_STYLE}>
      {block.lead && (
        <strong style={{ color: 'var(--text-primary)' }}>
          {block.lead}{' '}
        </strong>
      )}
      {block.text}
    </p>
  );
};

/** Estilo compartido del cuerpo de texto: legible y con buen interlineado. */
const POLICY_TEXT_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-base)',
  lineHeight: 'var(--leading-relaxed)',
  color: 'var(--text-secondary)',
};
