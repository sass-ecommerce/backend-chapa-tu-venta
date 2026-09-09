import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../common/exceptions/api.exception';

export class TenantNotFoundException extends ApiException {
  constructor(id: string) {
    super(10, `Tenant '${id}' not found`, undefined, HttpStatus.NOT_FOUND);
  }
}

export class TenantDomainAlreadyExistsException extends ApiException {
  constructor(domain: string) {
    super(
      15,
      `Domain '${domain}' is already in use`,
      undefined,
      HttpStatus.CONFLICT,
    );
  }
}

export class TenantOwnerNotFoundException extends ApiException {
  constructor(cognitoSub: string) {
    super(
      16,
      `User with Cognito ID '${cognitoSub}' not found`,
      undefined,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class TenantAdminRoleNotFoundException extends ApiException {
  constructor() {
    super(
      17,
      `ADMINISTRADOR role not found. Ensure roles are seeded.`,
      undefined,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
