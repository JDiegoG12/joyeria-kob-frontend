/**
 * @file profile-page.tsx
 * @description Página de perfil del usuario autenticado (CLIENT y ADMIN).
 *
 * ## Historias cubiertas (HE-7_HU_03)
 * 1. Carga de datos del perfil al montar la página.
 * 2. Edición de nombre, apellido, teléfono y dirección.
 * 3. Cambio de contraseña con validación de contraseña actual.
 * 4. Validación de unicidad de correo electrónico.
 * 5. Cancelar edición restaura los datos originales.
 *
 * ## Diseño
 * - Mismo sistema de tokens CSS que el resto de la app (var(--accent), etc.)
 * - Layout de dos columnas en desktop (sidebar de avatar + tabs de contenido)
 * - 100% responsive — funciona en móvil sin scroll horizontal
 * - Las notificaciones usan `useToastStore` para respetar el tema activo
 */

import { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  Camera,
  ShieldCheck,
} from 'lucide-react';
import { useToastStore } from '@/store/toast.store';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/api/api-client';

// ─────────────────────────────
// TIPOS
// ─────────────────────────────

interface ProfileForm {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type ActiveTab = 'info' | 'security';

const blockClipboard = (e: React.ClipboardEvent) => e.preventDefault();

// ─────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────

export const ProfilePage = () => {
  const { showToast } = useToastStore();
  const { user, setSession, token } = useAuthStore();

  // ── Estado del tab activo ──
  const [activeTab, setActiveTab] = useState<ActiveTab>('info');

  // ── Estado del formulario de perfil ──
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [originalForm, setOriginalForm] = useState<ProfileForm>(form);
  const [profileErrors, setProfileErrors] = useState<Partial<ProfileForm>>({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // ── Estado del formulario de contraseña ──
  const [pwForm, setPwForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwErrors, setPwErrors] = useState<Partial<PasswordForm>>({});
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Cargar datos del usuario al montar ──
  useEffect(() => {
    if (user) {
      const initial: ProfileForm = {
        name: user.name ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        address: (user as any).address ?? '',
      };
      setForm(initial);
      setOriginalForm(initial);
    }
  }, [user]);

  // ── Detectar cambios ──
  useEffect(() => {
    const changed = (Object.keys(form) as (keyof ProfileForm)[]).some(
      (k) => form[k] !== originalForm[k],
    );
    setIsDirty(changed);
  }, [form, originalForm]);

  // ─────────────────────────────
  // HANDLERS — PERFIL
  // ─────────────────────────────

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setProfileErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateProfile = (): boolean => {
    const errors: Partial<ProfileForm> = {};
    if (!form.name.trim()) errors.name = 'El nombre es obligatorio';
    if (!form.lastName.trim()) errors.lastName = 'El apellido es obligatorio';
    if (!form.email.trim()) errors.email = 'El correo es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Correo inválido';
    if (form.phone && !/^[\d\s\-+()]{7,15}$/.test(form.phone))
      errors.phone = 'Teléfono inválido';
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;
    try {
      setProfileLoading(true);
      const { data: envelope } = await apiClient.put<{
        success: boolean;
        data: any;
        message: string;
      }>(`/users/me`, {
        name: form.name,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || null,
        address: form.address || null,
      });

      // Actualizar el store con los nuevos datos
      if (token && envelope?.data) {
        setSession(token, { ...user!, ...envelope.data });
      }

      setOriginalForm(form);
      showToast('success', 'Perfil actualizado exitosamente');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || 'Error al actualizar';
      // HU_03 — criterio 4: unicidad de correo
      if (msg.toLowerCase().includes('correo') || msg.toLowerCase().includes('email')) {
        setProfileErrors({ email: 'El correo electrónico ya está en uso por otra cuenta' });
      } else {
        showToast('error', msg);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(originalForm);
    setProfileErrors({});
    setIsDirty(false);
  };

  // ─────────────────────────────
  // HANDLERS — CONTRASEÑA
  // ─────────────────────────────

  const updatePwField = (field: keyof PasswordForm, value: string) => {
    setPwForm((prev) => ({ ...prev, [field]: value }));
    setPwErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validatePassword = (): boolean => {
    const errors: Partial<PasswordForm> = {};
    if (!pwForm.currentPassword) errors.currentPassword = 'Ingresa tu contraseña actual';
    if (!pwForm.newPassword) errors.newPassword = 'Ingresa la nueva contraseña';
    else if (pwForm.newPassword.length < 6) errors.newPassword = 'Mínimo 6 caracteres';
    if (!pwForm.confirmPassword) errors.confirmPassword = 'Confirma la nueva contraseña';
    else if (pwForm.newPassword !== pwForm.confirmPassword)
      errors.confirmPassword = 'Las contraseñas no coinciden';
    setPwErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    try {
      setPwLoading(true);
      await apiClient.put(`/users/me`, {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('success', 'Contraseña actualizada exitosamente');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || 'Error al cambiar contraseña';
      if (msg.toLowerCase().includes('incorrecta') || msg.toLowerCase().includes('actual')) {
        setPwErrors({ currentPassword: 'Contraseña actual incorrecta' });
      } else {
        showToast('error', msg);
      }
    } finally {
      setPwLoading(false);
    }
  };

  // ─────────────────────────────
  // RENDER
  // ─────────────────────────────

  const initials = `${form.name.charAt(0)}${form.lastName.charAt(0)}`.toUpperCase();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div
      className="relative min-h-[calc(100vh-64px)] px-4 py-8 sm:px-6 lg:px-10"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Fondo decorativo */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(212,175,55,0.08),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(212,175,55,0.05),_transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-4xl">

        {/* ── Encabezado de página ── */}
        <div className="mb-8">
          <p
            className="text-xs uppercase tracking-[0.35em]"
            style={{ color: 'var(--accent)' }}
          >
            {isAdmin ? 'Panel administrativo' : 'Mi cuenta'}
          </p>
          <h1
            className="mt-1 font-serif text-3xl sm:text-4xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Mi perfil
          </h1>
          <p
            className="mt-1 text-xs leading-5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Gestiona tu información personal y seguridad de la cuenta.
          </p>
        </div>

        {/* ── Layout principal ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">

          {/* ── Sidebar — avatar + badge de rol ── */}
          <aside
            className="flex flex-col items-center rounded-2xl border p-6 text-center lg:items-start lg:text-left"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Avatar */}
            <div className="relative mb-4 self-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold text-white"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {initials || <User size={32} />}
              </div>
              {/* Icono de cámara decorativo */}
              <div
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)',
                }}
              >
                <Camera size={12} />
              </div>
            </div>

            {/* Nombre */}
            <p
              className="self-center font-serif text-xl lg:self-start"
              style={{ color: 'var(--text-primary)' }}
            >
              {form.name} {form.lastName}
            </p>
            <p
              className="mt-0.5 self-center text-xs lg:self-start"
              style={{ color: 'var(--text-secondary)' }}
            >
              {form.email}
            </p>

            {/* Badge rol */}
            <div className="mt-3 self-center lg:self-start">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-widest"
                style={
                  isAdmin
                    ? {
                        backgroundColor: 'rgba(212,175,55,0.15)',
                        color: 'var(--accent)',
                        border: '1px solid rgba(212,175,55,0.35)',
                      }
                    : {
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                      }
                }
              >
                {isAdmin && <ShieldCheck size={11} />}
                {isAdmin ? 'Administrador' : 'Cliente'}
              </span>
            </div>

            {/* Divider */}
            <div
              className="my-5 h-px w-full"
              style={{ backgroundColor: 'var(--border-color)' }}
            />

            {/* Nav de tabs (sidebar en desktop, fila en móvil) */}
            <nav className="flex w-full flex-row gap-2 lg:flex-col">
              <TabButton
                active={activeTab === 'info'}
                icon={<User size={15} />}
                label="Información"
                onClick={() => setActiveTab('info')}
              />
              <TabButton
                active={activeTab === 'security'}
                icon={<Lock size={15} />}
                label="Seguridad"
                onClick={() => setActiveTab('security')}
              />
            </nav>

            {/* Fecha de creación */}
            {user?.createdAt && (
              <p
                className="mt-5 self-center text-center text-[10px] leading-4 lg:self-start lg:text-left"
                style={{ color: 'var(--text-secondary)' }}
              >
                Miembro desde{' '}
                {new Date(user.createdAt).toLocaleDateString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                })}
              </p>
            )}
          </aside>

          {/* ── Panel de contenido ── */}
          <div
            className="rounded-2xl border p-6 sm:p-8"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* ── TAB: Información personal ── */}
            {activeTab === 'info' && (
              <section>
                <SectionHeader
                  label="Datos personales"
                  title="Información de perfil"
                  description="Actualiza tu nombre, correo electrónico, teléfono y dirección."
                />

                <div className="mt-6 space-y-4">

                  {/* Nombre + Apellido */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                      label="Nombre"
                      error={profileErrors.name}
                    >
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Isabella"
                        autoComplete="given-name"
                        className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)]/20"
                        style={inputStyle}
                      />
                    </Field>
                    <Field
                      label="Apellido"
                      error={profileErrors.lastName}
                    >
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        placeholder="Pérez"
                        autoComplete="family-name"
                        className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)]/20"
                        style={inputStyle}
                      />
                    </Field>
                  </div>

