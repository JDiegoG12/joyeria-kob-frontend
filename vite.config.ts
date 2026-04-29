/**
 * @file vite.config.ts
 * @description Configuración de Vite para Joyería KOB Frontend.
 *
 * ## Estrategia de code splitting
 *
 * El bundle se divide en chunks según el origen del código:
 *
 * ### Chunks de vendor (dependencias de node_modules)
 * Las dependencias se agrupan por dominio funcional para maximizar
 * el hit rate de caché del navegador. Si solo cambia el código de la
 * app, los chunks de vendor no se re-descargan porque su hash no cambia.
 *
 * | Chunk           | Contenido                              | Por qué separado                         |
 * |-----------------|----------------------------------------|------------------------------------------|
 * | vendor-react    | react, react-dom, react-router-dom     | Núcleo — nunca cambia entre deploys      |
 * | vendor-charts   | recharts                               | ~150 KB; solo lo necesita /admin/metricas|
 * | vendor-motion   | framer-motion                          | ~90 KB; animaciones opcionales           |
 * | vendor-ui       | lucide-react, react-hot-toast          | Iconos y notificaciones                  |
 * | vendor-state    | zustand, axios                         | Estado global y cliente HTTP             |
 *
 * ### Chunks de página (código de la app)
 * El lazy loading en `router/index.tsx` hace que Vite genere
 * automáticamente un chunk por cada página importada con `React.lazy()`.
 * Vite nombra estos chunks según el path del módulo, por ejemplo:
 * - `home-page-[hash].js`
 * - `admin-metrics-page-[hash].js`
 *
 * ### Resultado esperado
 * ```
 * vendor-react.js     ~140 KB (gzip ~45 KB)   ← descarga una sola vez
 * vendor-charts.js    ~150 KB (gzip ~50 KB)   ← solo si visita métricas
 * vendor-motion.js    ~ 90 KB (gzip ~30 KB)   ← solo si hay animaciones
 * index.js            ~ 80 KB (gzip ~25 KB)   ← bundle inicial mínimo
 * home-page.js        ~ 50 KB (gzip ~15 KB)   ← al visitar /catalogo
 * admin-*.js          ~ 30 KB c/u             ← al visitar cada ruta admin
 * ```
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      // Alias @ → src/ para imports absolutos en toda la app.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    rollupOptions: {
      output: {
        /**
         * `manualChunks` divide las dependencias de node_modules en grupos
         * estables. Al tener hashes predecibles, el navegador puede cachear
         * cada vendor chunk de forma independiente entre deploys.
         *
         * La función recibe el `id` de cada módulo (su path en disco) y
         * devuelve el nombre del chunk al que debe pertenecer, o `undefined`
         * para dejar que Rollup decida (código de la app → chunks de página).
         *
         * @param id - Path absoluto del módulo siendo procesado.
         * @returns Nombre del chunk de vendor, o `undefined`.
         */
        manualChunks(id) {
          // ── Núcleo de React ────────────────────────────────────────
          // Se separa porque es la dependencia más estable de todas.
          // Un cambio en cualquier otro vendor no invalida este chunk.
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/') ||
            id.includes('node_modules/react-router/')
          ) {
            return 'vendor-react';
          }

          // ── Recharts (gráficas) ────────────────────────────────────
          // ~150 KB minificado. Solo lo necesita /admin/metricas.
          // Al separarlo, los usuarios del catálogo nunca lo descargan.
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }

          // ── Framer Motion (animaciones) ────────────────────────────
          // ~90 KB minificado. Se carga solo cuando hay componentes animados.
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }

          // ── UI: iconos + notificaciones ────────────────────────────
          // Lucide y react-hot-toast se usan en muchas rutas pero son
          // estables → conviene tenerlos en caché por separado.
          if (
            id.includes('node_modules/lucide-react') ||
            id.includes('node_modules/react-hot-toast')
          ) {
            return 'vendor-ui';
          }

          // ── Estado global + cliente HTTP ───────────────────────────
          // Zustand y Axios rara vez cambian de versión.
          if (
            id.includes('node_modules/zustand') ||
            id.includes('node_modules/axios')
          ) {
            return 'vendor-state';
          }

          // Todo lo demás (código de la app) lo divide Rollup
          // automáticamente gracias al lazy loading del router.
          return undefined;
        },
      },
    },
  },
});