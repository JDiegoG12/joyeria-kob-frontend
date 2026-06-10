/**
 * @file use-page-views.test.tsx
 * @description Tests del hook que registra page_views en GA4 en cada navegación.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { usePageViews } from './use-page-views';
import { trackPageView } from '@/analytics/google-analytics';

vi.mock('@/analytics/google-analytics', () => ({
  trackPageView: vi.fn(),
}));

const mockedTrack = vi.mocked(trackPageView);

/** Wrapper que provee el contexto del router con una ruta inicial. */
const wrapperFor = (initialEntry: string) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>;
  };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usePageViews', () => {
  it('registra la vista inicial con pathname + search', () => {
    renderHook(() => usePageViews(), {
      wrapper: wrapperFor('/catalogo?categoria=anillos'),
    });

    expect(mockedTrack).toHaveBeenCalledWith('/catalogo?categoria=anillos');
  });

  it('registra la ruta sin query cuando no hay search', () => {
    renderHook(() => usePageViews(), { wrapper: wrapperFor('/favoritos') });
    expect(mockedTrack).toHaveBeenCalledWith('/favoritos');
  });
});
