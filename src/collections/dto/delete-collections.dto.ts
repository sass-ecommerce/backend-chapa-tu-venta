import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class DeleteCollectionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids: string[];
}
