import { Type } from 'class-transformer';
import { IsIn, IsObject, IsString, ValidateNested } from 'class-validator';

// Cognito sends userAttributes as a flat Record<string, string>.
// Keys like "cognito:email_alias" cannot be modeled as class properties,
// so we keep the whole object and extract values in the service.
class CognitoRequestDto {
  @IsObject()
  userAttributes: Record<string, string>;
}

export class CognitoPostConfirmationDto {
  @IsString()
  @IsIn([
    'PostConfirmation_ConfirmSignUp',
    'PostConfirmation_ConfirmForgotPassword',
  ])
  triggerSource: string;

  @IsString()
  userPoolId: string;

  @IsString()
  userName: string;

  @ValidateNested()
  @Type(() => CognitoRequestDto)
  request: CognitoRequestDto;
}
