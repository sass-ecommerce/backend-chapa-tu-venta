import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  storeId?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  stockQuantity?: number;

  @IsOptional()
  @IsNumber()
  priceList?: number;

  @IsOptional()
  @IsNumber()
  priceBase?: number;

  @IsOptional()
  @IsString()
  imageUri?: string;

  @IsOptional()
  @IsBoolean()
  trending?: boolean;

  @IsOptional()
  @IsNumber()
  rating?: number;
}
