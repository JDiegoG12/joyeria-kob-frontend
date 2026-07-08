/**
 * @file page-loader.tsx
 * @description Spinner de pantalla completa usado como fallback de `<Suspense>`
 * durante la carga perezosa (lazy loading) de los chunks de página.
 *
 * ## Cuándo se muestra
 * Aparece mientras el navegador descarga el chunk JS de una ruta que aún no ha
 * sido visitada en esta sesión (navegación interna). En el ARRANQUE inicial no
 * se ve: la pantalla de carga de `index.html` (`#kob-loader`) tapa todo hasta
 * que el contenido está listo (ver `BootOverlayDismiss` en el router), así que
 * nunca coinciden dos indicadores de carga.
 *
 * ## Diseño
 * - Ocupa toda la ventana para que no haya saltos de layout.
 * - Mismo lenguaje visual que `#kob-loader` (fondo de tema + spinner dorado),
 *   para que el arranque y las navegaciones internas se sientan uniformes.
 * - Sin dependencias externas: HTML/CSS inline, parte del bundle inicial.
 *
 * ## Uso
 * ```tsx
 * import { PageLoader } from '@/features/shared/pages/page-loader';
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
      className="h-7.5 w-7.5 animate-spin rounded-full border-2"
      style={{
        borderColor: 'rgba(190, 166, 75, 0.22)', // --warm-gold @22% (pista)
        borderTopColor: '#bea64b', // --warm-gold (indicador)
      }}
    />
  </div>
);
