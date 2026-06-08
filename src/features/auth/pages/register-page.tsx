/**
 * @file register-page.tsx
 * @description Página de registro de nuevos clientes.
 * - Panel izquierdo con fotografía de joyería + degradado de marca (desktop).
 * - Tarjeta de formulario con esquinas rectas, coherente con el resto de la app.
 * - Enlace "Volver al inicio" para abandonar sin registrarse.
 * - Incluye confirmación de correo y de contraseña; pegado de texto habilitado.
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
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
}

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
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
    if (!form.firstName.trim()) newErrors.firstName = 'Obligatorio';
    if (!form.lastName.trim()) newErrors.lastName = 'Obligatorio';

    if (!form.email.trim()) newErrors.email = 'El correo es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Correo inválido';

    if (!form.confirmEmail.trim())
      newErrors.confirmEmail = 'Confirma tu correo';
    else if (form.confirmEmail.trim().toLowerCase() !== form.email.trim().toLowerCase())
      newErrors.confirmEmail = 'Los correos no coinciden';

    if (!form.password.trim()) newErrors.password = 'La contraseña es obligatoria';
    else if (form.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';

    if (!form.confirmPassword.trim()) newErrors.confirmPassword = 'Confirma tu contraseña';
    else if (form.confirmPassword !== form.password) newErrors.confirmPassword = 'No coinciden';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      await AuthService.register({
        name: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
      showToast('success', '¡Cuenta creada exitosamente!');
      navigate('/login');
    } catch (error: unknown) {
      showToast('error', getApiErrorMessage(error, 'Error al crear la cuenta'));
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
        eyebrow="Crea tu cuenta"
        titleTop="Haz de KOB"
        titleAccent="tu joyería"
        description="Crea tu cuenta para guardar tus piezas favoritas, recibir las novedades de la colección y vivir una atención cercana, pensada para ti."
        footnote="Sin costo · tus favoritos siempre contigo"
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
          <AuthMobileBanner tagline="Sin costo · tus favoritos siempre contigo" />

          {/* Volver al inicio */}
          <div className="mb-6">
            <BackHomeLink />
          </div>

          {/* Cabecera */}
          <div className="mb-6">
            <p
              className="text-xs uppercase tracking-[0.3em]"
              style={{ color: 'var(--accent)' }}
            >
              Nueva cuenta
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
              Crear cuenta
            </h2>
            <p
              className="mt-2 text-sm leading-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              Completa tus datos para unirte a Joyería KOB.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <AuthField
                label="Nombre"
                value={form.firstName}
                onChange={(v) => updateField('firstName', v)}
                placeholder="Isabella"
                autoComplete="given-name"
                error={errors.firstName}
                animationDelay="60ms"
              />
              <AuthField
                label="Apellido"
                value={form.lastName}
                onChange={(v) => updateField('lastName', v)}
                placeholder="Pérez"
                autoComplete="family-name"
                error={errors.lastName}
                animationDelay="100ms"
              />
            </div>

            <AuthField
              label="Correo electrónico"
              type="email"
              value={form.email}
              onChange={(v) => updateField('email', v)}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              error={errors.email}
              animationDelay="140ms"
            />

            <AuthField
              label="Confirmar correo"
              type="email"
              value={form.confirmEmail}
              onChange={(v) => updateField('confirmEmail', v)}
              placeholder="Repite tu correo"
              autoComplete="email"
              error={errors.confirmEmail}
              blockPaste
              animationDelay="180ms"
            />

            <AuthField
              label="Contraseña"
              value={form.password}
              onChange={(v) => updateField('password', v)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              error={errors.password}
              isPassword
              animationDelay="220ms"
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
              animationDelay="260ms"
            />

            <button
              type="submit"
              disabled={loading}
              className="animate-fade-in mt-2 w-full cursor-pointer py-3 text-sm font-bold uppercase tracking-wide text-[var(--accent-text)] transition-all duration-200 hover:brightness-125 hover:shadow-[var(--shadow-accent)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: 'var(--accent)', animationDelay: '320ms' }}
            >
              {loading ? 'Creando cuenta…' : 'Registrarme'}
            </button>
          </form>

          {/* Pie */}
          <p
            className="mt-6 text-center text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              className="font-semibold underline-offset-4 transition hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};
