/**
 * @file page-loader.tsx
 * @description Spinner de pantalla completa usado como fallback de `<Suspense>`
 * durante la carga perezosa (lazy loading) de los chunks de página.
 *
 * ## Cuándo se muestra
 * Aparece mientras el navegador descarga el chunk JS de una ruta
 * que aún no ha sido visitada en esta sesión. En visitas siguientes
 * el chunk está en caché y este componente no se llega a renderizar.
 *
 * ## Diseño
 * - Ocupa toda la ventana para que no haya saltos de layout.
 * - Usa tokens de diseño del sistema (`--accent`, `--bg-primary`) para
 *   respetar el tema claro/oscuro sin importar CSS externo.
 * - Sin dependencias externas: solo HTML/CSS inline para que cargue
 *   instantáneamente (es parte del bundle inicial).
 *
 * ## Uso
 * ```tsx
 * import { PageLoader } from '@/features/shared/components/page-loader';
 *
 * <Suspense fallback={<PageLoader />}>
 *   <MiPaginaLazy />
 * </Suspense>
 * ```
 */
export const PageLoader = () => (
  <div
    className="flex min-h-screen items-center justify-center"
    style={{ backgroundColor: 'var(--bg-primary)' }}
    role="status"
    aria-label="Cargando página"
  >
    <div
      className="h-9 w-9 animate-spin rounded-full border-2"
      style={{
        borderColor: 'var(--border-color)',
        borderTopColor: 'var(--accent)',
      }}
    />
  </div>
);
