/**
 * @file google-login-button.tsx
 * @description Botón "Continuar con Google" reutilizable en login y registro.
 *
 * Usa el componente oficial `<GoogleLogin>` de `@react-oauth/google`, que
 * devuelve un `credential` (ID token). Ese token se envía al backend
 * (`POST /auth/google`), que lo verifica, crea/vincula la cuenta y devuelve la
 * sesión. En éxito persiste la sesión y redirige a la ruta indicada.
 *
 * El proveedor `<GoogleOAuthProvider>` se monta en `App.tsx`; si falta el
 * `VITE_GOOGLE_CLIENT_ID` el botón de Google no se renderiza correctamente.
 */

import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '@/store/toast.store';
import { AuthService } from '@/features/auth/services/auth.service';

interface GoogleLoginButtonProps {
  /** Ruta a la que se redirige tras un login exitoso. Por defecto, el inicio. */
  redirectTo?: string;
}

export const GoogleLoginButton = ({
  redirectTo = '/',
}: GoogleLoginButtonProps) => {
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  const handleSuccess = async (credential?: string) => {
    if (!credential) {
      showToast('error', 'No se recibió la credencial de Google.');
      return;
    }
    try {
      await AuthService.loginWithGoogle(credential);
      showToast('success', '¡Bienvenido a Joyería KOB!');
      navigate(redirectTo);
    } catch (error: unknown) {
      showToast(
        'error',
        error instanceof Error
          ? error.message
          : 'No se pudo iniciar sesión con Google.',
      );
    }
  };

  return (
    <div className="flex w-full justify-center">
      <GoogleLogin
        onSuccess={(resp) => handleSuccess(resp.credential)}
        onError={() =>
          showToast('error', 'No se pudo iniciar sesión con Google.')
        }
        text="continue_with"
        shape="rectangular"
        width="320"
      />
    </div>
  );
};