                  {/* Correo */}
                  <Field
                    label="Correo electrónico"
                    error={profileErrors.email}
                  >
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      onCopy={blockClipboard}
                      onCut={blockClipboard}
                      onPaste={blockClipboard}
                      placeholder="correo@ejemplo.com"
                      autoComplete="email"
                      className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)]/20"
                      style={inputStyle}
                    />
                  </Field>

                  {/* Teléfono */}
                  <Field
                    label="Teléfono"
                    hint="Opcional"
                    error={profileErrors.phone}
                  >
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="+57 300 000 0000"
                      autoComplete="tel"
                      className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)]/20"
                      style={inputStyle}
                    />
                  </Field>

                  {/* Dirección */}
                  <Field
                    label="Dirección"
                    hint="Opcional"
                    error={profileErrors.address}
                  >
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="Calle 10 # 5-20, Bogotá"
                      autoComplete="street-address"
                      className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)]/20"
                      style={inputStyle}
                    />
                  </Field>

                  {/* Botones de acción */}
                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={!isDirty || profileLoading}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-5 py-2.5 text-sm font-medium transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <X size={14} />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={!isDirty || profileLoading}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <Check size={14} />
                      {profileLoading ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* ── TAB: Seguridad (contraseña) ── */}
            {activeTab === 'security' && (
              <section>
                <SectionHeader
                  label="Seguridad"
                  title="Cambiar contraseña"
                  description="Para actualizar tu contraseña debes ingresar la contraseña actual y elegir una nueva de al menos 6 caracteres."
                />

                <div className="mt-6 space-y-4">
                  {/* Contraseña actual */}
                  <Field
                    label="Contraseña actual"
                    error={pwErrors.currentPassword}
                  >
                    <PasswordInput
                      value={pwForm.currentPassword}
                      onChange={(v) => updatePwField('currentPassword', v)}
                      show={showCurrent}
                      onToggle={() => setShowCurrent((p) => !p)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </Field>

                  {/* Nueva contraseña */}
                  <Field
                    label="Nueva contraseña"
                    error={pwErrors.newPassword}
                  >
                    <PasswordInput
                      value={pwForm.newPassword}
                      onChange={(v) => updatePwField('newPassword', v)}
                      show={showNew}
                      onToggle={() => setShowNew((p) => !p)}
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
                    />
                  </Field>

                  {/* Confirmar contraseña */}
                  <Field
                    label="Confirmar nueva contraseña"
                    error={pwErrors.confirmPassword}
                  >
                    <PasswordInput
                      value={pwForm.confirmPassword}
                      onChange={(v) => updatePwField('confirmPassword', v)}
                      show={showConfirm}
                      onToggle={() => setShowConfirm((p) => !p)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </Field>

                  {/* Indicador de fortaleza */}
                  {pwForm.newPassword.length > 0 && (
                    <PasswordStrength password={pwForm.newPassword} />
                  )}

                  {/* Botón */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleChangePassword}
                      disabled={pwLoading}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <Lock size={14} />
                      {pwLoading ? 'Actualizando...' : 'Actualizar contraseña'}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────

/** Estilo reutilizable para todos los inputs */
const inputStyle: React.CSSProperties = {
  borderColor: 'var(--border-color)',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
};

interface TabButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const TabButton = ({ active, icon, label, onClick }: TabButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium uppercase tracking-wider transition-all lg:justify-start lg:px-4"
    style={{
      backgroundColor: active ? 'rgba(212,175,55,0.12)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--text-secondary)',
      border: active ? '1px solid rgba(212,175,55,0.25)' : '1px solid transparent',
    }}
  >
    {icon}
    {label}
  </button>
);

interface SectionHeaderProps {
  label: string;
  title: string;
  description: string;
}

const SectionHeader = ({ label, title, description }: SectionHeaderProps) => (
  <div>
    <p
      className="text-xs uppercase tracking-[0.3em]"
      style={{ color: 'var(--accent)' }}
    >
      {label}
    </p>
    <h2
      className="mt-1 font-serif text-2xl"
      style={{ color: 'var(--text-primary)' }}
    >
      {title}
    </h2>
    <p
      className="mt-1 text-xs leading-5"
      style={{ color: 'var(--text-secondary)' }}
    >
      {description}
    </p>
  </div>
);

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

const Field = ({ label, hint, error, children }: FieldProps) => (
  <div>
    <div className="mb-1 flex items-baseline gap-1.5">
      <label
        className="block text-xs font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        {label}
      </label>
      {hint && (
        <span
          className="text-[10px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {hint}
        </span>
      )}
    </div>
    {children}
    {error && (
      <p className="mt-1 text-xs text-red-500">{error}</p>
    )}
  </div>
);

interface PasswordInputProps {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
  autoComplete?: string;
}

const PasswordInput = ({
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoComplete,
}: PasswordInputProps) => (
  <div className="relative">
    <input
      type={show ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="w-full rounded-xl border px-3 py-2.5 pr-10 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)]/20"
      style={inputStyle}
    />
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 transition hover:opacity-70"
      style={{ color: 'var(--text-secondary)' }}
      aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  </div>
);

/** Barra de fortaleza de contraseña */
const PasswordStrength = ({ password }: { password: string }) => {
  const score = getPasswordScore(password);
  const labels = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor:
                i < score ? colors[score - 1] : 'var(--border-color)',
            }}
          />
        ))}
      </div>
      <p
        className="text-[10px]"
        style={{ color: score > 0 ? colors[score - 1] : 'var(--text-secondary)' }}
      >
        {labels[score - 1] ?? 'Muy débil'}
      </p>
    </div>
  );
};

function getPasswordScore(pw: string): number {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 5);
}
