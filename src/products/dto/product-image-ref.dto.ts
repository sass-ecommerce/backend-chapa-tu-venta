import { IsNotEmpty, IsString, IsUUID, ValidateIf } from 'class-validator';

// One entry of a product's final image list: an image it already has (`id`)
// or a file just uploaded to S3 (`s3Key`). Exactly one of the two.
export class ProductImageRefDto {
  @ValidateIf((ref: ProductImageRefDto) => ref.s3Key === undefined)
  @IsUUID()
  id?: string;

  @ValidateIf((ref: ProductImageRefDto) => ref.id === undefined)
  @IsString()
  @IsNotEmpty()
  s3Key?: string;
}
