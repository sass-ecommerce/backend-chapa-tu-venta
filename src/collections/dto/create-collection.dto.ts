import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}
