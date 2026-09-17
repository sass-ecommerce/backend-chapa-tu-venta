import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateCollectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  // Opcional pero nullable: `null` limpia la portada explícitamente, a
  // diferencia de `undefined` (campo no enviado, se deja sin tocar).
  @ValidateIf((o: UpdateCollectionDto) => o.coverImageKey !== null)
  @IsString()
  @MaxLength(500)
  @IsOptional()
  coverImageKey?: string | null;
}
