/**
 * @file policy.types.ts
 * @description Tipos del contenido de las páginas de Información (políticas).
 *
 * El texto de cada documento legal vive en objetos tipados (archivos `*.data.ts`),
 * separado por completo de la capa de presentación. Así el contenido puede
 * editarse sin tocar los componentes ni la lógica de renderizado.
 */

/**
 * Bloque de contenido dentro de una sección. Unión discriminada por `kind`:
 * - `paragraph`: párrafo de texto, con una etiqueta opcional en negrita (`lead`)
 *   al inicio (p. ej. "Productos." seguido del texto).
 * - `list`: lista de viñetas.
 */
export type IPolicyBlock =
  | { kind: 'paragraph'; lead?: string; text: string }
  | { kind: 'list'; items: string[] };

/** Sección del documento: un encabezado opcional (`<h2>`) y sus bloques. */
export interface IPolicySection {
  /** Encabezado de la sección; se renderiza como `<h2>`. Opcional. */
  heading?: string;
  /** Bloques de contenido en orden de aparición. */
  blocks: IPolicyBlock[];
}

/** Documento de política completo (una página de Información). */
export interface IPolicyDocument {
  /** Título principal del documento; se renderiza como `<h1>`. */
  title: string;
  /** Fecha de última actualización en texto (p. ej. "junio de 2026"). */
  lastUpdated: string;
  /** Secciones del documento en orden. */
  sections: IPolicySection[];
}
