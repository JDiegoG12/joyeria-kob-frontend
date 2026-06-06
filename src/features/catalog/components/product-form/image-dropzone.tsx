/**
 * @file image-dropzone.tsx
 * @description Zona de carga de imágenes con drag & drop REAL, compartida por
 * los formularios de creación y edición de joyas.
 *
 * ## Por qué existe
 * Antes la "zona de arrastre" era solo un `<label>` con un input oculto: el clic
 * funcionaba, pero NO había handlers de drag/drop, así que soltar un archivo
 * hacía que el navegador lo abriera en la pestaña. Aquí se implementan
 * `onDragEnter/Over/Leave/Drop` con `preventDefault`, además de un estado visual
 * "soltando aquí".
 *
 * ## Responsabilidad
 * Solo captura archivos (clic o drop) y los emite SIN validar mediante `onFiles`.
 * La validación (tipo, tamaño, cupo) y los mensajes viven en el formulario, que
 * conoce el contexto (cupos distintos en crear vs editar). El input se limpia
 * tras cada emisión para permitir reseleccionar el mismo archivo.
 */

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

interface ImageDropzoneProps {
  /** `id` del contenedor (destino del scroll-a-error de imágenes). */
  id?: string;
  /** Imágenes que aún se pueden agregar (para el texto guía). */
  remaining: number;
  /** Recibe los archivos elegidos por clic o drop, sin validar. */
  onFiles: (files: File[]) => void;
}

/**
 * Área punteada que acepta clic y arrastrar-soltar para cargar imágenes.
 */
export const ImageDropzone = ({ id, remaining, onFiles }: ImageDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  /** Emite los archivos al padre y limpia el input para reusos. */
  const emit = (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    if (files.length > 0) onFiles(files);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <label
      id={id}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
      }}
      onDragOver={(e) => {
        // preventDefault en dragover es OBLIGATORIO para que el navegador
        // permita el drop (de lo contrario lo rechaza y abre el archivo).
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        emit(e.dataTransfer.files);
      }}
      className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
        dragActive
          ? 'border-[var(--accent)] bg-[var(--bg-tertiary)]'
          : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-tertiary)]'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => emit(e.target.files)}
        className="hidden"
      />

      {/*
       * Contenido con `pointer-events-none`: así los eventos de drag siempre los
       * recibe el `<label>` y no sus hijos, evitando parpadeos del estado
       * `dragActive` al pasar el cursor sobre el ícono o el texto.
       */}
      <span className="pointer-events-none flex flex-col items-center">
        <Upload
          size={28}
          aria-hidden="true"
          className={`mb-3 transition-transform duration-200 motion-reduce:transition-none ${
            dragActive ? 'scale-110' : 'group-hover:scale-110'
          }`}
          style={{ color: dragActive ? 'var(--accent)' : 'var(--text-muted)' }}
        />
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {dragActive
            ? 'Suelta las imágenes aquí'
            : 'Haz clic o arrastra imágenes aquí'}
        </span>
        <span className="mt-1 text-xs text-[var(--text-muted)]">
          Puedes agregar {remaining} imagen(es) más
        </span>
      </span>
    </label>
  );
};
