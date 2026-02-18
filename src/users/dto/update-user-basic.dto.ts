import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

/**
 * DTO para actualización de información básica del usuario
 * Solo permite actualizar campos de perfil público: firstName, lastName, imageUrl
 */
export class UpdateUserBasicDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  lastName?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Image URL must be a valid URL' })
  imageUrl?: string;
}
