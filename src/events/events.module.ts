import { Global, Module } from '@nestjs/common';
import { EventBridgeService } from './eventbridge.service';

@Global()
@Module({
  providers: [EventBridgeService],
  exports: [EventBridgeService],
})
export class EventsModule {}
