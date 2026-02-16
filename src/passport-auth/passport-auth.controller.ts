import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { PassportAuthService } from './passport-auth.service';

@Controller('passport-auth')
@UseGuards(JwtAuthGuard) // Proteger todo el controller por defecto
export class PassportAuthController {
  constructor(private readonly authService: PassportAuthService) {}

  /**
   * Registrar nuevo usuario
   */
  @Post('register')
  @Public()
  async register(@Body() registerDto: RegisterDto) {
    console.log('Registering user with email:', registerDto.email);
    return this.authService.register(registerDto);
  }

  /**
   * Login con email y password
   */
  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  async login(
    @Request() req: any,
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(req.user as any, ip, userAgent);
  }

  /**
   * Renovar access token con refresh token
   */
  @Post('refresh')
  @Public()
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  /**
   * Logout (revocar refresh token)
   */
  @Post('logout')
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.logout(refreshTokenDto.refreshToken);
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  @Get('me')
  getProfile(@CurrentUser() user: any) {
    return {
      userId: user.userId,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Revocar todos los tokens del usuario
   */
  @Post('revoke-all')
  async revokeAllTokens(@CurrentUser('userId') userId: string) {
    return this.authService.revokeAllUserTokens(userId);
  }
}
