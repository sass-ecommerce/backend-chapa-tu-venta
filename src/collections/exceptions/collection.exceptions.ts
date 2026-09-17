import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../common/exceptions/api.exception';

export class CollectionNotFoundException extends ApiException {
  constructor(id: string) {
    super(60, `Collection '${id}' not found`, undefined, HttpStatus.NOT_FOUND);
  }
}

export class CollectionProductNotFoundException extends ApiException {
  constructor(productId: string, collectionId: string) {
    super(
      61,
      `Product '${productId}' not found in collection '${collectionId}'`,
      undefined,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class CollectionInvalidProductsException extends ApiException {
  constructor(invalidProductIds: string[]) {
    super(
      62,
      'One or more products do not exist in this tenant',
      invalidProductIds,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class CollectionsNotFoundException extends ApiException {
  constructor(missingIds: string[]) {
    super(
      63,
      'One or more collections were not found',
      missingIds,
      HttpStatus.NOT_FOUND,
    );
  }
}
