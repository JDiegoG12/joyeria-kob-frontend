/**
 * @file favorite-auth-prompt.tsx
 * @description Modal que invita a iniciar sesión cuando un visitante sin cuenta
 * intenta agregar una pieza a favoritos.
 *
 * En vez de redirigir directamente a `/login`, este modal explica que para
 * guardar favoritos se necesita una cuenta y ofrece dos caminos: ir a iniciar
 * sesión o seguir explorando sin abandonar la página actual.
 *
 * ## Diseño
 * - Esquinas rectas, coherente con las tarjetas de auth y el resto del
 *   storefront (nunca rectángulos redondeados).
 * - Acento de marca via tokens: el corazón usa `--favorite`, el CTA usa
 *   `--accent` como relleno con `--accent-text` encima.
 *
 * ## Accesibilidad
 * - `role="dialog"` + `aria-modal="true"`.
 * - Cierre con la tecla Escape y al hacer clic en el overlay.
 * - El botón "Seguir explorando" recibe el foco inicial para que "Enter" no
 *   dispare la navegación accidentalmente.
 *
 * Se monta una sola vez en `MainLayout`; su visibilidad la controla
 * `useAuthPromptStore`.
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuthPromptStore } from '@/store/auth-prompt.store';

export const FavoriteAuthPrompt = () => {
  const navigate = useNavigate();
  const isOpen = useAuthPromptStore((s) => s.isOpen);
  const close = useAuthPromptStore((s) => s.close);

  const stayButtonRef = useRef<HTMLButtonElement>(null);

  // Foco inicial en "Seguir explorando" (evita navegación accidental con Enter).
  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => stayButtonRef.current?.focus(), 50);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Cierre con Escape.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // Bloquea el scroll del fondo mientras el modal está abierto.
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const goToLogin = () => {
    close();
    navigate('/login');
  };

  return (
    /* Overlay */
    <div
      className="animate-fade-in fixed inset-0 z-[10050] flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="favorite-auth-title"
      aria-describedby="favorite-auth-message"
      onClick={close}
    >
      {/* Panel — esquinas rectas, coherente con las tarjetas de auth */}
      <div
        className="w-full max-w-md border p-6 sm:p-7"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icono + textos */}
        <div className="flex items-start gap-4">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center"
            style={{
              backgroundColor: 'var(--favorite-subtle)',
              color: 'var(--favorite)',
            }}
            aria-hidden="true"
          >
            <Heart size={22} strokeWidth={1.8} fill="currentColor" />
          </span>

          <div className="min-w-0">
            <h3
              id="favorite-auth-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--font-bold)',
                lineHeight: 'var(--leading-tight)',
                color: 'var(--text-primary)',
              }}
            >
              Inicia sesión para guardar favoritos
            </h3>
            <p
              id="favorite-auth-message"
              className="mt-2 text-sm leading-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              Para agregar piezas a tus favoritos necesitas tener una cuenta.
              ¿Quieres iniciar sesión ahora o seguir explorando la colección?
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={stayButtonRef}
            type="button"
            onClick={close}
            className="cursor-pointer border px-5 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-[var(--bg-tertiary)]"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            Seguir explorando
          </button>

          <button
            type="button"
            onClick={goToLogin}
            className="cursor-pointer px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[var(--accent-text)] transition-all duration-200 hover:brightness-125 hover:shadow-[var(--shadow-accent)] active:translate-y-px"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
};
