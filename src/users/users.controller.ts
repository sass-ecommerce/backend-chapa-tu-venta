import { Controller } from '@nestjs/common';

@Controller('users')
export class UsersController {
  // User creation is now handled by PassportAuthService via /passport-auth/register
  // This controller is kept for potential future user management endpoints
}
