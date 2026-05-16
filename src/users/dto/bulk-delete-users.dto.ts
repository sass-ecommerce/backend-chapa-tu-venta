import { IsArray, IsEmail, ArrayNotEmpty, ArrayMaxSize } from 'class-validator';

export class BulkDeleteUsersDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @IsEmail({}, { each: true })
  emails: string[];
}
