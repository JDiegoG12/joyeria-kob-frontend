/**
 * @file materials.data.ts
 * @description Contenido de "Materiales" (ruta `/informacion/materiales`).
 * Transcrito del borrador de políticas de KOB Joyería.
 */

import type { IPolicyDocument } from './policy.types';

/** Documento: Materiales. */
export const MATERIALS_POLICY: IPolicyDocument = {
  title: 'Materiales',
  lastUpdated: 'junio de 2026',
  sections: [
    {
      blocks: [
        {
          kind: 'paragraph',
          lead: 'Nuestro material.',
          text: 'Todas las piezas de KOB Joyería están elaboradas en oro de 18k, italiano y nacional. No trabajamos con baños de oro ni enchapados.',
        },
        {
          kind: 'paragraph',
          lead: 'Una inversión que perdura.',
          text: 'Al ser oro de 18k, nuestras piezas no pierden su valor adquisitivo con el tiempo, por lo que además de un accesorio representan una forma de ahorro. El material está garantizado.',
        },
        {
          kind: 'paragraph',
          lead: 'Piel sensible.',
          text: 'Nuestras piezas son aptas para piel sensible, con excepción de las personas alérgicas al oro o a los componentes propios de la aleación.',
        },
      ],
    },
    {
      heading: 'Cuidados recomendados',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Para conservar tus joyas en el mejor estado posible, te recomendamos:',
        },
        {
          kind: 'list',
          items: [
            'Evitar los golpes, el trato brusco y morderlas.',
            'Guardarlas en un lugar seco, idealmente en su estuche o en una bolsa individual, para evitar roces entre piezas.',
            'Quitártelas antes de bañarte, nadar, hacer ejercicio o dormir.',
            'Evitar el contacto con perfumes, cremas, productos de limpieza y otros químicos; ponte la joya al final, después de aplicarte estos productos.',
            'Limpiarlas con un paño suave y seco; si es necesario, usa agua tibia con jabón neutro y seca muy bien antes de guardarlas.',
          ],
        },
      ],
    },
    {
      blocks: [
        {
          kind: 'paragraph',
          lead: 'Garantía.',
          text: 'Respaldamos la autenticidad del oro 18k y su color de por vida. Consulta la Política de garantía para más detalles.',
        },
      ],
    },
  ],
};
