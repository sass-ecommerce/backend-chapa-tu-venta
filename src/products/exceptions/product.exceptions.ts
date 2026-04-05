import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../common/exceptions/api.exception';

export class ProductNotFoundException extends ApiException {
  constructor(id: string) {
    super(10, `Product '${id}' not found`, undefined, HttpStatus.NOT_FOUND);
  }
}

export class ProductVariantNotFoundException extends ApiException {
  constructor(id: string) {
    super(
      11,
      `Product variant '${id}' not found`,
      undefined,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ProductSkuAlreadyExistsException extends ApiException {
  constructor(sku: string) {
    super(
      12,
      `SKU '${sku}' already exists in this tenant`,
      undefined,
      HttpStatus.CONFLICT,
    );
  }
}

export class ProductCategoryMismatchException extends ApiException {
  constructor(categoryId: string) {
    super(
      13,
      `Category '${categoryId}' not found in this tenant`,
      undefined,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
