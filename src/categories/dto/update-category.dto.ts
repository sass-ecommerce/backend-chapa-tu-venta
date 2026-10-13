import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

// Categories can only be renamed: moving one to another parent is not
// supported, so parentId is intentionally absent.
export class UpdateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'slug must be lowercase alphanumeric with hyphens (e.g. ropa-deportiva)',
  })
  @IsOptional()
  slug?: string;
}
