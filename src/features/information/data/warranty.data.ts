/**
 * @file warranty.data.ts
 * @description Contenido de "Política de garantía, reembolso y devoluciones"
 * (ruta `/informacion/garantia`). Transcrito del borrador de políticas de KOB
 * Joyería.
 */

import type { IPolicyDocument } from './policy.types';

/** Documento: Política de garantía, reembolso y devoluciones. */
export const WARRANTY_POLICY: IPolicyDocument = {
  title: 'Política de garantía, reembolso y devoluciones',
  lastUpdated: 'junio de 2026',
  sections: [
    {
      blocks: [
        {
          kind: 'paragraph',
          text: 'En KOB Joyería respaldamos la calidad de nuestras piezas. Esta política se rige por el Estatuto del Consumidor de Colombia (Ley 1480 de 2011).',
        },
      ],
    },
    {
      heading: 'Garantía del material (de por vida)',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Garantizamos de por vida que el material de nuestras piezas es oro de 18k. Si se comprueba un error en la aleación (es decir, que el oro no sea 18k), la pieza será corregida o repuesta sin costo.',
        },
      ],
    },
    {
      heading: 'Garantía de color',
      blocks: [
        {
          kind: 'paragraph',
          text: 'El oro de 18k no cambia de color. Si una pieza llegara a cambiar de color, está cubierta por la garantía. No realizamos baños en oro, por lo que no aplica garantía de baño.',
        },
      ],
    },
    {
      heading: 'Defectos de fabricación',
      blocks: [
        {
          kind: 'paragraph',
          // TODO: Confirmar con el cliente el alcance, plazo y condiciones de la
          // cobertura por defectos de fabricación.
          text: 'La garantía cubre defectos de fabricación, tales como fallas en broches, soldaduras o el armado de la pieza, que se presenten en condiciones normales de uso.',
        },
      ],
    },
    {
      heading: 'Qué NO cubre la garantía',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Mal uso por parte del cliente, golpes, trato brusco, mordiscos, desgaste normal de la pieza, robo o pérdida.',
        },
      ],
    },
    {
      heading: 'Derecho de retracto y devoluciones',
      blocks: [
        {
          kind: 'paragraph',
          text: 'El cliente puede solicitar una devolución o cambio dentro de los 7 días siguientes a la compra, siempre que el artículo esté sin uso y se cuente con el soporte de compra. Distinguimos dos casos:',
        },
        {
          kind: 'list',
          items: [
            'Piezas no personalizadas: dentro de los 7 días, el cliente puede solicitar la devolución y se reintegra el valor pagado. KOB Joyería asume el costo del envío de la devolución.',
            'Piezas personalizadas (con nombre, fechas u otros elementos a la medida): por su naturaleza, estas piezas no admiten cambio ni devolución, salvo defecto de fabricación o error en el material.',
          ],
        },
      ],
    },
    {
      heading: 'Reembolsos',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Cuando proceda un reembolso, el cliente puede elegir entre: (a) el cambio o nueva fabricación de la joya, o (b) la devolución del dinero. En el caso de devolución de dinero de piezas ya fabricadas, se descuenta el valor del diseño y la mano de obra. Para piezas no personalizadas devueltas dentro del derecho de retracto, se reintegra el valor pagado conforme a la ley.',
        },
      ],
    },
    {
      heading: 'Costo del envío de devoluciones',
      blocks: [
        {
          kind: 'paragraph',
          text: 'KOB Joyería asume el costo del envío de las devoluciones.',
        },
      ],
    },
    {
      heading: 'Cómo solicitar una garantía o devolución',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Escríbenos por WhatsApp al 313 500 7459 o al correo kobjoyeria@gmail.com, indicando los datos del pedido y el motivo.',
        },
      ],
    },
  ],
};
