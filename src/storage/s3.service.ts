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

  async generateUploadUrl(
    folder: string,
    userSub: string,
    fileName: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    const ext = extname(fileName);
    const key = `${folder}/${userSub}/${randomUUID()}${ext}`;

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
