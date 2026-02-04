import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import { BeforeInsert } from 'typeorm';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  ownerEmail: string;

  @IsString()
  @IsOptional()
  plan?: string;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  ruc?: number;

  @BeforeInsert()
  normalizeFields() {
    this.ownerEmail = this.ownerEmail.toLowerCase();
  }
}
