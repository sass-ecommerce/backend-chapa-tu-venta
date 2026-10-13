import { IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateTenantDto {
  // Opcional pero nullable: `null` quita el logo explícitamente, a diferencia
  // de `undefined` (campo no enviado, se deja sin tocar).
  @ValidateIf((o: UpdateTenantDto) => o.logoKey !== null)
  @IsString()
  @MaxLength(500)
  @IsOptional()
  logoKey?: string | null;
}
