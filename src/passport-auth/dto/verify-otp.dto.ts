import { IsString, IsUUID, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsUUID()
  sessionId: string;

  @IsString()
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP code must contain only numbers' })
  code: string;
}
