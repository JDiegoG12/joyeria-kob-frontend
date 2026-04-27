/**
 * @file gold-price-card.tsx
 * @description Tarjeta de configuración del precio del oro por gramo.
 *
 * ## Responsabilidad
 * Permite al administrador consultar y actualizar el precio del oro por gramo
 * en COP. Es el primer bloque de configuración del módulo General y sirve
 * como plantilla visual para futuras tarjetas de configuración.
 *
 * ## Flujo de actualización
 * 1. La tarjeta carga el precio actual desde el store al montarse.
 * 2. El administrador edita el campo — el valor se formatea en tiempo real
 *    con separadores de miles (ej. `365000` → `365.000`).
 * 3. El botón "Actualizar" se habilita solo cuando el valor ingresado
 *    difiere del precio actualmente guardado en el store.
 * 4. Al pulsar "Actualizar", se abre un `ConfirmModal` mostrando el valor nuevo.
 * 5. Al confirmar, se llama al backend. El resultado dispara un toast de
 *    éxito o error y, en caso de éxito, se actualiza el store global.
 *
 * ## Formateo del campo
 * - Solo se aceptan dígitos. Cualquier carácter no numérico se descarta.
 * - El separador de miles es el punto (`.`), conforme a la convención colombiana.
 * - El valor enviado al backend es el número limpio sin formato.
 *
 * ## Estado del botón
 * - **Deshabilitado** cuando el valor del campo es igual al precio guardado,
 *   cuando el campo está vacío, o cuando hay una petición en curso.
 * - **Habilitado** únicamente cuando el valor numérico del campo difiere
 *   del `goldPricePerGram` actual en el store.
 *
 * ## Uso
 * ```tsx
 * import { GoldPriceCard } from '@/features/general/components/gold-price-card';
 * <GoldPriceCard />
 * ```
 */

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/modal/confirm-modal';
import { useGoldPriceStore } from '@/store/gold-price.store';
import { useToastStore } from '@/store/toast.store';
import { GeneralService } from '@/features/general/services/general.service';

// ─── Utilidades de formateo ───────────────────────────────────────────────────

/**
 * Formatea un número entero como precio COP con separadores de miles.
 * Ejemplo: `365000` → `365.000`
 *
 * @param value - Número a formatear. Debe ser un entero válido.
 * @returns Cadena formateada con puntos como separadores de miles.
 */
const formatCOP = (value: number): string =>
  value.toLocaleString('es-CO', { maximumFractionDigits: 0 });

/**
 * Extrae el valor numérico de una cadena formateada con separadores de miles.
 * Elimina puntos y cualquier carácter no numérico antes de parsear.
 *
 * @param formatted - Cadena formateada (ej. `"365.000"`).
 * @returns El número entero correspondiente, o `NaN` si la cadena es inválida.
 */
const parseFormattedCOP = (formatted: string): number =>
  parseInt(formatted.replace(/\./g, '').replace(/\D/g, ''), 10);

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Tarjeta de configuración del precio del oro.
 * Lee el precio actual del store y permite actualizarlo con confirmación.
 * El botón de acción solo se habilita cuando el valor del campo
 * difiere del precio guardado actualmente en el store.
 */
