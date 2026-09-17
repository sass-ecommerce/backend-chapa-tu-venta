import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AddProductsToCollectionDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  productIds: string[];
}
