import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../common/exceptions/api.exception';

export class CategoryNotFoundException extends ApiException {
  constructor(id: string) {
    super(20, `Category '${id}' not found`, undefined, HttpStatus.NOT_FOUND);
  }
}

export class CategorySlugAlreadyExistsException extends ApiException {
  constructor(slug: string) {
    super(
      21,
      `Slug '${slug}' already exists in this tenant`,
      undefined,
      HttpStatus.CONFLICT,
    );
  }
}

export class CategoryParentNotFoundException extends ApiException {
  constructor(parentId: string) {
    super(
      22,
      `Parent category '${parentId}' not found in this tenant`,
      undefined,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
