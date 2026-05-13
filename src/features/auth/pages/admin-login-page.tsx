/**
 * @file admin-login-page.tsx
 * @description Página de inicio de sesión del panel administrativo.
 * Solo accesible para usuarios con rol ADMIN. Sin opción de registro.
 * Las notificaciones usan `useToastStore` para respetar el tema activo.
 */

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToastStore } from '@/store/toast.store';
import { AuthService } from '@/features/auth/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

interface FormState {
  email: string;
  password: string;
}

const blockClipboard = (e: React.ClipboardEvent) => e.preventDefault();

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const user = useAuthStore.getState().user;
      if (user?.role !== 'ADMIN') {
        showToast('error', 'No tienes permisos de administrador');
        AuthService.logout();
        return;
      }
      showToast('success', 'Bienvenido al panel admin');
      navigate('/admin/joyas');
    } catch (error: any) {
      showToast('error', error?.message || 'Error al iniciar sesión');
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.10),_transparent_45%),radial-gradient(ellipse_at_bottom_right,_rgba(212,175,55,0.06),_transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 dark:bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.06),_transparent_45%),radial-gradient(ellipse_at_bottom_right,_rgba(212,175,55,0.03),_transparent_45%)]" />

      {/* ── Grid ── */}
      <div className="relative z-10 grid w-full grid-cols-1 lg:grid-cols-2">

        {/* ── Panel izquierdo — solo desktop ── */}
        <section className="hidden lg:flex lg:flex-col lg:justify-between px-14 py-10 xl:px-16 xl:py-14">
          <div>
            <span
              className="inline-flex items-center rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.25em]"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
              }}
            >
              Panel administrativo
            </span>
          </div>

          <div className="max-w-lg">
            <h1
              className="font-serif text-5xl leading-[1.08] xl:text-6xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Control total del
              <span className="block" style={{ color: 'var(--accent)' }}>
                ecosistema KOB
              </span>
            </h1>
            <p
              className="mt-5 max-w-md text-base leading-7"
              style={{ color: 'var(--text-secondary)' }}
            >
              Gestiona el catálogo, los usuarios y la operación completa de
              Joyería KOB desde un solo lugar.
            </p>
          </div>

          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Acceso restringido • solo personal autorizado
          </p>
        </section>

        {/* ── Panel derecho — formulario ── */}
        <section className="flex h-[calc(100vh-64px)] items-center justify-center px-4 py-6 sm:px-10">
          <div
            className="w-full max-w-sm animate-fade-in rounded-2xl border p-6 shadow-lg backdrop-blur-xl sm:max-w-md sm:p-8"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Cabecera */}
            <div className="mb-5">
              <p
                className="text-xs uppercase tracking-[0.3em]"
                style={{ color: 'var(--accent)' }}
              >
                Panel administrativo
              </p>
              <h2
                className="mt-1 font-serif text-3xl"
                style={{ color: 'var(--text-primary)' }}
              >
                Iniciar sesión
              </h2>
              <p
                className="mt-1 text-xs leading-5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Acceso restringido. Solo personal autorizado.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

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
                  placeholder="admin@kob.com"
                  autoComplete="email"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)]/20"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                  }}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
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
                    autoComplete="current-password"
                    className="w-full rounded-xl border px-3 py-2.5 pr-10 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)]/20"
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
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Botón */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {loading ? 'Ingresando...' : 'Entrar al panel'}
              </button>
            </form>

            {/* Pie — sin registro, solo ir al login cliente */}
            <p
              className="mt-4 text-center text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              ¿Eres cliente?{' '}
              <Link
                to="/login"
                className="font-medium transition hover:opacity-80"
                style={{ color: 'var(--accent)' }}
              >
                Ir al login
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
