import { Global, Module } from '@nestjs/common';
import { ClerkAuthGuard } from './guards/clerk.guard';
import { ClekService } from './clerk.service';

@Global()
@Module({
  providers: [ClerkAuthGuard, ClekService],
  exports: [ClerkAuthGuard, ClekService],
})
export class AuthModule {}
