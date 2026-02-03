import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  ownerEmail?: string;

  @IsString()
  @IsOptional()
  plan?: string;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  ruc?: number;
}
