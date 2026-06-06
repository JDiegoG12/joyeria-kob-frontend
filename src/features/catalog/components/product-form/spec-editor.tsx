/**
 * @file spec-editor.tsx
 * @description Editor dinámico de especificaciones técnicas (pares detalle-valor)
 * compartido por los formularios de creación y edición de joyas.
 *
 * ## Copy orientado al usuario (no técnico)
 * El texto guía explica DÓNDE aparecen estos datos: en la sección
 * «Características» de la ficha del producto, justo debajo del peso. Se evita el
 * lenguaje técnico (true/false, arrays) porque confundía al administrador.
 *
 * ## Accesibilidad / scroll-a-error
 * La `<section>` raíz recibe el `id` y `tabIndex={-1}` para poder enfocarse y
 * desplazarse hacia ella cuando hay un error de especificaciones.
 */

import { Plus, Trash2 } from 'lucide-react';
import type { SpecEntry } from './utils';

/** Clases del input de cada fila (más compactas que `INPUT_BASE`). */
const ROW_INPUT =
  'w-full min-w-0 rounded-xl border border-[var(--border-color)] bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)] hover:border-[var(--border-strong)]';

interface SpecEditorProps {
  /** `id` de la sección (destino del scroll-a-error). */
  id: string;
  entries: SpecEntry[];
  error?: string;
  onAdd: () => void;
  onUpdate: (id: string, field: 'key' | 'value', value: string) => void;
  onRemove: (id: string) => void;
}

/**
 * Editor de especificaciones con encabezado, estado vacío y filas editables.
 */
export const SpecEditor = ({
  id,
  entries,
  error,
  onAdd,
  onUpdate,
  onRemove,
}: SpecEditorProps) => (
  <section
    id={id}
    tabIndex={-1}
    aria-labelledby={`${id}-title`}
    className="scroll-mt-4 outline-none"
  >
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3
          id={`${id}-title`}
          className="text-base font-semibold text-[var(--text-primary)]"
        >
          Especificaciones técnicas{' '}
          <span className="font-normal text-[var(--text-muted)]">(opcional)</span>
        </h3>
        <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]">
          Aparecen en la sección «Características» de la ficha del producto, justo
          debajo del peso. Escribe un detalle por fila — por ejemplo, «Ancho» con
          valor «3 mm».
        </p>
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm font-medium transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-tertiary)] active:scale-95"
      >
        <Plus size={16} aria-hidden="true" />
        Agregar
      </button>
    </div>

    {entries.length === 0 ? (
      <div className="rounded-xl border border-dashed border-[var(--border-color)] px-4 py-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          Sin especificaciones. Pulsa «Agregar» para añadir un detalle.
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"
          >
            <input
              type="text"
              value={entry.key}
              onChange={(e) => onUpdate(entry.id, 'key', e.target.value)}
              placeholder="Detalle (ej. Ancho)"
              aria-label="Detalle de la especificación"
              className={ROW_INPUT}
            />
            <input
              type="text"
              value={entry.value}
              onChange={(e) => onUpdate(entry.id, 'value', e.target.value)}
              placeholder="Valor (ej. 3 mm)"
              aria-label="Valor de la especificación"
              className={ROW_INPUT}
            />
            <button
              type="button"
              onClick={() => onRemove(entry.id)}
              aria-label="Eliminar especificación"
              className="flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border border-[var(--border-color)] px-3 text-red-500 transition hover:border-red-500/30 hover:bg-red-500/10 active:scale-95 sm:min-h-0 sm:justify-self-start sm:py-2.5"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    )}

    {error && (
      <p className="mt-2 text-xs text-red-500" role="alert">
        {error}
      </p>
    )}
  </section>
);
