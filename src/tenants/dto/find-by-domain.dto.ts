import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class FindByDomainDto {
  @Transform(({ value }: { value: string }) =>
    value
      .normalize('NFD')
      .replace(/\p{Mn}/gu, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, ''),
  )
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'domain solo puede contener letras minúsculas, números y guiones',
  })
  domain: string;
}
