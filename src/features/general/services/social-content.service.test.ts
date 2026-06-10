/**
 * @file social-content.service.test.ts
 * @description Tests del servicio de contenido social: armado del FormData en
 * create/update y unwrap del envelope.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/api/api-client';
import { SocialContentService } from './social-content.service';

vi.mock('@/api/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPost = vi.mocked(apiClient.post);
const mockedPut = vi.mocked(apiClient.put);
const mockedDelete = vi.mocked(apiClient.delete);
const image = new File(['x'], 'post.png', { type: 'image/png' });

const params = {
  title: 'Post',
  link: 'https://instagram.com/p/1',
  socialNetwork: 'INSTAGRAM',
  image,
} as never;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getAll', () => {
  it('consume /social-contents y desempaqueta data', async () => {
    mockedGet.mockResolvedValue({ data: { success: true, data: [{ id: 1 }] } });
    await expect(SocialContentService.getAll()).resolves.toEqual([{ id: 1 }]);
    expect(mockedGet).toHaveBeenCalledWith('/social-contents');
  });
});

describe('create', () => {
  it('adjunta title, link, socialNetwork e image al FormData', async () => {
    mockedPost.mockResolvedValue({ data: { success: true, data: { id: 1 } } });
    await SocialContentService.create(params);

    const fd = mockedPost.mock.calls[0][1] as FormData;
    expect(fd.get('title')).toBe('Post');
    expect(fd.get('link')).toBe('https://instagram.com/p/1');
    expect(fd.get('socialNetwork')).toBe('INSTAGRAM');
    expect(fd.get('image')).toBe(image);
  });
});

describe('update', () => {
  it('no adjunta image cuando no se provee', async () => {
    mockedPut.mockResolvedValue({ data: { success: true, data: { id: 1 } } });
    await SocialContentService.update(7, {
      title: 'Editado',
      link: 'l',
      socialNetwork: 'TIKTOK',
    } as never);

    const [url, body] = mockedPut.mock.calls[0];
    expect(url).toBe('/social-contents/7');
    expect((body as FormData).has('image')).toBe(false);
  });
});

describe('remove', () => {
  it('consume DELETE /social-contents/:id', async () => {
    mockedDelete.mockResolvedValue({ data: { success: true } });
    await SocialContentService.remove(3);
    expect(mockedDelete).toHaveBeenCalledWith('/social-contents/3');
  });
});
