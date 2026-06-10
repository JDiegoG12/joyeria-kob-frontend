/**
 * @file customers-table.tsx
 * @description Tabla de clientes para vista de escritorio (`hidden md:block`).
 * En móvil se usa `CustomerCard` en su lugar.
 */

import { CustomerActions } from '@/features/customers/components/customer-actions';
import { fullName, formatDate } from '@/features/customers/utils/format';
import type { Customer } from '@/features/customers/types/customer.types';

interface CustomersTableProps {
  customers: Customer[];
}

const headerCellStyle: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

const bodyCellStyle: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-secondary)',
};

export const CustomersTable = ({ customers }: CustomersTableProps) => {
  return (
    <div
      className="hidden overflow-hidden border md:block"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <th className="px-4 py-3 text-left" style={headerCellStyle}>
              Cliente
            </th>
            <th className="px-4 py-3 text-left" style={headerCellStyle}>
              Correo
            </th>
            <th className="px-4 py-3 text-left" style={headerCellStyle}>
              Teléfono
            </th>
            <th className="px-4 py-3 text-left" style={headerCellStyle}>
              Registro
            </th>
            <th className="px-4 py-3 text-right" style={headerCellStyle}>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="transition-colors duration-150 hover:bg-[var(--bg-hover)]"
              style={{ borderBottom: '1px solid var(--border-color)' }}
            >
              {/* Cliente: nombre completo */}
              <td className="px-4 py-3">
                <span
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {fullName(customer)}
                </span>
              </td>

              {/* Correo */}
              <td className="px-4 py-3" style={bodyCellStyle}>
                {customer.email}
              </td>

              {/* Teléfono (puede no existir) */}
              <td className="px-4 py-3" style={bodyCellStyle}>
                {customer.phone ?? (
                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                )}
              </td>

              {/* Fecha de registro */}
              <td className="px-4 py-3" style={bodyCellStyle}>
                {formatDate(customer.createdAt)}
              </td>

              {/* Acciones */}
              <td className="px-4 py-3">
                <div className="flex justify-end">
                  <CustomerActions customer={customer} variant="row" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
