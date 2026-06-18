/**
 * @file reset-password-page.tsx
 * @description Página de restablecimiento de contraseña.
 * - Lee el `:token` de la URL (enviado por correo desde el backend).
 * - Pide la nueva contraseña con confirmación (reescritura forzada).
 * - Al éxito redirige a /login para iniciar sesión con la nueva contraseña.
 */

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useToastStore } from '@/store/toast.store';
import { AuthService } from '@/features/auth/services/auth.service';
import { getApiErrorMessage } from '@/api/get-error-message';
import { AuthField } from '@/features/auth/components/auth-field';
import { AuthSidePanel } from '@/features/auth/components/auth-side-panel';
import { AuthMobileBanner } from '@/features/auth/components/auth-mobile-banner';
import { BackHomeLink } from '@/features/auth/components/back-home-link';

interface FormState {
  password: string;
  confirmPassword: string;
}

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { showToast } = useToastStore();

  const [form, setForm] = useState<FormState>({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Partial<FormState> = {};
    if (!form.password.trim()) newErrors.password = 'La contraseña es obligatoria';
    else if (form.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';

    if (!form.confirmPassword.trim()) newErrors.confirmPassword = 'Confirma tu contraseña';
    else if (form.confirmPassword !== form.password) newErrors.confirmPassword = 'No coinciden';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showToast('error', 'Enlace inválido. Solicita uno nuevo.');
      return;
    }
    if (!validate()) return;
    try {
      setLoading(true);
      await AuthService.resetPassword(token, form.password);
      showToast('success', 'Contraseña actualizada. Inicia sesión.');
      navigate('/login');
    } catch (error: unknown) {
      showToast(
        'error',
        getApiErrorMessage(error, 'No se pudo restablecer la contraseña'),
      );
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
        eyebrow="Casi listo"
        titleTop="Crea una"
        titleAccent="nueva contraseña"
        description="Elige una contraseña segura que no uses en otros sitios. Después podrás iniciar sesión con ella de inmediato."
        footnote="Tu seguridad es lo primero"
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
          <AuthMobileBanner tagline="Crea una nueva contraseña" />

          <div className="mb-6">
            <BackHomeLink />
          </div>

          <div className="mb-6">
            <p
              className="text-xs uppercase tracking-[0.3em]"
              style={{ color: 'var(--text-accent)' }}
            >
              Nueva contraseña
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
              Define tu nueva contraseña para acceder a tu cuenta.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthField
              label="Nueva contraseña"
              value={form.password}
              onChange={(v) => updateField('password', v)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              error={errors.password}
              isPassword
              animationDelay="80ms"
            />

            <AuthField
              label="Confirmar contraseña"
              value={form.confirmPassword}
              onChange={(v) => updateField('confirmPassword', v)}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              error={errors.confirmPassword}
              isPassword
              blockPaste
              animationDelay="120ms"
            />

            <button
              type="submit"
              disabled={loading}
              className="animate-fade-in mt-2 w-full cursor-pointer py-3 text-sm font-bold uppercase tracking-wide text-[var(--accent-text)] transition-all duration-200 hover:brightness-125 hover:shadow-[var(--shadow-accent)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: 'var(--accent)', animationDelay: '180ms' }}
            >
              {loading ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>

          <p
            className="mt-6 text-center text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Link
              to="/login"
              className="font-semibold underline-offset-4 transition hover:underline"
              style={{ color: 'var(--text-accent)' }}
            >
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};
