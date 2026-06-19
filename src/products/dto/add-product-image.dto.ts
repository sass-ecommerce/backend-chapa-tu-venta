import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class AddProductImageDto {
  @IsUUID()
  productId: string;

  @IsUUID()
  tenantId: string;

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
