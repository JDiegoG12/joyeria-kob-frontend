/**
 * @file toast.store.test.ts
 * @description Tests del store de notificaciones: límite FIFO de 3 toasts y
 * eliminación por id.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useToastStore } from './toast.store';

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

describe('showToast', () => {
  it('encola un toast con type, message y duration por defecto', () => {
    useToastStore.getState().showToast('success', 'Hecho');

    const [toast] = useToastStore.getState().toasts;
    expect(toast.type).toBe('success');
    expect(toast.message).toBe('Hecho');
    expect(toast.duration).toBe(3500);
    expect(toast.id).toBeTruthy();
  });

  it('mantiene como máximo 3 toasts (FIFO, descarta el más antiguo)', () => {
    const { showToast } = useToastStore.getState();
    showToast('info', '1');
    showToast('info', '2');
    showToast('info', '3');
    showToast('info', '4');

    const messages = useToastStore.getState().toasts.map((t) => t.message);
    expect(messages).toEqual(['2', '3', '4']);
  });

  it('respeta una duration personalizada', () => {
    useToastStore.getState().showToast('warning', 'persistente', 0);
    expect(useToastStore.getState().toasts[0].duration).toBe(0);
  });
});

describe('removeToast', () => {
  it('elimina el toast con el id indicado', () => {
    useToastStore.getState().showToast('info', 'uno');
    const id = useToastStore.getState().toasts[0].id;

    useToastStore.getState().removeToast(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
