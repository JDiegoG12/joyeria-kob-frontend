/**
 * @file admin-login-page.tsx
 * @description Página de inicio de sesión para administradores.
 * UI moderna, premium y compatible con modo claro / oscuro.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

interface FormState {
  email: string;
  password: string;
}

export const AdminLoginPage = () => {
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
      await new Promise((r) => setTimeout(r, 800));
      alert('Login admin listo (esperando backend)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.1),_transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(255,255,255,0.03),transparent,rgba(0,0,0,0.05))]" />

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Panel izquierdo */}
        <section className="hidden lg:flex lg:flex-col lg:justify-between px-16 py-14 animate-fade-in">
          <div>
            <span className="inline-flex items-center rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)]/70 px-4 py-2 text-xs uppercase tracking-[0.25em] text-[var(--text-secondary)] backdrop-blur-md">
              Panel administrativo
            </span>
          </div>

          <div className="max-w-xl">
            <p className="mb-5 text-sm uppercase tracking-[0.35em] text-[var(--accent)]">
              Gestión interna
            </p>
            <h1 className="font-serif text-5xl leading-[1.1] text-[var(--text-primary)]">
              Control total del
              <span className="block text-[var(--accent)]">
                ecosistema KOB
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[var(--text-secondary)]">
              Accede al panel para administrar joyas, categorías, clientes,
              promociones y mantener la operación de la plataforma.
            </p>
          </div>

          <div className="text-sm text-[var(--text-secondary)]">
            Acceso restringido • control seguro • gestión centralizada
          </div>
        </section>

        {/* Formulario */}
        <section className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md animate-fade-in rounded-[32px] border border-[var(--border-color)] bg-[var(--bg-secondary)]/85 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.18)] backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_25px_90px_rgba(0,0,0,0.25)] sm:p-10 dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
                Acceso admin
              </p>
              <h2 className="mt-3 font-serif text-3xl text-[var(--text-primary)]">
                Iniciar sesión
              </h2>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                Ingresa con tus credenciales administrativas.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                  Correo
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="admin@kob.com"
                  className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]/70 px-4 py-3.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-500">{errors.email}</p>
                )}
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
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-2xl bg-[var(--accent)] px-5 py-3.5 font-medium text-white transition-all hover:scale-[1.02] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Ingresando...' : 'Entrar al panel'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                ¿No eres administrador?{' '}
                <Link
                  to="/login"
                  className="font-medium text-[var(--accent)] transition hover:opacity-80"
                >
                  Ir al acceso cliente
                </Link>
              </p>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
};