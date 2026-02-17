import { ApiException } from '../../common/exceptions/api.exception';

/**
 * Excepciones personalizadas para el módulo de tiendas
 */

export class StoreNotFoundException extends ApiException {
  constructor(identifier: string) {
    super(
      10,
      `Store with identifier '${identifier}' not found`,
      undefined,
      404,
    );
  }
}

export class UserNotFoundException extends ApiException {
  constructor(userId: string) {
    super(10, `User with id '${userId}' not found`, undefined, 404);
  }
}

export class OwnerEmailMismatchException extends ApiException {
  constructor() {
    super(
      14,
      'Owner email does not match with user email',
      [
        {
          code: 'email_mismatch',
          path: ['ownerEmail'],
          message: 'Owner email must match the authenticated user email',
        },
      ],
      400,
    );
  }
}

export class DuplicateStoreException extends ApiException {
  constructor(field: string, value: string) {
    super(
      15,
      `Store with ${field} '${value}' already exists`,
      [
        {
          code: 'duplicate_store',
          path: [field],
          message: `${field} '${value}' is already in use`,
        },
      ],
      409,
    );
  }
}
