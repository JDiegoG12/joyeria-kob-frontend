/**
 * @file terms.data.ts
 * @description Contenido de "Términos y condiciones de uso" (ruta
 * `/informacion/terminos`). Transcrito del borrador de políticas de KOB Joyería.
 */

import type { IPolicyDocument } from './policy.types';

/** Documento: Términos y condiciones de uso. */
export const TERMS_POLICY: IPolicyDocument = {
  title: 'Términos y condiciones de uso',
  lastUpdated: 'junio de 2026',
  sections: [
    {
      blocks: [
        {
          kind: 'paragraph',
          text: 'Bienvenido a KOB Joyería. Estos términos regulan el uso de nuestro sitio web y la compra de nuestros productos. Al realizar un pedido, aceptas las condiciones aquí descritas.',
        },
        {
          kind: 'paragraph',
          lead: 'Identificación del negocio.',
          // TODO: Confirmar los días de atención (el borrador solo indica el
          // horario 9:00 a.m. a 6:00 p.m.; ej. lunes a sábado).
          text: 'KOB Joyería, ubicada en el Barrio Los Estudiantes, El Bordo, Cauca (Colombia). Contacto: kobjoyeria@gmail.com / WhatsApp 313 500 7459. Horario de atención: 9:00 a.m. a 6:00 p.m.',
        },
        {
          kind: 'paragraph',
          lead: 'Productos.',
          text: 'Nuestras piezas se fabrican en oro de 18k italiano y nacional. La mayoría de los productos se elaboran por encargo, según el pedido de cada cliente, por lo que en la mayoría de los casos no hay disponibilidad inmediata.',
        },
        {
          kind: 'paragraph',
          lead: 'Precios.',
          text: 'Los precios se expresan en pesos colombianos (COP) y no incluyen IVA. Los precios pueden cambiar sin previo aviso; el precio aplicable es el vigente al momento de confirmar el pedido.',
        },
        {
          kind: 'paragraph',
          lead: 'Confirmación del pedido.',
          text: 'Un pedido se considera confirmado cuando el cliente entrega la información solicitada y realiza el primer abono. Como las piezas se fabrican a la medida del pedido, el inicio de la fabricación depende de dicho abono.',
        },
        {
          kind: 'paragraph',
          lead: 'Abonos.',
          text: 'El monto del abono inicial se acuerda entre el cliente y KOB Joyería en cada caso. Si el cliente desea cancelar el pedido antes de que inicie la fabricación, el abono podrá reembolsarse según el acuerdo previo entre ambas partes.',
        },
        {
          kind: 'paragraph',
          lead: 'Comprobante de compra.',
          text: 'El soporte de la compra puede ser la conversación de WhatsApp donde se acuerda el pedido, la cual sirve como respaldo para efectos de garantías y devoluciones.',
        },
        {
          kind: 'paragraph',
          lead: 'Pagos.',
          text: 'Aceptamos transferencias (Nequi y Bancolombia) y efectivo.',
        },
        {
          kind: 'paragraph',
          lead: 'Propiedad intelectual.',
          text: 'Las imágenes, diseños, logotipos y contenidos del sitio son propiedad de KOB Joyería y no pueden reproducirse sin autorización.',
        },
        {
          kind: 'paragraph',
          lead: 'Contacto.',
          text: 'Para cualquier inquietud sobre estos términos, escríbenos a kobjoyeria@gmail.com o por WhatsApp al 313 500 7459.',
        },
      ],
    },
  ],
};
