import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class EmailAddressDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsEmail()
  @IsNotEmpty()
  email_address: string;
}

class ExternalAccountDto {
  @IsString()
  @IsOptional()
  provider: string; // ej: oauth_google

  @IsString()
  @IsOptional()
  provider_user_id: string; // ID de Google/TikTok
}

class ClerkUserDataDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  // Todos los demás campos de Clerk sin validación específica
  backup_code_enabled?: boolean;
  banned?: boolean;
  create_organization_enabled?: boolean;
  create_organizations_limit?: number | null;
  created_at?: number;
  delete_self_enabled?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAddressDto)
  email_addresses: EmailAddressDto[];

  @IsString()
  primary_email_address_id: string;

  @IsString()
  @IsOptional()
  first_name: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ExternalAccountDto)
  external_accounts?: ExternalAccountDto[];
}

export class CreateUserDto {
  @IsObject()
  @ValidateNested()
  @Type(() => ClerkUserDataDto)
  data: ClerkUserDataDto;

  @IsString()
  instance_id: string;

  @IsString()
  type: string;
}
