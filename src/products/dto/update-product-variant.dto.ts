import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class UpdateProductVariantDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  sku?: string;

  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  stock?: number;

  @IsObject()
  @IsOptional()
  attributes?: Record<string, any>;
}
