import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class RemoveProductsFromCollectionDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  productIds: string[];
}
