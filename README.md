# Joyería KOB — Frontend

Interfaz web de la plataforma Joyería KOB, construida con React 19, TypeScript 6, Vite 5, Tailwind CSS 4 y Zustand 5.

---

## Requisitos previos

Antes de clonar el repositorio, asegúrate de tener instaladas estas versiones exactas en tu máquina:

| Herramienta | Versión requerida  | Verificar con   |
| ----------- | ------------------ | --------------- |
| Node.js     | v22.19.0           | `node -v`       |
| npm         | v10.9.3            | `npm -v`        |
| Git         | Cualquier reciente | `git --version` |

> Si tu versión de Node no coincide, usa [nvm-windows](https://github.com/coreybutler/nvm-windows) (Windows) o [nvm](https://github.com/nvm-sh/nvm) (Mac/Linux) para cambiar de versión sin afectar otros proyectos.

---

## Extensiones recomendadas para VS Code

Instala estas extensiones antes de abrir el proyecto. Son obligatorias para que el formato automático y el linter funcionen al guardar.

| Extensión                 | ID                          | Para qué sirve                           |
| ------------------------- | --------------------------- | ---------------------------------------- |
| ESLint                    | `dbaeumer.vscode-eslint`    | Muestra errores de código en tiempo real |
| Prettier                  | `esbenp.prettier-vscode`    | Formatea el código al guardar            |
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` | Autocompletado de clases Tailwind        |
| TypeScript Importer       | `pmneo.tsimporter`          | Autoimporta módulos TypeScript           |

### Configuración de VS Code requerida

Crea el archivo `.vscode/settings.json` en la raíz del proyecto con este contenido:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

> Este archivo no está en el repositorio porque es configuración local de cada desarrollador.

---

## Primeros pasos al clonar el repositorio

Ejecuta estos comandos **en orden** la primera vez que clones el proyecto:

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd joyeria-kob-frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
```

Abre el archivo `.env` recién creado y completa los valores según tu entorno local:

```env
VITE_API_URL=http://localhost:4000/api
```

> El archivo `.env` nunca se sube al repositorio. Si necesitas agregar una nueva variable, agrégala también en `.env.example` con el valor vacío para que el equipo sepa que existe.

```bash
# 4. Verificar que todo está en orden antes de empezar a trabajar
npm run lint
npm run build
```

Si ambos comandos terminan sin errores, el entorno está listo.

---

## Scripts disponibles

| Comando           | Descripción                                                         |
| ----------------- | ------------------------------------------------------------------- |
| `npm run dev`     | Inicia el servidor de desarrollo con HMR en `http://localhost:5173` |
| `npm run build`   | Compila TypeScript y genera el build de producción en `/dist`       |
| `npm run lint`    | Analiza el código con ESLint y reporta errores                      |
| `npm run format`  | Formatea automáticamente todos los archivos `src/**/*.{ts,tsx,css}` |
| `npm run preview` | Previsualiza el build de producción localmente                      |

---

## Stack tecnológico

| Tecnología   | Versión | Rol                              |
| ------------ | ------- | -------------------------------- |
| React        | ^19.2.4 | Librería de UI                   |
| TypeScript   | ^6.0.2  | Tipado estático                  |
| Vite         | ^5.4.1  | Bundler y servidor de desarrollo |
| Tailwind CSS | ^4.2.2  | Estilos utilitarios              |
| Zustand      | ^5.0.12 | Estado global                    |
| Axios        | ^1.14.0 | Cliente HTTP                     |
| ESLint       | ^9.10.0 | Análisis estático de código      |
| Prettier     | ^3.3.3  | Formateo de código               |
| Husky        | ^9.1.6  | Git hooks automáticos            |
| commitlint   | ^19.8.0 | Validación de mensajes de commit |

---

## Estructura de carpetas

```
src/
├── api/              # Instancia base de Axios y configuración HTTP
├── components/
│   └── ui/           # Componentes atómicos reutilizables (Button, Input, Modal)
├── features/         # Módulos funcionales de la aplicación
│   ├── catalog/      # Listado de joyas y filtros
│   └── customization/# Personalizador de anillos
├── layouts/          # Estructuras de página (MainLayout, AuthLayout)
├── shared/           # Tipos globales, utilidades y constantes
├── store/            # Estado global con Zustand
│   ├── cart.store.ts
│   └── theme.store.ts
├── main.tsx          # Punto de entrada
└── index.css         # Estilos globales
```

### Reglas de arquitectura

- Un componente dentro de `features/catalog` **no puede** importar nada de `features/customization`. Si algo se repite entre features, se mueve a `components/ui/` o `shared/`.
- Cada carpeta de feature debe tener un `index.ts` que exporte solo lo necesario hacia afuera.
- Toda la lógica de manipulación de estado vive en el store, nunca en el componente.

---

## Flujo de trabajo con Git

Seguimos **GitFlow simplificado** con tres tipos de ramas:

```
main       ← Producción. Nunca se sube directo aquí.
develop    ← Integración del equipo.
feature/*  ← Tu rama de trabajo. Siempre se crea desde develop.
```

### Ciclo de trabajo normal

```bash
# 1. Asegúrate de partir desde develop actualizado
git checkout develop
git pull origin develop

# 2. Crea tu rama para la tarea
git checkout -b feature/nombre-de-la-tarea

# 3. Trabaja y haz commits con el formato correcto (ver sección de commits)
git add .
git commit -m "feat: add product card component"

# 4. Cuando termines, sube tu rama y abre un Pull Request hacia develop
git push origin feature/nombre-de-la-tarea
```

> Nunca trabajes directamente en `develop` ni en `main`.

---

## Formato de commits (Conventional Commits)

Husky valida automáticamente el formato al hacer `git commit`. Un commit con formato incorrecto será **rechazado**.

| Prefijo     | Cuándo usarlo                            | Ejemplo                                   |
| ----------- | ---------------------------------------- | ----------------------------------------- |
| `feat:`     | Nueva funcionalidad                      | `feat: add ring customizer component`     |
| `fix:`      | Corrección de bug                        | `fix: correct cart total calculation`     |
| `docs:`     | Solo documentación                       | `docs: add TSDoc to useCartStore`         |
| `style:`    | Cambios de estilo visual                 | `style: update navbar gold color`         |
| `refactor:` | Mejora de código sin nueva funcionalidad | `refactor: simplify product filter logic` |
| `chore:`    | Mantenimiento o instalación de librerías | `chore: install lucide-react`             |

### Ejemplos de commits inválidos que Husky rechazará

```bash
git commit -m "avances"         # sin prefijo
git commit -m "fix"             # sin descripción
git commit -m "Feat: algo"      # prefijo con mayúscula
git commit -m "feature: algo"   # prefijo no permitido
```

---

## Estándares de código

### Nomenclatura

| Elemento              | Formato            | Ejemplo            |
| --------------------- | ------------------ | ------------------ |
| Carpetas y archivos   | `kebab-case`       | `product-card.tsx` |
| Componentes React     | `PascalCase`       | `ProductCard.tsx`  |
| Variables y funciones | `camelCase`        | `calculateTotal`   |
| Interfaces            | `PascalCase`       | `IJewelryProduct`  |
| Tipos                 | `PascalCase`       | `UserRole`         |
| Constantes            | `UPPER_SNAKE_CASE` | `MAX_RINGS_LIMIT`  |

### Reglas generales

- **`any` está prohibido** salvo que sea estrictamente necesario y esté documentado con un comentario que explique el porqué.
- **Funciones pequeñas**: si una función supera 30 líneas, debe dividirse.
- **Early return**: valida errores primero y sal de la función rápido. Evita `if/else` anidados.
- **TSDoc obligatorio** en todas las funciones, hooks y servicios públicos.

```typescript
/**
 * Calcula el precio final aplicando impuestos.
 *
 * @param basePrice - Precio neto en COP.
 * @param taxRate - Porcentaje de impuesto (ej: 0.19 para IVA).
 * @returns Precio total redondeado.
 */
export const calculateFinalPrice = (
  basePrice: number,
  taxRate: number,
): number => {
  return Math.round(basePrice * (1 + taxRate));
};
```

---

## Proceso de Pull Request

Ningún código llega a `develop` sin revisión. Al abrir un PR, el revisor debe verificar:

- El código compila sin errores (`npm run build`)
- No hay errores de lint (`npm run lint`)
- Las funciones y hooks públicos tienen TSDoc
- Se respeta la estructura de carpetas
- El nombre de la rama y los commits siguen el estándar

---

## Preguntas frecuentes

**¿Por qué mi commit fue rechazado?**
Husky está validando el formato. Revisa la tabla de prefijos permitidos y asegúrate de que el mensaje tenga la estructura `tipo: descripción en minúscula`.

**¿Cómo agrego una nueva variable de entorno?**
Agrégala en tu `.env` local y también en `.env.example` con el valor vacío para que el resto del equipo sepa que existe.

**¿Puedo usar `console.log` en el código?**
ESLint lo marcará como advertencia. Está permitido durante desarrollo pero debe eliminarse antes de hacer el PR.

**¿Dónde va la lógica de llamadas al backend?**
En `src/features/<nombre-feature>/services/`. Nunca directamente en un componente de React.
