import { IsEnum, IsIn, IsOptional, IsString, Matches } from 'class-validator';

export enum StorageFolder {
  PRODUCTS = 'products',
  VARIANTS = 'variants',
  AVATARS = 'avatars',
  STORES = 'stores',
}

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export class PresignedUploadDto {
  @IsEnum(StorageFolder)
  folder: StorageFolder;

  @IsString()
  @Matches(/\.(jpe?g|png|webp|heic|heif)$/i, {
    message: 'fileName must have a valid image extension',
  })
  fileName: string;

  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType: string;

  @IsOptional()
  @IsString()
  primaryIdentifier?: string;

  @IsOptional()
  @IsString()
  secondaryIdentifier?: string;
}
