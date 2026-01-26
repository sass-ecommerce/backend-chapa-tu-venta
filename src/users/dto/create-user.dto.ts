import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class VerificationDto {
  @IsOptional()
  @IsNumber()
  attempts?: number | null;

  @IsOptional()
  @IsNumber()
  expire_at?: number | null;

  @IsOptional()
  @IsString()
  object?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  strategy?: string;
}

class LinkedToDto {
  @IsString()
  id: string;

  @IsString()
  type: string;
}

class EmailAddressDto {
  @IsOptional()
  @IsNumber()
  created_at?: number;

  @IsEmail()
  @IsNotEmpty()
  email_address: string;

  @IsString()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkedToDto)
  linked_to?: LinkedToDto[];

  @IsOptional()
  @IsBoolean()
  matches_sso_connection?: boolean;

  @IsOptional()
  @IsString()
  object?: string;

  @IsOptional()
  @IsBoolean()
  reserved?: boolean;

  @IsOptional()
  @IsNumber()
  updated_at?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => VerificationDto)
  verification?: VerificationDto;
}

class ExternalAccountDto {
  @IsOptional()
  @IsString()
  approved_scopes?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsOptional()
  @IsNumber()
  created_at?: number;

  @IsOptional()
  @IsEmail()
  email_address?: string;

  @IsOptional()
  @IsString()
  external_account_id?: string;

  @IsOptional()
  @IsString()
  family_name?: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  given_name?: string;

  @IsOptional()
  @IsString()
  google_id?: string;

  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  identification_id?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  label?: string | null;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  object?: string;

  @IsOptional()
  @IsString()
  picture?: string;

  @IsOptional()
  @IsString()
  provider?: string; // ej: oauth_google

  @IsOptional()
  @IsString()
  provider_user_id?: string; // ID de Google/TikTok

  @IsOptional()
  @IsObject()
  public_metadata?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  updated_at?: number;

  @IsOptional()
  username?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => VerificationDto)
  verification?: VerificationDto;
}

class HTTPRequestDto {
  @IsOptional()
  @IsString()
  client_ip?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;
}

class EventAttributesDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => HTTPRequestDto)
  http_request?: HTTPRequestDto;
}

class ClerkUserDataDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsBoolean()
  backup_code_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  banned?: boolean;

  @IsOptional()
  @IsBoolean()
  bypass_client_trust?: boolean;

  @IsOptional()
  @IsBoolean()
  create_organization_enabled?: boolean;

  @IsOptional()
  @IsNumber()
  create_organizations_limit?: number | null;

  @IsOptional()
  @IsNumber()
  created_at?: number;

  @IsOptional()
  @IsBoolean()
  delete_self_enabled?: boolean;

  @IsArray()
  @ArrayMinSize(1, {
    message: 'email_addresses debe contener al menos un correo',
  })
  @ValidateNested({ each: true })
  @Type(() => EmailAddressDto)
  email_addresses: EmailAddressDto[];

  @IsOptional()
  @IsArray()
  enterprise_accounts?: Record<string, any>[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExternalAccountDto)
  external_accounts?: ExternalAccountDto[];

  @IsOptional()
  external_id?: string | null;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsBoolean()
  has_image?: boolean;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsNumber()
  last_active_at?: number;

  @IsOptional()
  last_name?: string;

  @IsOptional()
  @IsNumber()
  last_sign_in_at?: number | null;

  @IsOptional()
  @IsNumber()
  legal_accepted_at?: number | null;

  @IsOptional()
  locale?: string | null;

  @IsOptional()
  @IsBoolean()
  locked?: boolean;

  @IsOptional()
  @IsNumber()
  lockout_expires_in_seconds?: number | null;

  @IsOptional()
  @IsNumber()
  mfa_disabled_at?: number | null;

  @IsOptional()
  @IsNumber()
  mfa_enabled_at?: number | null;

  @IsOptional()
  @IsString()
  object?: string;

  @IsOptional()
  @IsArray()
  passkeys?: Record<string, any>[];

  @IsOptional()
  @IsBoolean()
  password_enabled?: boolean;

  @IsOptional()
  @IsNumber()
  password_last_updated_at?: number | null;

  @IsOptional()
  @IsArray()
  phone_numbers?: Record<string, any>[];

  @IsString()
  primary_email_address_id: string;

  @IsOptional()
  primary_phone_number_id?: string;

  @IsOptional()
  primary_web3_wallet_id?: string;

  @IsOptional()
  @IsObject()
  private_metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  profile_image_url?: string;

  @IsOptional()
  @IsObject()
  public_metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  requires_password_reset?: boolean;

  @IsOptional()
  @IsArray()
  saml_accounts?: Record<string, any>[];

  @IsOptional()
  @IsBoolean()
  totp_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  two_factor_enabled?: boolean;

  @IsOptional()
  @IsObject()
  unsafe_metadata?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  updated_at?: number;

  @IsOptional()
  username?: string;

  @IsOptional()
  @IsNumber()
  verification_attempts_remaining?: number;

  @IsOptional()
  @IsArray()
  web3_wallets?: Record<string, any>[];
}

export class CreateUserDto {
  @IsObject()
  @ValidateNested()
  @Type(() => ClerkUserDataDto)
  data: ClerkUserDataDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EventAttributesDto)
  event_attributes?: EventAttributesDto;

  @IsString()
  @IsNotEmpty()
  instance_id: string;

  @IsOptional()
  @IsString()
  object?: string;

  @IsOptional()
  @IsNumber()
  timestamp?: number;

  @IsString()
  @IsNotEmpty()
  type: string;
}
