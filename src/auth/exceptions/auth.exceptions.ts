import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../common/exceptions/api.exception';

export class UserAlreadyExistsException extends ApiException {
  constructor(email: string) {
    super(
      15,
      `User with email '${email}' already exists`,
      [
        {
          code: 'user_already_exists',
          path: ['email'],
          message: 'Email is already registered',
        },
      ],
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidConfirmationCodeException extends ApiException {
  constructor() {
    super(
      30,
      'Invalid or expired confirmation code',
      [
        {
          code: 'invalid_code',
          path: ['code'],
          message: 'The confirmation code is invalid or has expired',
        },
      ],
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class UserNotConfirmedException extends ApiException {
  constructor() {
    super(31, 'User account is not confirmed', undefined, HttpStatus.FORBIDDEN);
  }
}

export class ResendCodeLimitExceededException extends ApiException {
  constructor() {
    super(
      32,
      'Resend code limit exceeded. Please wait before requesting a new code',
      undefined,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class InvalidCredentialsException extends ApiException {
  constructor() {
    super(40, 'Invalid email or password', undefined, HttpStatus.UNAUTHORIZED);
  }
}

export class InvalidRefreshTokenException extends ApiException {
  constructor() {
    super(
      41,
      'Invalid or expired refresh token',
      undefined,
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class InvalidResetCodeException extends ApiException {
  constructor() {
    super(
      50,
      'Invalid or expired password reset code',
      [
        {
          code: 'invalid_reset_code',
          path: ['code'],
          message: 'The reset code is invalid or has expired',
        },
      ],
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class CognitoException extends ApiException {
  constructor(message: string) {
    super(99, message, undefined, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
