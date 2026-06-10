/**
 * @file theme.store.test.ts
 * @description Tests del store de tema: toggle entre light/dark y set directo.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from './theme.store';

beforeEach(() => {
  useThemeStore.setState({ theme: 'light' });
});

describe('useThemeStore', () => {
  it('toggleTheme alterna entre light y dark', () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('setTheme fija un tema concreto', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
  });
});
