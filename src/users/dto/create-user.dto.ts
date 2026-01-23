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
  email_addresses?: EmailAddressDto[];
  enterprise_accounts?: any[];
  external_accounts?: any[];
  external_id?: string | null;
  first_name?: string;
  has_image?: boolean;
  image_url?: string;
  last_active_at?: number;
  last_name?: string;
  last_sign_in_at?: number;
  legal_accepted_at?: number;
  locked?: boolean;
  lockout_expires_in_seconds?: number | null;
  mfa_disabled_at?: number | null;
  mfa_enabled_at?: number | null;
  object?: string;
  passkeys?: any[];
  password_enabled?: boolean;
  phone_numbers?: any[];
  primary_email_address_id?: string | null;
  primary_phone_number_id?: string | null;
  primary_web3_wallet_id?: string | null;
  private_metadata?: any;
  profile_image_url?: string;
  public_metadata?: Record<string, any>;
  saml_accounts?: any[];
  totp_enabled?: boolean;
  two_factor_enabled?: boolean;
  unsafe_metadata?: Record<string, any>;
  updated_at?: number;
  username?: string | null;
  verification_attempts_remaining?: number | null;
  web3_wallets?: any[];
}

export class CreateUserDto {
  @IsObject()
  @ValidateNested()
  @Type(() => ClerkUserDataDto)
  data: ClerkUserDataDto;

  @IsString()
  @IsNotEmpty()
  type: string; // Ejemplo: "user.created"

  // Campos adicionales del webhook sin validación específica
  event_attributes?: {
    http_request?: {
      client_ip?: string;
      user_agent?: string;
    };
  };
  instance_id?: string;
  object?: string;
  timestamp?: number;
}
