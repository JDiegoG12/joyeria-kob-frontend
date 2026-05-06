/**
 * @file general.types.ts
 * @description Tipos compartidos del módulo de configuración general
 * de Joyería KOB.
 *
 * Este módulo agrupa configuraciones globales del sistema que no pertenecen
 * a un módulo funcional específico (joyas, clientes, etc.) pero que afectan
 * el comportamiento de toda la aplicación.
 *
 * ## Configuraciones actuales
 * - Precio del oro por gramo (COP)
 * - Banner hero principal (imagen, título, subtítulo)
 *
 * ## Configuraciones futuras previstas
 * - Información de la tienda (nombre, dirección, horario)
 * - Parámetros de envío y zonas de entrega
 * - Configuración de impuestos
 */

// ─── Precio del oro ───────────────────────────────────────────────────────────

/**
 * Respuesta del backend al consultar el precio actual del oro.
 * Endpoint: `GET /api/system/gold-price`
 */
export interface GoldPriceResponse {
  /** Precio del oro por gramo en COP. */
  goldPricePerGram: number;
  /** Fecha ISO de la última actualización del precio en el sistema. */
  lastUpdate: string;
}

/**
 * Cuerpo de la petición para actualizar el precio del oro.
 * Endpoint: `PUT /api/admin/gold-price`
 */
export interface UpdateGoldPriceRequest {
  /** Nuevo precio del oro por gramo en COP. Debe ser un número positivo. */
  goldPricePerGram: number;
}

/**
 * Respuesta del backend tras actualizar el precio del oro exitosamente.
 */
export interface UpdateGoldPriceResponse {
  /** Indica si la operación fue exitosa. */
  success: boolean;
  /** Datos actualizados del precio del oro. */
  data: GoldPriceResponse;
  /** Mensaje legible de confirmación. */
  message: string;
}

// ─── Banner hero principal ────────────────────────────────────────────────────

/**
 * Datos del banner hero tal como los devuelve el backend.
 * Endpoints: `GET /api/banner` · `PUT /api/banner`
 *
 * `imageUrl` apunta al archivo almacenado en el servidor (Cloudinary, S3, etc.)
 * y puede ser `null` si el registro existe pero sin imagen subida.
 */
export interface BannerResponse {
  /** Identificador único del banner en la base de datos. */
  id: number;
  /** Título principal superpuesto sobre la imagen. */
  title: string;
  /**
   * Subtítulo debajo del título.
   * Nullable — puede no estar configurado.
   */
  subtitle: string | null;
  /**
   * URL pública de la imagen de fondo.
   * `null` si el banner aún no tiene imagen asociada.
   */
  imageUrl: string | null;
  /** Fecha ISO de la última actualización del registro. */
  updatedAt: string;
}

/**
 * Envoltorio de la respuesta al obtener el banner.
 * El backend siempre devuelve `{ success, data, message }`.
 */
export interface GetBannerApiResponse {
  success: boolean;
  data: BannerResponse;
  message: string;
}

/**
 * Envoltorio de la respuesta al crear o actualizar el banner (upsert).
 */
export interface UpdateBannerApiResponse {
  success: boolean;
  data: BannerResponse;
  message: string;
}