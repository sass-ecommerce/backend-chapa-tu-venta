import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { PresignedUrlGenerationException } from './exceptions/storage.exceptions';
import { StorageFolder } from './dto/presigned-upload.dto';

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly uploadExpiresIn: number;
  private readonly downloadExpiresIn: number;

  constructor(private readonly configService: ConfigService) {
    this.client = new S3Client({
      region: configService.get<string>('aws.region'),
    });
    this.bucket = configService.getOrThrow<string>('s3.bucketName');
    this.uploadExpiresIn = configService.get<number>(
      's3.uploadUrlExpiresIn',
      900,
    );
    this.downloadExpiresIn = configService.get<number>(
      's3.downloadUrlExpiresIn',
      3600,
    );
  }

  private buildProductsKey(
    tenantId: string,
    primaryIdentifier: string,
    uuid: string,
    ext: string,
  ): string {
    return `${tenantId}/${StorageFolder.PRODUCTS}/${primaryIdentifier}/${uuid}${ext}`;
  }

  private buildVariantsKey(
    tenantId: string,
    primaryIdentifier: string,
    secondaryIdentifier: string,
    uuid: string,
    ext: string,
  ): string {
    return `${tenantId}/${StorageFolder.PRODUCTS}/${primaryIdentifier}/${StorageFolder.VARIANTS}/${secondaryIdentifier}/${uuid}${ext}`;
  }

  private buildAvatarsKey(
    tenantId: string,
    userSub: string,
    uuid: string,
    ext: string,
  ): string {
    return `${tenantId}/${StorageFolder.AVATARS}/${userSub}/${uuid}${ext}`;
  }

  private buildStoresKey(
    tenantId: string,
    primaryIdentifier: string,
    uuid: string,
    ext: string,
  ): string {
    return `${tenantId}/${StorageFolder.STORES}/${primaryIdentifier}/${uuid}${ext}`;
  }

  private buildKey(
    folder: StorageFolder,
    tenantId: string,
    userSub: string,
    primaryIdentifier: string | undefined,
    secondaryIdentifier: string | undefined,
    uuid: string,
    ext: string,
  ): string {
    switch (folder) {
      case StorageFolder.PRODUCTS:
        return this.buildProductsKey(
          tenantId,
          primaryIdentifier ?? userSub,
          uuid,
          ext,
        );
      case StorageFolder.VARIANTS:
        return this.buildVariantsKey(
          tenantId,
          primaryIdentifier ?? userSub,
          secondaryIdentifier ?? uuid,
          uuid,
          ext,
        );
      case StorageFolder.AVATARS:
        return this.buildAvatarsKey(tenantId, userSub, uuid, ext);
      case StorageFolder.STORES:
        return this.buildStoresKey(
          tenantId,
          primaryIdentifier ?? userSub,
          uuid,
          ext,
        );
    }
  }

  async generateUploadUrl(
    folder: StorageFolder,
    userSub: string,
    tenantId: string,
    fileName: string,
    contentType: string,
    primaryIdentifier?: string,
    secondaryIdentifier?: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    const ext = extname(fileName);
    const uuid = randomUUID();
    const key = this.buildKey(
      folder,
      tenantId,
      userSub,
      primaryIdentifier,
      secondaryIdentifier,
      uuid,
      ext,
    );

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(this.client, command, {
        expiresIn: this.uploadExpiresIn,
      });

      return { uploadUrl, key };
    } catch {
      throw new PresignedUrlGenerationException();
    }
  }

  async generateDownloadUrl(key: string): Promise<{ downloadUrl: string }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const downloadUrl = await getSignedUrl(this.client, command, {
        expiresIn: this.downloadExpiresIn,
      });

      return { downloadUrl };
    } catch {
      throw new PresignedUrlGenerationException();
    }
  }
}
