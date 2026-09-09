import { ApiException } from '../../common/exceptions/api.exception';

export class PresignedUrlGenerationException extends ApiException {
  constructor() {
    super(50, 'Failed to generate presigned URL', undefined, 500);
  }
}
