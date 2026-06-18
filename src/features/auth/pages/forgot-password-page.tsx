/**
 * @file forgot-password-page.tsx
 * @description Página "¿Olvidaste tu contraseña?".
 * - El usuario ingresa su correo; se solicita al backend el envío del enlace.
 * - Por seguridad, el backend responde siempre con un mensaje genérico (no
 *   revela si el correo está registrado), así que mostramos un estado de
 *   "revisa tu correo" tras el envío exitoso.
 * - Reutiliza los componentes y el estilo de las demás páginas de auth.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToastStore } from '@/store/toast.store';
import { AuthService } from '@/features/auth/services/auth.service';
import { getApiErrorMessage } from '@/api/get-error-message';
import { AuthField } from '@/features/auth/components/auth-field';
import { AuthSidePanel } from '@/features/auth/components/auth-side-panel';
import { AuthMobileBanner } from '@/features/auth/components/auth-mobile-banner';
import { BackHomeLink } from '@/features/auth/components/back-home-link';

export const ForgotPasswordPage = () => {
  const { showToast } = useToastStore();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('El correo es obligatorio');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Correo inválido');
      return;
    }
    try {
      setLoading(true);
      await AuthService.forgotPassword(email.trim());
      setSent(true);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'No se pudo procesar la solicitud'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="grid min-h-[calc(100vh-var(--navbar-height,64px))] grid-cols-1 lg:grid-cols-2"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <AuthSidePanel
        eyebrow="Recupera el acceso a tu cuenta"
        titleTop="¿Olvidaste"
        titleAccent="tu contraseña?"
        description="No te preocupes. Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña de forma segura."
        footnote="Enlace válido por 1 hora"
      />

      <section className="flex items-center justify-center overflow-y-auto px-4 py-8 sm:px-10">
        <div
          className="animate-fade-in w-full max-w-md border p-6 sm:p-8"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <AuthMobileBanner tagline="Recupera el acceso a tu cuenta" />

          <div className="mb-6">
            <BackHomeLink />
          </div>

          <div className="mb-6">
            <p
              className="text-xs uppercase tracking-[0.3em]"
              style={{ color: 'var(--text-accent)' }}
            >
              Recuperación
            </p>
            <h2
              className="mt-2"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-3xl)',
                fontWeight: 'var(--font-bold)',
                lineHeight: 'var(--leading-tight)',
                color: 'var(--text-primary)',
              }}
            >
              Restablecer contraseña
            </h2>
            <p
              className="mt-2 text-sm leading-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              Te enviaremos un enlace a tu correo para crear una nueva contraseña.
            </p>
          </div>

          {sent ? (
            <div
              className="animate-fade-in border p-4 text-sm leading-6"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
              }}
            >
              <p>
                Si el correo <strong>{email}</strong> está registrado, recibirás
                un mensaje con el enlace para restablecer tu contraseña. Revisa
                también tu carpeta de spam.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <AuthField
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  setError('');
                }}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                error={error}
                animationDelay="80ms"
              />

              <button
                type="submit"
                disabled={loading}
                className="animate-fade-in mt-2 w-full cursor-pointer py-3 text-sm font-bold uppercase tracking-wide text-[var(--accent-text)] transition-all duration-200 hover:brightness-125 hover:shadow-[var(--shadow-accent)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: 'var(--accent)', animationDelay: '160ms' }}
              >
                {loading ? 'Enviando…' : 'Enviar enlace'}
              </button>
            </form>
          )}

          <p
            className="mt-6 text-center text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            ¿Recordaste tu contraseña?{' '}
            <Link
              to="/login"
              className="font-semibold underline-offset-4 transition hover:underline"
              style={{ color: 'var(--text-accent)' }}
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};
