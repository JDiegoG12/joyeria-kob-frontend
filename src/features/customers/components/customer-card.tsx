/**
 * @file customer-card.tsx
 * @description Tarjeta de cliente para vista móvil (`md:hidden`).
 * Muestra la misma información que la fila de la tabla, apilada verticalmente.
 */

import { Mail, Phone } from 'lucide-react';
import { CustomerActions } from '@/features/customers/components/customer-actions';
import { fullName, formatDate } from '@/features/customers/utils/format';
import type { Customer } from '@/features/customers/types/customer.types';

interface CustomerCardProps {
  customer: Customer;
}

export const CustomerCard = ({ customer }: CustomerCardProps) => {
  return (
    <div
      className="flex flex-col gap-3 border p-4"
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      {/* Encabezado: nombre + fecha de registro */}
      <div className="flex items-start justify-between gap-2">
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-primary)',
          }}
        >
          {fullName(customer)}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
          }}
        >
          {formatDate(customer.createdAt)}
        </span>
      </div>

      {/* Datos de contacto */}
      <div className="flex flex-col gap-1.5">
        <span
          className="flex items-center gap-2"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
          }}
        >
          <Mail size={14} strokeWidth={1.8} aria-hidden="true" />
          {customer.email}
        </span>
        <span
          className="flex items-center gap-2"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: customer.phone ? 'var(--text-secondary)' : 'var(--text-muted)',
          }}
        >
          <Phone size={14} strokeWidth={1.8} aria-hidden="true" />
          {customer.phone ?? 'Sin teléfono'}
        </span>
      </div>

      {/* Acciones */}
      <CustomerActions customer={customer} variant="stack" />
    </div>
  );
};
