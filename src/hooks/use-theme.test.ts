/**
 * @file use-theme.test.ts
 * @description Tests del hook que sincroniza el tema del store con la clase
 * `dark` del elemento <html>.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './use-theme';
import { useThemeStore } from '@/store/theme.store';

beforeEach(() => {
  useThemeStore.setState({ theme: 'light' });
  document.documentElement.classList.remove('dark');
});

describe('useTheme', () => {
  it('agrega la clase dark cuando el tema es dark', () => {
    useThemeStore.setState({ theme: 'dark' });
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('quita la clase dark cuando el tema es light', () => {
    document.documentElement.classList.add('dark');
    useThemeStore.setState({ theme: 'light' });
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('reacciona al cambio de tema en el store', () => {
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => {
      useThemeStore.setState({ theme: 'dark' });
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
