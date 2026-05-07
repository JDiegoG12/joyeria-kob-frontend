/**
 * @file register-page.tsx
 * @description Página de registro.
 * - Panel izquierdo con textos decorativos (desktop)
 * - Gradientes en ambos modos
 * - 100% responsive — cabe sin scroll
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthService } from '@/features/auth/services/auth.service';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const blockClipboard = (e: React.ClipboardEvent) => e.preventDefault();

export const RegisterPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/login');
    } catch (error: any) {
      toast.error(error?.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex h-[calc(100vh-64px)] overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* ── Gradientes decorativos ── */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.13),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(212,175,55,0.08),_transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.07),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(212,175,55,0.04),_transparent_50%)]" />

      {/* ── Grid ── */}
      <div className="relative z-10 grid w-full grid-cols-1 lg:grid-cols-2">

        {/* ── Panel izquierdo — solo desktop ── */}
        <section className="hidden lg:flex lg:flex-col lg:justify-between px-14 py-10 xl:px-16 xl:py-14 animate-fade-in">
          <div>
            <span
              className="inline-flex items-center rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.25em] backdrop-blur-md"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
              }}
            >
              Joyería KOB
            </span>
          </div>

          <div className="max-w-lg">
            <p
              className="mb-4 text-xs uppercase tracking-[0.35em]"
              style={{ color: 'var(--accent)' }}
            >
              Experiencia personalizada
            </p>
            <h1
              className="font-serif text-5xl leading-[1.08] xl:text-6xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Crea tu espacio
              <span className="block" style={{ color: 'var(--accent)' }}>
                dentro de KOB
              </span>
            </h1>
            <p
              className="mt-5 max-w-md text-base leading-7 xl:text-lg xl:leading-8"
              style={{ color: 'var(--text-secondary)' }}
            >
              Regístrate para guardar tus intereses, seguir tus configuraciones
              y vivir una experiencia más cercana, elegante y pensada para ti.
            </p>
          </div>

          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Registro seguro • experiencia premium • acceso personalizado
          </p>
        </section>

        {/* ── Panel derecho — formulario ──
            overflow-y-auto: si la pantalla es MUY pequeña (< 600px alto) aparece scroll solo en la tarjeta
        ── */}
        <section className="flex h-[calc(100vh-64px)] items-center justify-center overflow-y-auto px-4 py-4 sm:px-10">
          <div
            className="w-full max-w-sm animate-fade-in rounded-2xl border p-5 shadow-lg backdrop-blur-xl sm:max-w-md sm:p-7"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Cabecera */}
            <div className="mb-4">
              <p
                className="text-xs uppercase tracking-[0.3em]"
                style={{ color: 'var(--accent)' }}
              >
                Nueva cuenta
              </p>
              <h2
                className="mt-1 font-serif text-2xl sm:text-3xl"
                style={{ color: 'var(--text-primary)' }}
              >
                Crear cuenta
              </h2>
              <p
                className="mt-1 text-xs leading-5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Regístrate para continuar tu experiencia en Joyería KOB.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Nombre y Apellido en fila */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="mb-1 block text-xs font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="Isabella"
                    autoComplete="given-name"
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)]/20"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  {errors.firstName && (
                    <p className="mt-0.5 text-xs text-red-500">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label
                    className="mb-1 block text-xs font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="Pérez"
                    autoComplete="family-name"
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)]/20"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  {errors.lastName && (
                    <p className="mt-0.5 text-xs text-red-500">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Correo */}
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  onCopy={blockClipboard}
                  onCut={blockClipboard}
                  onPaste={blockClipboard}
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)]/20"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                  }}
                />
                {errors.email && (
                  <p className="mt-0.5 text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    onCopy={blockClipboard}
                    onCut={blockClipboard}
                    onPaste={blockClipboard}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full rounded-xl border px-3 py-2 pr-10 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)]/20"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition hover:opacity-70"
                    style={{ color: 'var(--text-secondary)' }}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-0.5 text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    onCopy={blockClipboard}
                    onCut={blockClipboard}
                    onPaste={blockClipboard}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full rounded-xl border px-3 py-2 pr-10 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)]/20"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition hover:opacity-70"
                    style={{ color: 'var(--text-secondary)' }}
                    aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-0.5 text-xs text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Botón */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {loading ? 'Creando cuenta...' : 'Registrarme'}
              </button>
            </form>

            {/* Pie */}
            <p
              className="mt-3 text-center text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="font-medium transition hover:opacity-80"
                style={{ color: 'var(--accent)' }}
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
