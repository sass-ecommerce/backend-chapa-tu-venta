import { IsString } from 'class-validator';

export class PresignedDownloadDto {
  @IsString()
  key: string;
}
