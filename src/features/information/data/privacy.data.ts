/**
 * @file privacy.data.ts
 * @description Contenido de "Política de privacidad" (ruta
 * `/informacion/privacidad`). Transcrito del borrador de políticas de KOB Joyería.
 */

import type { IPolicyDocument } from './policy.types';

/** Documento: Política de privacidad. */
export const PRIVACY_POLICY: IPolicyDocument = {
  title: 'Política de privacidad',
  lastUpdated: 'junio de 2026',
  sections: [
    {
      blocks: [
        {
          kind: 'paragraph',
          text: 'KOB Joyería protege los datos personales de sus clientes conforme a la Ley 1581 de 2012 (Habeas Data) de Colombia.',
        },
        {
          kind: 'paragraph',
          lead: 'Datos que recogemos.',
          text: 'A través del sitio web recopilamos nombre completo, número de teléfono, correo electrónico y la lista de favoritos del cliente. Para concretar un pedido, solicitamos adicionalmente el número de documento y la dirección de envío vía WhatsApp.',
        },
        {
          kind: 'paragraph',
          lead: 'Finalidad.',
          text: 'Usamos estos datos únicamente para registrar y gestionar el pedido y realizar los envíos correspondientes.',
        },
        {
          kind: 'paragraph',
          lead: 'Compartir con terceros.',
          text: 'Cuando se concreta una compra, compartimos con la transportadora (Servientrega, Inter Rapidísimo o la transportadora que autorice el cliente) los datos necesarios para realizar el envío (nombre, número de documento, dirección física y teléfono de contacto). Fuera de este caso, no compartimos los datos personales de los clientes con terceros.',
        },
        {
          kind: 'paragraph',
          lead: 'Cookies y análisis.',
          text: 'El sitio utiliza Google Analytics para entender cómo se usa la página y mejorar la experiencia. Esta herramienta puede recopilar datos de navegación mediante cookies.',
        },
        {
          kind: 'paragraph',
          lead: 'Comunicaciones.',
          text: 'No enviamos correos de marketing ni promociones.',
        },
        {
          kind: 'paragraph',
          lead: 'Derechos del titular.',
          text: 'El cliente puede consultar, corregir, actualizar o solicitar la eliminación de sus datos escribiendo a kobjoyeria@gmail.com.',
        },
      ],
    },
  ],
};
