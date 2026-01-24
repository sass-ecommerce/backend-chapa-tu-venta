import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class EmailAddressDto {
  @IsString()
  id: string;

  @IsEmail()
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
  id: string;

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
