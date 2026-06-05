/**
 * @file announcement-bar.tsx
 * @description Barra de anuncios con ticker horizontal deslizante.
 *
 * Se monta encima del Navbar en `MainLayout`. Es un componente independiente
 * para que el Navbar no acumule responsabilidades y pueda ocultarse en rutas
 * que no lo necesiten con solo quitarlo del layout.
 *
 * ## Comportamiento
 * - Texto se desplaza de derecha a izquierda en bucle infinito (CSS puro).
 * - La animación se pausa al hacer hover sobre la barra.
 * - Usa `--announcement-bg` y `--announcement-text` de `tokens.css`.
 *
 * ## Por qué un solo track con 8 repeticiones + restart en `load`
 *
 * El ticker usa el patrón clásico: un track con el contenido duplicado N veces
 * que se desplaza exactamente `-50%`, de modo que al llegar al final el punto
 * de partida visual es idéntico al inicial y el loop es imperceptible.
 *
 * ### Problema 1 — huecos visibles tras unos segundos
 * Los íconos SVG de `lucide-react` se hidratan en un paint posterior al HTML
 * inicial. Esto cambia el `width: max-content` del track en mitad de la
 * animación. El navegador mantiene el `transform` calculado sobre el ancho
 * antiguo, por lo que el punto de costura del loop queda desalineado y
 * aparecen espacios en blanco.
 *
 * **Solución**: un `useEffect` escucha el evento `load` de `window` (que se
 * dispara cuando todos los recursos —incluyendo los SVGs de Lucide— han
 * terminado de cargarse) y fuerza un reflow + reinicio de la animación para
 * que el navegador recalcule las distancias con el ancho real y definitivo.
 *
 * ### Problema 2 — `-50%` no devuelve al origen en pantallas anchas
 * Con pocas repeticiones el ancho total del track puede ser menor que
 * `2 × viewport`, lo que hace que `-50%` no coincida con el ancho de la
 * "primera mitad". Con 8 repeticiones el track siempre supera con margen
 * cualquier resolución razonable, garantizando que la mitad exacta del
 * contenido cabe en pantalla y el loop es correcto.
 *
 * ## Ruta en el proyecto
 * `src/components/ui/announcement-bar/announcement-bar.tsx`
 *
 * ## Uso
 * ```tsx
 * // main-layout.tsx
 * <AnnouncementBar />
 * <Navbar />
 * <main>...</main>
 * ```
 */

import { useEffect, useRef } from 'react';
import { Gem, ShieldCheck, Truck } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

/** Forma de cada mensaje que aparece en el ticker. */
interface TickerMessage {
  /** Identificador único del mensaje. */
  id: number;
  /** Ícono de Lucide asociado al mensaje. */
  icon: React.ElementType;
  /** Texto visible en la barra. */
  text: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Datos
// ─────────────────────────────────────────────────────────────────────────────

/** Mensajes que se repiten en el ticker. Agregar o quitar entradas aquí. */
const MESSAGES: readonly TickerMessage[] = [
  { id: 1, icon: Truck, text: 'Envíos a nivel nacional' },
  { id: 2, icon: Gem, text: 'Oro 18k garantizado' },
  { id: 3, icon: ShieldCheck, text: 'Compras seguras' },
] as const;

/**
 * Número de veces que se repite la lista de mensajes dentro del track.
 *
 * Debe ser un número **par** para que `-50%` coincida exactamente con el
 * ancho de la primera mitad. Con 8 copias el track supera con margen los
 * ~5 000 px de las resoluciones más anchas habituales, garantizando que el
 * punto de costura del loop nunca quede visible en pantalla.
 */
const REPEAT_COUNT = 8;

// ─────────────────────────────────────────────────────────────────────────────
// Estilos de la animación (inyectados una sola vez con <style>)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CSS de la animación del ticker.
 *
 * `translateX(-50%)` desplaza el track exactamente la mitad de su ancho total.
 * Como el contenido está duplicado N veces (N par), la segunda mitad del track
 * es idéntica a la primera, por lo que el loop es imperceptible.
 */
const TICKER_STYLES = `
  @keyframes kob-ticker {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  .kob-ticker-track {
    display: flex;
    width: max-content;
    animation: kob-ticker 60s linear infinite;
  }

  .kob-ticker-track:hover {
    animation-play-state: paused;
  }
` as const;

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Barra de anuncios fija en la parte superior de la página.
 *
 * Implementa el ticker con un único track cuyo contenido se repite
 * {@link REPEAT_COUNT} veces. Un `useEffect` reinicia la animación tras el
 * evento `load` de `window` para compensar el cambio de ancho que producen
 * los íconos SVG de Lucide al hidratarse. Ver cabecera del archivo para la
 * explicación detallada del problema y la solución.
 */
export const AnnouncementBar = () => {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /**
     * Fuerza un reflow y reinicia la animación CSS del track.
     *
     * Se llama en el evento `load` de `window`, que se dispara cuando todos
     * los recursos de la página (íconos SVG de Lucide incluidos) han
     * terminado de cargarse y el ancho del track es ya definitivo.
     *
     * La lectura de `offsetWidth` es intencional: provoca un reflow síncrono
     * que obliga al navegador a confirmar el nuevo ancho antes de que la
     * animación se reanude con los valores correctos.
     */
    const restartAnimation = () => {
      const track = trackRef.current;
      if (!track) return;

      track.style.animation = 'none';
      void track.offsetWidth; // fuerza reflow — no eliminar
      track.style.animation = '';
    };

    window.addEventListener('load', restartAnimation);
    return () => window.removeEventListener('load', restartAnimation);
  }, []);

  return (
    <div
      className="fixed top-0 right-0 left-0 z-50 overflow-hidden"
      style={{
        height: 'var(--announcement-height)',
        backgroundColor: 'var(--announcement-bg)',
        color: 'var(--announcement-text)',
      }}
      role="marquee"
      aria-label="Anuncios de la tienda"
    >
      <style>{TICKER_STYLES}</style>

      <div className="flex h-full items-center">
        <div className="kob-ticker-track" ref={trackRef}>
          {Array.from({ length: REPEAT_COUNT }, (_, repeatIndex) =>
            MESSAGES.map(({ id, icon: Icon, text }) => (
              <span
                key={`${repeatIndex}-${id}`}
                className="flex items-center gap-2 whitespace-nowrap px-8"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-medium)',
                  letterSpacing: 'var(--tracking-wide)',
                }}
              >
                <Icon size={14} aria-hidden="true" />
                {text}
                {/* Separador visual entre mensajes */}
                <span
                  className="ml-4 h-1 w-1 rounded-full"
                  style={{
                    backgroundColor: 'var(--announcement-text)',
                    opacity: 0.35,
                  }}
                  aria-hidden="true"
                />
              </span>
            )),
          )}
        </div>
      </div>
    </div>
  );
};
