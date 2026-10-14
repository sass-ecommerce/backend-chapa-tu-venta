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

export class ProductImageKeyMismatchException extends ApiException {
  constructor(s3Key: string) {
    super(
      15,
      `Image key '${s3Key}' does not belong to this product`,
      undefined,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class ProductImageNotFoundException extends ApiException {
  constructor(id: string) {
    super(
      14,
      `Product image '${id}' not found`,
      undefined,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ProductVariantImageNotFoundException extends ApiException {
  constructor(id: string) {
    super(
      16,
      `Product variant image '${id}' not found`,
      undefined,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ProductVariantImageKeyMismatchException extends ApiException {
  constructor(s3Key: string) {
    super(
      17,
      `Image key '${s3Key}' does not belong to this variant`,
      undefined,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class ProductImageListInvalidException extends ApiException {
  constructor(reason: string) {
    super(
      18,
      `Invalid image list: ${reason}`,
      undefined,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
