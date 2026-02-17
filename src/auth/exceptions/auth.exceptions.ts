import { ApiException } from '../../common/exceptions/api.exception';

/**
 * Excepciones personalizadas para el módulo de autenticación (OTP y Passport)
 */

export class OtpCreationFailedException extends ApiException {
  constructor() {
    super(
      20,
      'Failed to create verification session. Please try again later.',
      undefined,
      500,
    );
  }
}

export class OtpSessionNotFoundException extends ApiException {
  constructor() {
    super(21, 'Verification session not found', undefined, 404);
  }
}

export class OtpSessionExpiredException extends ApiException {
  constructor() {
    super(22, 'Verification session expired', undefined, 410);
  }
}

export class OtpSessionUsedException extends ApiException {
  constructor() {
    super(23, 'Verification session not found or expired', undefined, 404);
  }
}

export class OtpMaxAttemptsExceededException extends ApiException {
  constructor() {
    super(24, 'Verification session not found or expired', undefined, 404);
  }
}

export class OtpInvalidCodeException extends ApiException {
  constructor() {
    super(25, 'Invalid verification code', undefined, 400);
  }
}

export class OtpEmailAlreadyVerifiedException extends ApiException {
  constructor() {
    super(26, 'Email already verified', undefined, 409);
  }
}

export class OtpSessionAlreadyUsedException extends ApiException {
  constructor() {
    super(27, 'Verification session already used or expired', undefined, 410);
  }
}

/**
 * Excepciones personalizadas para autenticación con Passport
 */

export class EmailNotVerifiedException extends ApiException {
  constructor() {
    super(30, 'Email not verified', undefined, 403);
  }
}

export class EmailAlreadyExistsException extends ApiException {
  constructor(email: string) {
    super(
      31,
      `Email already exists`,
      [
        {
          code: 'duplicate_email',
          path: ['email'],
          message: `Email '${email}' is already registered`,
        },
      ],
      409,
    );
  }
}

export class InvalidRefreshTokenException extends ApiException {
  constructor() {
    super(32, 'Invalid refresh token', undefined, 401);
  }
}

export class RefreshTokenExpiredException extends ApiException {
  constructor() {
    super(33, 'Refresh token expired', undefined, 401);
  }
}

export class TokenReuseDetectedException extends ApiException {
  constructor() {
    super(34, 'Token reuse detected', undefined, 401);
  }
}

export class PasswordResetSessionInvalidException extends ApiException {
  constructor() {
    super(35, 'Invalid or expired password reset session', undefined, 400);
  }
}

export class EmailNotFoundException extends ApiException {
  constructor() {
    super(36, 'Email not found', undefined, 404);
  }
}

export class SamePasswordException extends ApiException {
  constructor() {
    super(
      37,
      'New password must be different from the current password',
      undefined,
      400,
    );
  }
}
