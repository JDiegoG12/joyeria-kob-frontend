export type SocialPlatform =
  | 'INSTAGRAM'
  | 'TIKTOK'
  | 'FACEBOOK';

export interface SocialContentItem {
  id: number;
  title: string;
  imageUrl: string;
  link: string;
  socialNetwork: SocialPlatform;
  createdAt?: string;
}

export interface CreateSocialContentParams {
  title: string;
  link: string;
  socialNetwork: SocialPlatform;
  image: File;
}

export interface UpdateSocialContentParams {
  title: string;
  link: string;
  socialNetwork: SocialPlatform;
  image?: File;
}