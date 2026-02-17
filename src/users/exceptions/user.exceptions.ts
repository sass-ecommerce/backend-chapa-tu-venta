import { ApiException } from '../../common/exceptions/api.exception';

/**
 * Excepciones personalizadas para el módulo de usuarios
 */

export class UserNotFoundException extends ApiException {
  constructor(userId: string) {
    super(10, `User with id '${userId}' not found`, undefined, 404);
  }
}

export class DuplicateUserException extends ApiException {
  constructor(field: string, value: string) {
    super(
      15,
      `User with ${field} '${value}' already exists`,
      [
        {
          code: 'duplicate_user',
          path: [field],
          message: `${field} '${value}' is already registered`,
        },
      ],
      409,
    );
  }
}
