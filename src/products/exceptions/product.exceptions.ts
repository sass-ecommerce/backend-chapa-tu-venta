import { ApiException } from '../../common/exceptions/api.exception';

/**
 * Excepciones personalizadas para el módulo de productos
 */

export class ProductNotFoundException extends ApiException {
  constructor(slug: string) {
    super(10, `Product with slug '${slug}' not found`, undefined, 404);
  }
}

export class InvalidProductDataException extends ApiException {
  constructor(message: string) {
    super(14, message, undefined, 400);
  }
}

export class DuplicateProductSKUException extends ApiException {
  constructor(sku: string) {
    super(
      15,
      `Product with SKU '${sku}' already exists`,
      [
        {
          code: 'duplicate_sku',
          path: ['sku'],
          message: `SKU '${sku}' is already in use`,
        },
      ],
      409,
    );
  }
}
