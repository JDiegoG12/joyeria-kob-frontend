/**
 * @file admin-login-page.tsx
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthService } from '@/features/auth/services/auth.service'; // ✅ Nombre correcto
import { useAuthStore } from '@/store/auth.store';

interface FormState {
  email: string;
  password: string;
}

export const AdminLoginPage = () => {
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

      // ✅ AuthService.login() retorna void y persiste la sesión internamente
      await AuthService.login({
        email: form.email,
        password: form.password,
      });

      // ✅ Leer el usuario desde el store (ya fue guardado por AuthService)
      const user = useAuthStore.getState().user;

      // ✅ Validar rol admin
      if (user?.role !== 'ADMIN') {
        toast.error('No tienes permisos de administrador');
        AuthService.logout();
        return;
      }

      toast.success('Bienvenido al panel admin 💎');

      // ✅ Redirigir a la ruta admin correcta (no /admin/dashboard)
      navigate('/admin/joyas');

    } catch (error: any) {
      const message = error?.message || 'Error al iniciar sesión';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.1),_transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(255,255,255,0.03),transparent,rgba(0,0,0,0.05))]" />

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2">

        <section className="hidden lg:flex lg:flex-col lg:justify-between px-16 py-14">
          <div>
            <span className="inline-flex items-center rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)]/70 px-4 py-2 text-xs uppercase tracking-[0.25em] text-[var(--text-secondary)]">
              Panel administrativo
            </span>
          </div>

          <div className="max-w-xl">
            <h1 className="font-serif text-5xl text-[var(--text-primary)]">
              Control total del
              <span className="block text-[var(--accent)]">
                ecosistema KOB
              </span>
            </h1>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md rounded-[32px] border border-[var(--border-color)] bg-[var(--bg-secondary)]/85 p-8 shadow-xl">

            <div className="mb-8">
              <h2 className="text-3xl font-serif text-[var(--text-primary)]">
                Iniciar sesión
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="admin@kob.com"
                  className="w-full rounded-2xl border px-4 py-3"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>

              <div>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border px-4 py-3"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full cursor-pointer rounded-2xl bg-[var(--accent)] py-3 text-white"
              >
                {loading ? 'Ingresando...' : 'Entrar al panel'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-[var(--accent)]">
                Ir a login cliente
              </Link>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
};
