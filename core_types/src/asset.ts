export interface Asset {
  uuid: string;
  key: string;
  name: string;
  contentType: string;
  size: number;
  path: string;
  uploadedAt: string;
  presignedUrl: string;
  directUrl: string;
  thumbnailUrl?: string;
} 