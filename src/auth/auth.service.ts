import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GlobalSignOutCommand,
  UsernameExistsException,
  CodeMismatchException,
  ExpiredCodeException,
  LimitExceededException,
  TooManyRequestsException,
  NotAuthorizedException,
  UserNotConfirmedException as CognitoUserNotConfirmedException,
} from '@aws-sdk/client-cognito-identity-provider';
import { RegisterDto } from './dto/register.dto';
import { ConfirmRegistrationDto } from './dto/confirm-registration.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  UserAlreadyExistsException,
  InvalidConfirmationCodeException,
  ResendCodeLimitExceededException,
  InvalidCredentialsException,
  InvalidRefreshTokenException,
  InvalidAccessTokenException,
  InvalidResetCodeException,
  UserNotConfirmedException,
  CognitoException,
} from './exceptions/auth.exceptions';

@Injectable()
export class AuthService {
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

  async login(dto: LoginDto) {
    try {
      const result = await this.cognitoClient.send(
        new InitiateAuthCommand({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: this.clientId,
          AuthParameters: {
            USERNAME: dto.email,
            PASSWORD: dto.password,
          },
        }),
      );

      const tokens = result.AuthenticationResult!;
      return {
        accessToken: tokens.AccessToken!,
        refreshToken: tokens.RefreshToken!,
        expiresIn: tokens.ExpiresIn!,
        tokenType: tokens.TokenType!,
      };
    } catch (error) {
      if (error instanceof NotAuthorizedException) {
        throw new InvalidCredentialsException();
      }
      if (error instanceof CognitoUserNotConfirmedException) {
        throw new UserNotConfirmedException();
      }
      throw new CognitoException(error.message);
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    try {
      await this.cognitoClient.send(
        new ForgotPasswordCommand({
          ClientId: this.clientId,
          Username: dto.email,
        }),
      );

      return { message: 'Password reset code sent to your email' };
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

  async resetPassword(dto: ResetPasswordDto) {
    try {
      await this.cognitoClient.send(
        new ConfirmForgotPasswordCommand({
          ClientId: this.clientId,
          Username: dto.email,
          ConfirmationCode: dto.code,
          Password: dto.newPassword,
        }),
      );

      return { message: 'Password reset successfully. You can now log in.' };
    } catch (error) {
      if (
        error instanceof CodeMismatchException ||
        error instanceof ExpiredCodeException
      ) {
        throw new InvalidResetCodeException();
      }
      throw new CognitoException(error.message);
    }
  }

  async logout(accessToken: string) {
    try {
      await this.cognitoClient.send(
        new GlobalSignOutCommand({
          AccessToken: accessToken,
        }),
      );

      return { message: 'Logged out successfully' };
    } catch (error) {
      if (error instanceof NotAuthorizedException) {
        throw new InvalidAccessTokenException();
      }
      throw new CognitoException(error.message);
    }
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const result = await this.cognitoClient.send(
        new InitiateAuthCommand({
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          ClientId: this.clientId,
          AuthParameters: {
            REFRESH_TOKEN: dto.refreshToken,
          },
        }),
      );

      const tokens = result.AuthenticationResult!;
      return {
        accessToken: tokens.AccessToken!,
        expiresIn: tokens.ExpiresIn!,
        tokenType: tokens.TokenType!,
      };
    } catch (error) {
      if (error instanceof NotAuthorizedException) {
        throw new InvalidRefreshTokenException();
      }
      throw new CognitoException(error.message);
    }
  }
}