export const GoldPriceCard = () => {
  const {
    goldPricePerGram,
    lastUpdate,
    isLoading,
    loadGoldPrice,
    setGoldPrice,
  } = useGoldPriceStore();
  const { showToast } = useToastStore();

  // ── Estado local ──────────────────────────────────────────────────────────

  /** Valor del campo como cadena formateada para mostrar en el input. */
  const [inputValue, setInputValue] = useState('');
  /** Controla la visibilidad del modal de confirmación. */
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  /** Indica si hay una petición PUT en curso. */
  const [isSaving, setIsSaving] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Efectos ───────────────────────────────────────────────────────────────

  // Carga el precio del backend al montar el componente.
  // El store evita peticiones duplicadas si el precio ya fue cargado.
  useEffect(() => {
    void loadGoldPrice();
  }, [loadGoldPrice]);

  // Sincroniza el campo con el precio del store cuando este cambia.
  // Se usa `== null` (doble igual) para atrapar tanto `null` como `undefined`,
  // ya que Zustand puede rehidratar desde localStorage con `undefined` si
  // la clave existía previamente con un esquema distinto.
  useEffect(() => {
    if (goldPricePerGram == null) return;
    setInputValue(formatCOP(goldPricePerGram));
  }, [goldPricePerGram]);

  // ── Derivados ─────────────────────────────────────────────────────────────

  /**
   * Valor numérico limpio del campo de texto.
   * Es `NaN` si el campo está vacío o contiene solo caracteres no numéricos.
   */
  const parsedInputValue = parseFormattedCOP(inputValue);

  /**
   * Indica si el botón "Actualizar" debe estar habilitado.
   * Se activa únicamente cuando:
   * - El campo tiene un valor numérico válido y mayor a cero.
   * - Ese valor difiere del precio actualmente guardado en el store.
   * - No hay una petición de guardado en curso.
   */
  const isUpdateEnabled =
    !isSaving &&
    !isNaN(parsedInputValue) &&
    parsedInputValue > 0 &&
    parsedInputValue !== goldPricePerGram;

  /** Valor pendiente formateado para mostrar en el modal de confirmación. */
  const formattedPending = isNaN(parsedInputValue)
    ? '—'
    : formatCOP(parsedInputValue);

  // ── Handlers ──────────────────────────────────────────────────────────────

  /**
   * Maneja los cambios en el campo de precio.
   * Extrae solo los dígitos del valor ingresado y reformatea la cadena
   * con separadores de miles en tiempo real.
   *
   * @param e - Evento de cambio del input.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') {
      setInputValue('');
      return;
    }
    setInputValue(formatCOP(parseInt(raw, 10)));
  };

  /**
   * Abre el modal de confirmación.
   * El botón ya está deshabilitado si el valor es inválido o no ha cambiado,
   * pero se agrega una validación defensiva por si se llama directamente.
   */
  const handleUpdateClick = () => {
    if (!isUpdateEnabled) return;
    setIsConfirmOpen(true);
  };

  /**
   * Ejecuta la actualización del precio tras la confirmación del administrador.
   * En caso de éxito, actualiza el store y muestra un toast de confirmación.
   * En caso de error, muestra el mensaje correspondiente.
   */
  const handleConfirmUpdate = async () => {
    setIsSaving(true);

    try {
      const result = await GeneralService.updateGoldPrice(parsedInputValue);
      setGoldPrice(result.data.goldPricePerGram, result.data.lastUpdate);
      showToast('success', 'Precio del oro actualizado correctamente.');
    } catch {
      showToast(
        'error',
        'No se pudo actualizar el precio del oro. Intenta de nuevo.',
      );
    } finally {
      setIsSaving(false);
      setIsConfirmOpen(false);
    }
  };

  // ── Helpers de render ─────────────────────────────────────────────────────

  /**
   * Formatea una fecha ISO a un string legible en español colombiano.
   * Ejemplo: `"2025-04-15T10:32:00.000Z"` → `"15 de abril de 2025, 10:32 a. m."`
   *
   * @param iso - Cadena de fecha en formato ISO 8601.
   * @returns Fecha formateada, o `'Sin registro'` si el valor es nulo o vacío.
   */
  const formatLastUpdate = (iso: string | null): string => {
    if (!iso) return 'Sin registro';
    return new Date(iso).toLocaleString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div
        className="rounded-xl border p-5 sm:p-6"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Encabezado de la tarjeta */}
        <div className="mb-5 flex items-start gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent)',
            }}
          >
            <TrendingUp size={20} />
          </div>

          <div className="min-w-0">
            <h3
              className="truncate"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-primary)',
                lineHeight: 'var(--leading-tight)',
              }}
            >
              Precio del oro por gramo
            </h3>
            <p
              className="mt-0.5"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-muted)',
              }}
            >
              Valor de referencia en COP usado para calcular el precio estimado
              de todas las joyas.
            </p>
          </div>
        </div>

        {/* Separador */}
        <div
          className="mb-5 h-px"
          style={{ backgroundColor: 'var(--border-color)' }}
        />

        {/* Campo de edición o skeleton de carga */}
        {isLoading && goldPricePerGram == null ? (
          <LoadingSkeleton />
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* Input con prefijo COP */}
            <div className="flex-1">
              <label
                htmlFor="gold-price-input"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Precio por gramo
              </label>

              <div
                className="flex overflow-hidden rounded-lg border transition-colors focus-within:border-[var(--accent)]"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {/* Prefijo visual — no interactivo */}
                <span
                  className="flex flex-shrink-0 items-center border-r px-3 py-2.5"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-medium)',
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-color)',
                  }}
                  aria-hidden="true"
                >
                  COP $
                </span>

                <input
                  ref={inputRef}
                  id="gold-price-input"
                  type="text"
                  inputMode="numeric"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="0"
                  aria-label="Precio del oro por gramo en COP"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 outline-none"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            {/* Botón de actualizar.
                Deshabilitado cuando el valor no ha cambiado respecto al guardado,
                cuando el campo está vacío, o cuando hay una petición en curso.
                El `title` da contexto al cursor sobre la razón del estado disabled. */}
            <button
              type="button"
              onClick={handleUpdateClick}
              disabled={!isUpdateEnabled}
              title={
                !isUpdateEnabled && !isSaving
                  ? 'Modifica el valor para poder actualizar'
                  : undefined
              }
              className="flex flex-shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg px-5 py-2.5 transition-opacity hover:opacity-85 active:opacity-75 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-text)',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-semibold)',
              }}
            >
              {isSaving ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Actualizar
            </button>
          </div>
        )}

        {/* Última actualización */}
        <div className="mt-4 flex items-center gap-1.5">
          <Clock
            size={13}
            style={{ color: 'var(--text-muted)', flexShrink: 0 }}
          />
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}
          >
            Último cambio: {formatLastUpdate(lastUpdate)}
          </p>
        </div>
      </div>

      {/* Modal de confirmación — se abre solo cuando el valor es válido y distinto */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        variant="info"
        title="Confirmar actualización"
        message={`El precio del oro se actualizará a COP $${formattedPending} por gramo. Este cambio afectará el precio estimado de todas las joyas.`}
        confirmLabel="Sí, actualizar"
        cancelLabel="Cancelar"
        isLoading={isSaving}
        onConfirm={() => void handleConfirmUpdate()}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
};

// ─── Subcomponente: skeleton de carga ─────────────────────────────────────────

/**
 * Esqueleto animado que reemplaza el campo mientras se obtiene el precio del backend.
 * Mantiene el layout estable para evitar saltos visuales (CLS).
 *
 * @internal Solo se usa dentro de `GoldPriceCard`.
 */
const LoadingSkeleton = () => (
  <div className="flex animate-pulse flex-col gap-4 sm:flex-row sm:items-end">
    <div className="flex-1">
      <div
        className="mb-1.5 h-4 w-28 rounded"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      />
      <div
        className="h-11 w-full rounded-lg"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      />
    </div>
    <div
      className="h-11 w-32 rounded-lg"
      style={{ backgroundColor: 'var(--bg-tertiary)' }}
    />
  </div>
);
