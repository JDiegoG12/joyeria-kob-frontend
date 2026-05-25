import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react';

import {
  AlertCircle,
  ChevronUp,
  ExternalLink,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Video,
  X,
} from 'lucide-react';

import { SERVER_URL } from '@/api/server-url';
import { ConfirmModal } from '@/components/ui/modal/confirm-modal';
import { SocialContentService } from '@/features/general/services/social-content.service';

import type {
  SocialContentItem,
  SocialPlatform,
} from '@/features/general/types/social-content.types';
import { useToastStore } from '@/store/toast.store';

const PLATFORMS: {
  value: SocialPlatform;
  label: string;
}[] = [
  {
    value: 'INSTAGRAM',
    label: 'Instagram',
  },
  {
    value: 'TIKTOK',
    label: 'TikTok',
  },
  {
    value: 'FACEBOOK',
    label: 'Facebook',
  },
];

const MAX_ITEMS = 10;

const ACCEPTED_IMAGE_TYPES =
  'image/png,image/jpeg,image/webp';

const resolveImageUrl = (
  url?: string,
): string => {
  if (!url) {
    return '';
  }

  if (url.startsWith('http')) {
    return url;
  }

  return `${SERVER_URL}${url}`;
};

const isValidUrl = (
  value: string,
): boolean => {
  try {
    const parsed = new URL(value);

    return (
      parsed.protocol === 'http:' ||
      parsed.protocol === 'https:'
    );
  } catch {
    return false;
  }
};

interface FormState {
  title: string;
  link: string;
  socialNetwork: SocialPlatform;
  image: File | null;
  preview: string | null;
}

interface FormErrors {
  title?: string;
  link?: string;
  image?: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  link: '',
  socialNetwork: 'INSTAGRAM',
  image: null,
  preview: null,
};

