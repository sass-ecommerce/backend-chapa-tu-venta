import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateVariantDto } from './create-variant.dto';

export class CreateProductVariantsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants: CreateVariantDto[];
}
