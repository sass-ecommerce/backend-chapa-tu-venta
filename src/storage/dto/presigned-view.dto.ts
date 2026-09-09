import { IsString } from 'class-validator';

export class PresignedViewDto {
  @IsString()
  key: string;
}
