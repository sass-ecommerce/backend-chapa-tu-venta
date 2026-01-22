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
  first_name: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}

export class CreateUserDto {
  @IsObject()
  @ValidateNested()
  @Type(() => ClerkUserDataDto)
  data: ClerkUserDataDto;

  @IsString()
  type: string; // Ejemplo: "user.created"
}
