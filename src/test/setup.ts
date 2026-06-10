/**
 * @file setup.ts
 * @description Setup global de Vitest, cargado antes de cada archivo de test
 * (configurado en `vite.config.ts` → `test.setupFiles`).
 *
 * Registra los matchers de `@testing-library/jest-dom` (p. ej. `toBeInTheDocument`)
 * para que estén disponibles en la futura fase de tests de hooks/componentes.
 * En la tanda actual (lógica pura) no son necesarios, pero dejarlos aquí evita
 * re-tocar la configuración más adelante.
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

/**
 * Polyfills de APIs del navegador que jsdom no implementa, necesarias para los
 * hooks/componentes que las consumen. Los tests que necesiten controlar su
 * comportamiento pueden sobrescribirlas con `vi.stubGlobal`.
 */
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// jsdom no implementa scrollIntoView; lo stubeamos como no-op.
window.HTMLElement.prototype.scrollIntoView = vi.fn();
