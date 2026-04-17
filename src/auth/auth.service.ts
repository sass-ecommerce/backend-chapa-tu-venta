import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  UsernameExistsException,
  CodeMismatchException,
  ExpiredCodeException,
  LimitExceededException,
  TooManyRequestsException,
} from '@aws-sdk/client-cognito-identity-provider';
import { RegisterDto } from './dto/register.dto';
import { ConfirmRegistrationDto } from './dto/confirm-registration.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import {
  UserAlreadyExistsException,
  InvalidConfirmationCodeException,
  ResendCodeLimitExceededException,
  CognitoException,
} from './exceptions/auth.exceptions';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly clientId: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('aws.region');
    this.clientId = this.configService.get<string>('cognito.clientId') ?? '';

    this.cognitoClient = new CognitoIdentityProviderClient({ region });
  }

  async register(dto: RegisterDto) {
    try {
      const result = await this.cognitoClient.send(
        new SignUpCommand({
          ClientId: this.clientId,
          Username: dto.email,
          Password: dto.password,
          UserAttributes: [
            { Name: 'email', Value: dto.email },
            { Name: 'given_name', Value: dto.firstName },
            { Name: 'family_name', Value: dto.lastName },
            { Name: 'name', Value: `${dto.firstName} ${dto.lastName}` },
          ],
        }),
      );

      return {
        userSub: result.UserSub,
        message: 'Verification code sent to your email',
      };
    } catch (error) {
      if (error instanceof UsernameExistsException) {
        throw new UserAlreadyExistsException(dto.email);
      }
      throw new CognitoException(error.message);
    }
  }

  async confirmRegistration(dto: ConfirmRegistrationDto) {
    try {
      await this.cognitoClient.send(
        new ConfirmSignUpCommand({
          ClientId: this.clientId,
          Username: dto.email,
          ConfirmationCode: dto.code,
        }),
      );

      return { message: 'Account confirmed successfully. You can now log in.' };
    } catch (error) {
      if (
        error instanceof CodeMismatchException ||
        error instanceof ExpiredCodeException
      ) {
        throw new InvalidConfirmationCodeException();
      }
      throw new CognitoException(error.message);
    }
  }

  async resendCode(dto: ResendCodeDto) {
    try {
      await this.cognitoClient.send(
        new ResendConfirmationCodeCommand({
          ClientId: this.clientId,
          Username: dto.email,
        }),
      );

      return { message: 'Verification code resent to your email' };
    } catch (error) {
      if (
        error instanceof LimitExceededException ||
        error instanceof TooManyRequestsException
      ) {
        throw new ResendCodeLimitExceededException();
      }
      throw new CognitoException(error.message);
    }
  }
}
