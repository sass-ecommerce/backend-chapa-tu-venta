import { IsEnum, IsIn, IsString, Matches } from 'class-validator';

export enum StorageFolder {
  PRODUCTS = 'products',
  AVATARS = 'avatars',
  STORES = 'stores',
}

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export class PresignedUploadDto {
  @IsEnum(StorageFolder)
  folder: StorageFolder;

  @IsString()
  @Matches(/\.(jpe?g|png|webp)$/i, {
    message: 'fileName must have a valid image extension',
  })
  fileName: string;

  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType: string;
}
