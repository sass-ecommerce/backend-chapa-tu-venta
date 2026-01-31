import { Module, Global } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';

/**
 * Módulo de autenticación con Clerk
 * Se marca como @Global() para que el guard esté disponible en toda la app
 */
@Global()
@Module({
  providers: [AuthService, ClerkAuthGuard],
  exports: [AuthService, ClerkAuthGuard],
})
export class AuthModule {}
