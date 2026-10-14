import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ProductAttributeDto } from './create-product.dto';
import { ProductImageRefDto } from './product-image-ref.dto';

export class UpdateProductDto {
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  basePrice?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  attributes?: ProductAttributeDto[];

  // The product's final image list, in order (the first one is the cover).
  // Images left out are removed; omit the field to leave images untouched.
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductImageRefDto)
  images?: ProductImageRefDto[];
}
