import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class RegisterProductImageDto {
  @IsString()
  @IsNotEmpty()
  s3Key: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;
}