export const SocialContentCard = () => {
  const { showToast } =
    useToastStore();

  const [items, setItems] =
    useState<SocialContentItem[]>(
      [],
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    panelMode,
    setPanelMode,
  ] = useState<
    null | 'create' | number
  >(null);

  const [form, setForm] =
    useState<FormState>(
      EMPTY_FORM,
    );

  const [errors, setErrors] =
    useState<FormErrors>(
      {},
    );

  const [isSaving, setIsSaving] =
    useState(false);

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<SocialContentItem | null>(
      null,
    );

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const isPanelOpen =
    panelMode !== null;

  const isAtLimit =
    items.length >= MAX_ITEMS;

  const editingItem =
    typeof panelMode ===
    'number'
      ? items.find(
          (
            item,
          ) =>
            item.id === panelMode,
        ) ?? null
      : null;

  useEffect(() => {
    void loadItems();

    return () => {
      if (form.preview) {
        URL.revokeObjectURL(
          form.preview,
        );
      }
    };
  }, []);

  const loadItems =
    async (): Promise<void> => {
      setIsLoading(true);

      try {
        const data =
          await SocialContentService.getAll();

        setItems(data);
      } catch {
        showToast(
          'error',
          'No se pudieron cargar los videos.',
        );
      } finally {
        setIsLoading(false);
      }
    };

  const resetFileInput =
    (): void => {
      if (fileInputRef.current) {
        fileInputRef.current.value =
          '';
      }
    };

  const clearPreview =
    (): void => {
      if (form.preview) {
        URL.revokeObjectURL(
          form.preview,
        );
      }
    };

  const closePanel =
    (): void => {
      clearPreview();

      setForm(EMPTY_FORM);
      setErrors({});
      setPanelMode(null);

      resetFileInput();
    };

  const openCreatePanel =
    (): void => {
      clearPreview();

      setForm(EMPTY_FORM);
      setErrors({});
      setPanelMode('create');
    };

  const openEditPanel = (
    item: SocialContentItem,
  ): void => {
    clearPreview();

    setForm({
      title: item.title,
      link: item.link,
      socialNetwork:
        item.socialNetwork,
      image: null,
      preview: null,
    });

    setErrors({});
    setPanelMode(item.id);
  };

  const handleFieldChange = <
    K extends keyof Pick<
      FormState,
      | 'title'
      | 'link'
      | 'socialNetwork'
    >,
  >(
    field: K,
    value: FormState[K],
  ): void => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const handleImageChange = (
    e: ChangeEvent<HTMLInputElement>,
  ): void => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    clearPreview();

    const preview =
      URL.createObjectURL(
        file,
      );

    setForm((prev) => ({
      ...prev,
      image: file,
      preview,
    }));

    setErrors((prev) => ({
      ...prev,
      image: undefined,
    }));
  };

  const removeSelectedImage =
    (): void => {
      clearPreview();

      setForm((prev) => ({
        ...prev,
        image: null,
        preview: null,
      }));

      resetFileInput();
    };

  const validate =
    (): boolean => {
      const nextErrors: FormErrors =
        {};

      if (!form.title.trim()) {
        nextErrors.title =
          'El título es obligatorio.';
      }

      if (!form.link.trim()) {
        nextErrors.link =
          'El link es obligatorio.';
      } else if (
        !isValidUrl(form.link)
      ) {
        nextErrors.link =
          'Debe ingresar una URL válida.';
      }

      if (
        panelMode ===
          'create' &&
        !form.image
      ) {
        nextErrors.image =
          'La imagen es obligatoria.';
      }

      setErrors(nextErrors);

      return (
        Object.keys(
          nextErrors,
        ).length === 0
      );
    };

  const handleSubmit =
    async (
      e: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
      e.preventDefault();

      if (!validate()) {
        showToast(
          'error',
          'Todos los campos requeridos deben estar completos.',
        );

        return;
      }

      setIsSaving(true);

      try {
        if (
          panelMode === 'create'
        ) {
          const created =
            await SocialContentService.create(
              {
                title:
                  form.title.trim(),
                link:
                  form.link.trim(),
                socialNetwork:
                  form.socialNetwork,
                image:
                  form.image as File,
              },
            );

          setItems((prev) => [
            ...prev,
            created,
          ]);

          showToast(
            'success',
            'Video creado correctamente.',
          );
        } else {
          const updated =
            await SocialContentService.update(
              Number(panelMode),
              {
                title:
                  form.title.trim(),
                link:
                  form.link.trim(),
                socialNetwork:
                  form.socialNetwork,
                ...(form.image
                  ? {
                      image:
                        form.image,
                    }
                  : {}),
              },
            );

          setItems((prev) =>
            prev.map((item) =>
              item.id === updated.id
                ? updated
                : item,
            ),
          );

          showToast(
            'success',
            'Video actualizado correctamente.',
          );
        }

        closePanel();
      } catch {
        showToast(
          'error',
          'No se pudo guardar el video.',
        );
      } finally {
        setIsSaving(false);
      }
    };

  const handleDelete =
    async (): Promise<void> => {
      if (!deleteTarget) {
        return;
      }

      setIsDeleting(true);

      try {
        await SocialContentService.remove(
          deleteTarget.id,
        );

        setItems((prev) =>
          prev.filter(
            (item) =>
              item.id !==
              deleteTarget.id,
          ),
        );

        showToast(
          'success',
          'Video eliminado correctamente.',
        );
      } catch {
        showToast(
          'error',
          'No se pudo eliminar el video.',
        );
      } finally {
        setDeleteTarget(null);
        setIsDeleting(false);
      }
    };

  return (
    <>
      <div
        className="rounded-xl border"
        style={{
          backgroundColor:
            'var(--bg-secondary)',
          borderColor:
            'var(--border-color)',
        }}
      >
        <div className="flex items-center gap-3 p-4 sm:p-6">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{
              backgroundColor:
                'var(--accent-subtle)',
              color:
                'var(--accent)',
            }}
          >
            <Video size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className="text-base"
              style={{
                fontFamily:
                  'var(--font-heading)',
                color:
                  'var(--text-primary)',
                fontWeight:
                  'var(--font-semibold)',
              }}
            >
              Videos publicitarios
            </h3>

            <p
              className="mt-1 text-sm"
              style={{
                fontFamily:
                  'var(--font-ui)',
                color:
                  'var(--text-muted)',
              }}
            >
              {items.length} de{' '}
              {MAX_ITEMS}{' '}
              configurados
            </p>
          </div>

          {!isPanelOpen ? (
            <button
              type="button"
              disabled={isAtLimit}
              onClick={
                openCreatePanel
              }
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor:
                  'var(--accent)',
                color:
                  'var(--accent-text)',
                fontFamily:
                  'var(--font-ui)',
                fontWeight:
                  'var(--font-semibold)',
              }}
            >
              <Plus size={14} />
              Nuevo video
            </button>
          ) : (
            <button
              type="button"
              onClick={closePanel}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-opacity hover:opacity-85"
              style={{
                borderColor:
                  'var(--border-color)',
                color:
                  'var(--text-primary)',
              }}
            >
              <ChevronUp size={14} />
              Cerrar
            </button>
          )}
        </div>

        {isPanelOpen && (
          <>
            <Divider />

            <form
              onSubmit={(e) =>
                void handleSubmit(e)
              }
              className="p-4 sm:p-6"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormLabel required>
                    Título
                  </FormLabel>

                  <input
                    type="text"
                    value={
                      form.title
                    }
                    disabled={
                      isSaving
                    }
                    onChange={(
                      e,
                    ) =>
                      handleFieldChange(
                        'title',
                        e.target
                          .value,
                      )
                    }
                    placeholder="Ej: Nueva colección"
                    className="mt-1.5 w-full px-3 py-2.5"
                    style={inputStyle(
                      !!errors.title,
                    )}
                  />

                  {errors.title && (
                    <FieldError>
                      {
                        errors.title
                      }
                    </FieldError>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <FormLabel required>
                    Link
                  </FormLabel>

                  <input
                    type="url"
                    value={
                      form.link
                    }
                    disabled={
                      isSaving
                    }
                    onChange={(
                      e,
                    ) =>
                      handleFieldChange(
                        'link',
                        e.target
                          .value,
                      )
                    }
                    placeholder="https://..."
                    className="mt-1.5 w-full px-3 py-2.5"
                    style={inputStyle(
                      !!errors.link,
                    )}
                  />

                  {errors.link && (
                    <FieldError>
                      {
                        errors.link
                      }
                    </FieldError>
                  )}
                </div>

                <div>
                  <FormLabel required>
                    Red social
                  </FormLabel>

                  <select
                    value={
                      form.socialNetwork
                    }
                    disabled={
                      isSaving
                    }
                    onChange={(
                      e,
                    ) =>
                      handleFieldChange(
                        'socialNetwork',
                        e.target
                          .value as SocialPlatform,
                      )
                    }
                    className="mt-1.5 w-full px-3 py-2.5"
                    style={inputStyle(
                      false,
                    )}
                  >
                    {PLATFORMS.map(
                      (
                        platform,
                      ) => (
                        <option
                          key={
                            platform.value
                          }
                          value={
                            platform.value
                          }
                        >
                          {
                            platform.label
                          }
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <FormLabel
                    required={
                      panelMode ===
                      'create'
                    }
                  >
                    Imagen
                  </FormLabel>

                  {(form.preview ||
                    editingItem?.imageUrl) && (
                    <div
                      className="mt-2 overflow-hidden rounded-lg border"
                      style={{
                        borderColor:
                          'var(--border-color)',
                        aspectRatio:
                          '16 / 9',
                      }}
                    >
                      <img
                        src={
                          form.preview ??
                          resolveImageUrl(
                            editingItem?.imageUrl,
                          )
                        }
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={
                        isSaving
                      }
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-opacity hover:opacity-85"
                      style={{
                        backgroundColor:
                          'var(--accent)',
                        color:
                          'var(--accent-text)',
                      }}
                    >
                      <ImageIcon size={14} />
                      Subir imagen
                    </button>

                    {form.image && (
                      <button
                        type="button"
                        disabled={
                          isSaving
                        }
                        onClick={
                          removeSelectedImage
                        }
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                        style={{
                          borderColor:
                            'var(--border-color)',
                        }}
                      >
                        <X size={14} />
                        Quitar
                      </button>
                    )}
                  </div>

                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    accept={
                      ACCEPTED_IMAGE_TYPES
                    }
                    className="sr-only"
                    onChange={
                      handleImageChange
                    }
                  />

                  {errors.image && (
                    <FieldError>
                      {
                        errors.image
                      }
                    </FieldError>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    closePanel
                  }
                  className="rounded-lg border px-4 py-2 text-sm"
                  style={{
                    borderColor:
                      'var(--border-color)',
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    isSaving
                  }
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-opacity hover:opacity-85 disabled:opacity-50"
                  style={{
                    backgroundColor:
                      'var(--accent)',
                    color:
                      'var(--accent-text)',
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={14} />

                      {panelMode ===
                      'create'
                        ? 'Crear video'
                        : 'Guardar cambios'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        <Divider />

        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="py-8 text-center text-sm">
              Cargando videos...
            </div>
          ) : items.length ===
            0 ? (
            <EmptyState
              onAdd={
                openCreatePanel
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr
                    style={{
                      borderBottom:
                        '1px solid var(--border-color)',
                    }}
                  >
                    {[
                      'Miniatura',
                      'Título',
                      'Red social',
                      'Link',
                      'Acciones',
                    ].map(
                      (
                        column,
                      ) => (
                        <th
                          key={
                            column
                          }
                          className="pb-3 text-left text-xs uppercase"
                          style={{
                            color:
                              'var(--text-muted)',
                            fontFamily:
                              'var(--font-ui)',
                          }}
                        >
                          {
                            column
                          }
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody>
                  {items.map(
                    (
                      item,
                    ) => (
                      <VideoRow
                        key={
                          item.id
                        }
                        item={
                          item
                        }
                        isEditing={
                          panelMode ===
                          item.id
                        }
                        onEdit={() =>
                          openEditPanel(
                            item,
                          )
                        }
                        onDelete={() =>
                          setDeleteTarget(
                            item,
                          )
                        }
                      />
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={
          !!deleteTarget
        }
        variant="danger"
        title="Eliminar video"
        message={`¿Estás seguro de eliminar "${deleteTarget?.title ?? ''}"?`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        isLoading={
          isDeleting
        }
        onCancel={() =>
          setDeleteTarget(
            null,
          )
        }
        onConfirm={() =>
          void handleDelete()
        }
      />
    </>
  );
};

interface VideoRowProps {
  item: SocialContentItem;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const VideoRow = ({
  item,
  isEditing,
  onEdit,
  onDelete,
}: VideoRowProps) => {
  return (
    <tr
      style={{
        borderBottom:
          '1px solid var(--border-color)',
        backgroundColor:
          isEditing
            ? 'var(--bg-hover)'
            : 'transparent',
      }}
    >
      <td className="py-3">
        <div
          className="overflow-hidden rounded-lg border"
          style={{
            width: 70,
            height: 42,
            borderColor:
              'var(--border-color)',
          }}
        >
          <img
            src={resolveImageUrl(
              item.imageUrl,
            )}
            alt={
              item.title
            }
            className="h-full w-full object-cover"
          />
        </div>
      </td>

      <td className="py-3 text-sm">
        {item.title}
      </td>

      <td className="py-3 text-sm">
        {
          item.socialNetwork
        }
      </td>

      <td className="py-3">
        <a
          href={item.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex max-w-[180px] items-center gap-1 truncate text-sm hover:opacity-80"
          style={{
            color:
              'var(--text-accent)',
          }}
        >
          <span className="truncate">
            {item.link}
          </span>

          <ExternalLink
            size={12}
          />
        </a>
      </td>

      <td className="py-3">
        <div className="flex items-center gap-2">
          <IconButton
            onClick={
              onEdit
            }
          >
            <Pencil size={14} />
          </IconButton>

          <IconButton
            onClick={
              onDelete
            }
            danger
          >
            <Trash2 size={14} />
          </IconButton>
        </div>
      </td>
    </tr>
  );
};

interface IconButtonProps {
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
}

const IconButton = ({
  children,
  onClick,
  danger = false,
}: IconButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center rounded-lg border p-2 transition-opacity hover:opacity-80"
      style={{
        borderColor:
          'var(--border-color)',
        color: danger
          ? 'var(--color-error, #dc2626)'
          : 'var(--text-primary)',
      }}
    >
      {children}
    </button>
  );
};

interface EmptyStateProps {
  onAdd: () => void;
}

const EmptyState = ({
  onAdd,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          backgroundColor:
            'var(--bg-tertiary)',
        }}
      >
        <Video size={22} />
      </div>

      <p
        className="text-sm"
        style={{
          color:
            'var(--text-muted)',
        }}
      >
        No hay videos configurados.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-opacity hover:opacity-85"
        style={{
          backgroundColor:
            'var(--accent)',
          color:
            'var(--accent-text)',
        }}
      >
        <Plus size={14} />
        Agregar video
      </button>
    </div>
  );
};

interface FormLabelProps {
  children: ReactNode;
  required?: boolean;
}

const FormLabel = ({
  children,
  required = false,
}: FormLabelProps) => {
  return (
    <label
      className="block text-sm"
      style={{
        fontFamily:
          'var(--font-ui)',
        color:
          'var(--text-primary)',
        fontWeight:
          'var(--font-medium)',
      }}
    >
      {children}

      {required && (
        <span
          style={{
            color:
              'var(--color-error, #dc2626)',
            marginLeft: 4,
          }}
        >
          *
        </span>
      )}
    </label>
  );
};

interface FieldErrorProps {
  children: ReactNode;
}

const FieldError = ({
  children,
}: FieldErrorProps) => {
  return (
    <p
      className="mt-1 flex items-center gap-1 text-xs"
      style={{
        color:
          'var(--color-error, #dc2626)',
      }}
    >
      <AlertCircle size={12} />
      {children}
    </p>
  );
};

const Divider = () => {
  return (
    <div
      className="h-px"
      style={{
        backgroundColor:
          'var(--border-color)',
      }}
    />
  );
};

const inputStyle = (
  hasError: boolean,
): CSSProperties => ({
  border: hasError
    ? '1px solid var(--color-error, #dc2626)'
    : '1px solid var(--border-color)',
  borderRadius:
    'var(--radius-sm)',
  backgroundColor:
    'var(--bg-primary)',
  color:
    'var(--text-primary)',
  fontFamily:
    'var(--font-ui)',
  outline: 'none',
});