/**
 * @file customer-actions.tsx
 * @description Acciones de contacto y favoritos sobre un cliente.
 *
 * - Correo: abre el cliente de correo del admin (`mailto:`).
 * - WhatsApp: abre WhatsApp con el número del cliente (`wa.me`). Se deshabilita
 *   si el cliente no registró teléfono.
 * - Favoritos: abre el drawer con los favoritos del cliente (muestra el conteo).
 *
 * Se usa tanto en la tabla de escritorio (`variant="row"`, iconos compactos)
 * como en la tarjeta móvil (`variant="stack"`, botones con etiqueta).
 */

import { Heart, Mail, MessageCircle } from 'lucide-react';
import { useCustomerStore } from '@/features/customers/store/customer.store';
import {
  buildCustomerWhatsAppUrl,
  buildMailtoUrl,
} from '@/features/customers/utils/contact';
import type { Customer } from '@/features/customers/types/customer.types';

interface CustomerActionsProps {
  customer: Customer;
  /** `row`: iconos compactos (tabla). `stack`: botones con etiqueta (móvil). */
  variant?: 'row' | 'stack';
}

/** Mensaje de WhatsApp pre-redactado hacia el cliente. */
const buildGreeting = (customer: Customer): string =>
  `Hola ${customer.name}, te escribimos de Joyería KOB.`;

export const CustomerActions = ({
  customer,
  variant = 'row',
}: CustomerActionsProps) => {
  const openFavorites = useCustomerStore((s) => s.openFavorites);

  const mailtoUrl = buildMailtoUrl(customer.email, 'Joyería KOB');
  const whatsappUrl = buildCustomerWhatsAppUrl(
    customer.phone,
    buildGreeting(customer),
  );
  const hasPhone = Boolean(whatsappUrl);

  const isStack = variant === 'stack';

  // Clases base compartidas: icono-botón compacto vs botón con etiqueta.
  const baseClass = isStack
    ? 'flex flex-1 items-center justify-center gap-2 border px-3 py-2 transition-colors duration-200'
    : 'flex h-9 w-9 items-center justify-center border transition-colors duration-200';

  return (
    <div
      className={
        isStack ? 'flex w-full items-stretch gap-2' : 'flex items-center gap-2'
      }
    >
      {/* Correo */}
      <a
        href={mailtoUrl}
        className={`${baseClass} hover:bg-[var(--bg-hover)]`}
        style={{
          borderColor: 'var(--border-strong)',
          color: 'var(--text-secondary)',
        }}
        title={`Enviar correo a ${customer.email}`}
        aria-label={`Enviar correo a ${customer.email}`}
      >
        <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
        {isStack && <span style={{ fontSize: 'var(--text-sm)' }}>Correo</span>}
      </a>

      {/* WhatsApp */}
      {hasPhone ? (
        <a
          href={whatsappUrl as string}
          target="_blank"
          rel="noopener noreferrer"
          className={`${baseClass} hover:bg-[var(--bg-hover)]`}
          style={{
            borderColor: 'var(--border-strong)',
            color: 'var(--text-secondary)',
          }}
          title={`Escribir por WhatsApp a ${customer.phone}`}
          aria-label={`Escribir por WhatsApp a ${customer.name}`}
        >
          <MessageCircle size={16} strokeWidth={1.8} aria-hidden="true" />
          {isStack && (
            <span style={{ fontSize: 'var(--text-sm)' }}>WhatsApp</span>
          )}
        </a>
      ) : (
        <span
          className={baseClass}
          style={{
            borderColor: 'var(--border-color)',
            color: 'var(--text-muted)',
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
          title="El cliente no registró teléfono"
          aria-label="El cliente no registró teléfono"
        >
          <MessageCircle size={16} strokeWidth={1.8} aria-hidden="true" />
          {isStack && (
            <span style={{ fontSize: 'var(--text-sm)' }}>WhatsApp</span>
          )}
        </span>
      )}

      {/* Favoritos */}
      <button
        type="button"
        onClick={() => void openFavorites(customer)}
        className={`${baseClass} hover:bg-[var(--bg-hover)]`}
        style={{
          borderColor: 'var(--border-strong)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
        title={`Ver favoritos (${customer.favoritesCount})`}
        aria-label={`Ver favoritos de ${customer.name}`}
      >
        <Heart size={16} strokeWidth={1.8} aria-hidden="true" />
        {isStack ? (
          <span style={{ fontSize: 'var(--text-sm)' }}>
            Favoritos ({customer.favoritesCount})
          </span>
        ) : (
          customer.favoritesCount > 0 && (
            <span
              className="ml-1"
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-semibold)',
              }}
            >
              {customer.favoritesCount}
            </span>
          )
        )}
      </button>
    </div>
  );
};
