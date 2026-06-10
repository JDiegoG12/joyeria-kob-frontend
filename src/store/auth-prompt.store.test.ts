/**
 * @file auth-prompt.store.test.ts
 * @description Tests del store del modal "inicia sesión para continuar".
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthPromptStore } from './auth-prompt.store';

beforeEach(() => {
  useAuthPromptStore.setState({ isOpen: false });
});

describe('useAuthPromptStore', () => {
  it('open marca el modal como abierto', () => {
    useAuthPromptStore.getState().open();
    expect(useAuthPromptStore.getState().isOpen).toBe(true);
  });

  it('close marca el modal como cerrado', () => {
    useAuthPromptStore.getState().open();
    useAuthPromptStore.getState().close();
    expect(useAuthPromptStore.getState().isOpen).toBe(false);
  });
});
