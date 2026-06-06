/**
 * @file get-error-message.ts
 * @description Extrae un mensaje de error legible a partir de un error
 * desconocido (`unknown`), sin recurrir a `any`.
 *
 * Cubre los dos casos habituales en la app:
 * - Errores de Axios: el mensaje útil viene en `error.response.data.message`.
 * - `Error` planos (p. ej. los que lanza `AuthService`): el mensaje viene en
 *   `error.message`.
 *
 * Si no encuentra ninguno, devuelve el `fallback` provisto. Centralizarlo evita
 * repetir el patrón `catch (error: any) { error?.response?.data?.message || ... }`
 * en cada formulario/servicio.
 */

/** Forma parcial de un error de Axios, para el estrechamiento de tipos. */
interface MaybeApiError {
  response?: { data?: { message?: unknown } };
  message?: unknown;
}

/**
 * Devuelve el mensaje de error más específico disponible, o `fallback`.
 *
 * @param error - Error capturado (de tipo `unknown`).
 * @param fallback - Texto a usar si no se encuentra un mensaje legible.
 */
export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (error && typeof error === 'object') {
    const maybe = error as MaybeApiError;

    const apiMessage = maybe.response?.data?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage;
    }

    if (typeof maybe.message === 'string' && maybe.message.trim()) {
      return maybe.message;
    }
  }

  return fallback;
};
