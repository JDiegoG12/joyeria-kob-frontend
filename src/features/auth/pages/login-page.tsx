/**
 * @file login-page.tsx
 * @description Página de inicio de sesión para clientes.
 * - Panel izquierdo con fotografía de joyería + degradado de marca (desktop).
 * - Tarjeta de formulario con esquinas rectas, coherente con el resto de la app.
 * - Enlace "Volver al inicio" para abandonar sin iniciar sesión.
 * - Pegado de texto habilitado en todos los campos.
 * - 100% responsive y con animaciones de entrada no invasivas.
 * Las notificaciones usan `useToastStore` para respetar el tema activo.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToastStore } from '@/store/toast.store';
import { AuthService } from '@/features/auth/services/auth.service';
import { getApiErrorMessage } from '@/api/get-error-message';
import { AuthField } from '@/features/auth/components/auth-field';
import { AuthSidePanel } from '@/features/auth/components/auth-side-panel';
import { AuthMobileBanner } from '@/features/auth/components/auth-mobile-banner';
import { BackHomeLink } from '@/features/auth/components/back-home-link';

interface FormState {
  email: string;
  password: string;
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Partial<FormState> = {};
    if (!form.email.trim()) newErrors.email = 'El correo es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Correo inválido';
    if (!form.password.trim()) newErrors.password = 'La contraseña es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      await AuthService.login({ email: form.email, password: form.password });
      showToast('success', '¡Hola de nuevo!');
      navigate('/');
    } catch (error: unknown) {
      showToast('error', getApiErrorMessage(error, 'Error al iniciar sesión'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="grid min-h-[calc(100vh-var(--navbar-height,64px))] grid-cols-1 lg:grid-cols-2"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* ── Panel decorativo — solo desktop ── */}
      <AuthSidePanel
        eyebrow="Acceso exclusivo para clientes KOB"
        titleTop="Tus joyas"
        titleAccent="favoritas te esperan"
        description="Ingresa a tu cuenta para continuar tu experiencia, explorar novedades y descubrir lo más reciente de nuestra colección exclusiva."
        footnote="Atención personalizada · Oro 18k"
      />

      {/* ── Panel del formulario ── */}
      <section className="flex items-center justify-center overflow-y-auto px-4 py-8 sm:px-10">
        <div
          className="animate-fade-in w-full max-w-md border p-6 sm:p-8"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Banner de marca — solo móvil */}
          <AuthMobileBanner tagline="Atención personalizada · Oro 18k" />

          {/* Volver al inicio */}
          <div className="mb-6">
            <BackHomeLink />
          </div>

          {/* Cabecera */}
          <div className="mb-6">
            <p
              className="text-xs uppercase tracking-[0.3em]"
              style={{ color: 'var(--text-accent)' }}
            >
              Bienvenido
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
              Iniciar sesión
            </h2>
            <p
              className="mt-2 text-sm leading-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              Ingresa con tu correo para continuar en Joyería KOB.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthField
              label="Correo electrónico"
              type="email"
              value={form.email}
              onChange={(v) => updateField('email', v)}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              error={errors.email}
              animationDelay="80ms"
            />

            <AuthField
              label="Contraseña"
              value={form.password}
              onChange={(v) => updateField('password', v)}
              placeholder="Tu contraseña"
              autoComplete="current-password"
              error={errors.password}
              isPassword
              animationDelay="160ms"
            />

            <button
              type="submit"
              disabled={loading}
              className="animate-fade-in mt-2 w-full cursor-pointer py-3 text-sm font-bold uppercase tracking-wide text-[var(--accent-text)] transition-all duration-200 hover:brightness-125 hover:shadow-[var(--shadow-accent)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: 'var(--accent)', animationDelay: '240ms' }}
            >
              {loading ? 'Ingresando…' : 'Entrar'}
            </button>
          </form>

          {/* Pie */}
          <p
            className="mt-6 text-center text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            ¿No tienes cuenta?{' '}
            <Link
              to="/registro"
              className="font-semibold underline-offset-4 transition hover:underline"
              style={{ color: 'var(--text-accent)' }}
            >
              Regístrate
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};
