/**
 * @file information-sections.ts
 * @description Lista única de las secciones de Información usada por la
 * navegación interna (sidebar en desktop, tira en móvil).
 *
 * Se mantiene aparte de los `*.data.ts` de contenido porque es metadato de
 * navegación, no texto legal. El footer ([footer.tsx]) conserva su propia lista
 * a propósito: vive en la capa compartida `components/ui` y no debe depender de
 * una feature; aquí usamos etiquetas cortas pensadas para navegación.
 */

/** Enlace a una sección de Información (etiqueta corta + ruta). */
export interface IInformationLink {
  /** Etiqueta corta para la navegación (no el título completo del documento). */
  label: string;
  /** Ruta absoluta de la página. */
  to: string;
}

/** Secciones de Información en el orden en que se muestran en la navegación. */
export const INFORMATION_SECTIONS: IInformationLink[] = [
  { label: 'Términos', to: '/informacion/terminos' },
  { label: 'Garantía', to: '/informacion/garantia' },
  { label: 'Privacidad', to: '/informacion/privacidad' },
  { label: 'Materiales', to: '/informacion/materiales' },
];
