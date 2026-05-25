import type {
  SocialContentItem,
  CreateSocialContentParams,
  UpdateSocialContentParams,
} from '@/features/general/types/social-content.types';

import { apiClient } from '@/api/api-client';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class SocialContentService {
  static async getAll(): Promise<
    SocialContentItem[]
  > {
    const res =
      await apiClient.get<
        ApiEnvelope<SocialContentItem[]>
      >('/social-contents');

    return res.data.data;
  }

  static async create(
    params: CreateSocialContentParams,
  ): Promise<SocialContentItem> {
    const form =
      new FormData();

    form.append(
      'title',
      params.title,
    );

    form.append(
      'link',
      params.link,
    );

    form.append(
      'socialNetwork',
      params.socialNetwork,
    );

    form.append(
      'image',
      params.image,
    );

    const res =
      await apiClient.post<
        ApiEnvelope<SocialContentItem>
      >(
        '/social-contents',
        form,
      );

    return res.data.data;
  }

  static async update(
    id: number,
    params: UpdateSocialContentParams,
  ): Promise<SocialContentItem> {
    const form =
      new FormData();

    form.append(
      'title',
      params.title,
    );

    form.append(
      'link',
      params.link,
    );

    form.append(
      'socialNetwork',
      params.socialNetwork,
    );

    if (params.image) {
      form.append(
        'image',
        params.image,
      );
    }

    const res =
      await apiClient.put<
        ApiEnvelope<SocialContentItem>
      >(
        `/social-contents/${id}`,
        form,
      );

    return res.data.data;
  }

  static async remove(
    id: number,
  ): Promise<void> {
    await apiClient.delete(
      `/social-contents/${id}`,
    );
  }
}