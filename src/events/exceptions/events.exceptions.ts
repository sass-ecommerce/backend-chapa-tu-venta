import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../common/exceptions/api.exception';

export class EventBridgePublishException extends ApiException {
  constructor() {
    super(
      70,
      'Failed to publish event to EventBridge',
      undefined,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class EventBusArnNotFoundException extends ApiException {
  constructor() {
    super(
      71,
      'EventBridge bus ARN could not be retrieved from SSM',
      undefined,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
