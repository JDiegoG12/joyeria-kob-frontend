/**
 * @file login-page.tsx
 * @description Página de inicio de sesión para clientes.
 * UI moderna, premium y compatible con modo claro / oscuro.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthService } from '@/features/auth/services/auth.service'; // ✅

interface FormState {
  email: string;
  password: string;
}

export const LoginPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: '',
    }));
  };

  const validate = () => {
    const newErrors: Partial<FormState> = {};

    if (!form.email.trim()) {
      newErrors.email = 'El correo es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Correo inválido';
    }

    if (!form.password.trim()) {
      newErrors.password = 'La contraseña es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      // ✅ Llamada real al servicio de autenticación
      await AuthService.login({
        email: form.email,
        password: form.password,
      });

      toast.success('¡Hola de nuevo!');
      navigate('/catalogo');
    } catch (error: any) {
      const message = error?.message || 'Error al iniciar sesión';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(212,175,55,0.08),_transparent_22%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(255,255,255,0.04),transparent,rgba(212,175,55,0.04))] dark:bg-[linear-gradient(to_bottom_right,rgba(255,255,255,0.02),transparent,rgba(212,175,55,0.03))]" />

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="hidden lg:flex lg:flex-col lg:justify-between px-16 py-14 animate-fade-in">
          <div>
            <span className="inline-flex items-center rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)]/70 px-4 py-2 text-xs uppercase tracking-[0.25em] text-[var(--text-secondary)] backdrop-blur-md">
              Joyería KOB
            </span>
          </div>

          <div className="max-w-xl">
            <p className="mb-5 text-sm uppercase tracking-[0.35em] text-[var(--accent)]">
              Elegancia atemporal
            </p>
            <h1 className="font-serif text-6xl leading-[1.05] text-[var(--text-primary)]">
              Joyas que cuentan
              <span className="block text-[var(--accent)]">tu historia</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[var(--text-secondary)]">
              Ingresa para explorar piezas exclusivas, guardar tus intereses y
              continuar una experiencia diseñada con detalle, lujo y
              personalización.
            </p>
          </div>

          <div className="text-sm text-[var(--text-secondary)]">
            Diseño premium • experiencia cuidada • acceso seguro
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md animate-fade-in rounded-[32px] border border-[var(--border-color)] bg-[var(--bg-secondary)]/85 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.18)] backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_25px_90px_rgba(0,0,0,0.25)] sm:p-10 dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
                Bienvenida
              </p>
              <h2 className="mt-3 font-serif text-4xl text-[var(--text-primary)]">
                Iniciar sesión
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                Accede a tu cuenta para continuar con tu experiencia dentro de
                Joyería KOB.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]/70 px-4 py-3.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10"
                />
                {errors.email ? (
                  <p className="mt-2 text-sm text-red-500">{errors.email}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]/70 px-4 py-3.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10"
                />
                {errors.password ? (
                  <p className="mt-2 text-sm text-red-500">{errors.password}</p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-2xl bg-[var(--accent)] px-5 py-3.5 font-medium text-white transition-all hover:scale-[1.02] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Ingresando...' : 'Entrar'}
              </button>
            </form>

            <div className="mt-8 space-y-3 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                ¿No tienes cuenta?{' '}
                <Link
                  to="/registro"
                  className="font-medium text-[var(--accent)] transition hover:opacity-80"
                >
                  Regístrate
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
