import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';

class HttpRequestDto {
  @IsString()
  @IsNotEmpty()
  client_ip: string;

  @IsString()
  @IsNotEmpty()
  user_agent: string;
}

class EventAttributesDto {
  @ValidateNested()
  @Type(() => HttpRequestDto)
  @IsObject()
  http_request: HttpRequestDto;
}

class DeletedUserDataDto {
  @IsBoolean()
  @IsNotEmpty()
  deleted: boolean;

  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  object: string;
}

export class DeleteUserDto {
  @ValidateNested()
  @Type(() => DeletedUserDataDto)
  @IsObject()
  @IsNotEmpty()
  data: DeletedUserDataDto;

  @ValidateNested()
  @Type(() => EventAttributesDto)
  @IsObject()
  @IsNotEmpty()
  event_attributes: EventAttributesDto;

  @IsString()
  @IsNotEmpty()
  instance_id: string;

  @IsString()
  @IsNotEmpty()
  object: string;

  @IsNumber()
  @IsNotEmpty()
  timestamp: number;

  @IsString()
  @IsNotEmpty()
  type: string;
}
