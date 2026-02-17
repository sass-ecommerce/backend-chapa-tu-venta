import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Logger,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { PassportAuthService } from './passport-auth.service';
import { OtpVerificationService } from './otp-verification.service';
import { EmailNotFoundException } from './exceptions/auth.exceptions';
import type {
  AuthenticatedRequest,
  JwtPayload,
} from './interfaces/authenticated-user.interface';

@Controller('auth')
@UseGuards(JwtAuthGuard) // Proteger todo el controller por defecto
export class PassportAuthController {
  private readonly logger = new Logger(PassportAuthController.name);

  constructor(
    private readonly authService: PassportAuthService,
    private readonly otpService: OtpVerificationService,
  ) {}

  /**
   * Registrar nuevo usuario y enviar OTP de verificación
   */
  @Post('register')
  @Public()
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log(`Registering user with email: ${registerDto.email}`);
    const result = await this.authService.register(registerDto);

    return {
      code: 201,
      message: 'User registered successfully. Please verify your email.',
      data: {
        sessionId: result.sessionId,
      },
    };
  }

  /**
   * Verificar email con código OTP
   */
  @Post('verify-email')
  @Public()
  async verifyEmail(@Body() verifyOtpDto: VerifyOtpDto) {
    const result = await this.otpService.verifyEmailWithOtp(
      verifyOtpDto.sessionId,
      verifyOtpDto.code,
    );

    return {
      code: 200,
      message: result.message,
      data: {},
    };
  }

  /**
   * Reenviar código de verificación de email
   */
  @Post('resend-verification')
  @Public()
  async resendVerification(@Body() resendOtpDto: ResendOtpDto) {
    const result = await this.otpService.resendEmailVerification(
      resendOtpDto.sessionId,
    );

    return {
      code: 200,
      message: result.message,
      data: {
        sessionId: result.sessionId,
      },
    };
  }

  /**
   * Login con email y password
   * Solo permite login si el email está verificado
   */
  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  async login(
    @Request() req: AuthenticatedRequest,
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const result = await this.authService.login(req.user, ip, userAgent);

    return {
      code: 200,
      message: 'Login successful',
      data: result,
    };
  }

  /**
   * Renovar access token con refresh token
   */
  @Post('refresh')
  @Public()
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshAccessToken(
      refreshTokenDto.refreshToken,
    );
    return {
      code: 200,
      message: 'Refresh token successful',
      data: result,
    };
  }

  /**
   * Logout (revocar refresh token)
   */
  @Post('logout')
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.logout(refreshTokenDto.refreshToken);
    return {
      code: 200,
      message: 'Logout successful',
      data: result,
    };
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  @Get('me')
  getProfile(@CurrentUser() user: JwtPayload) {
    return {
      code: 200,
      message: 'User profile retrieved',
      data: {
        userId: user.sub,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Revocar todos los tokens del usuario
   */
  @Post('revoke-all')
  async revokeAllTokens(@CurrentUser('sub') userId: string) {
    const result = await this.authService.revokeAllUserTokens(userId);
    return {
      code: 200,
      message: 'All tokens revoked',
      data: result,
    };
  }

  /**
   * Solicitar reset de password (envía OTP por email)
   * Retorna sessionId si el email existe, error 404 si no
   */
  @Post('forgot-password')
  @Public()
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    // 1. Buscar usuario por email
    const user = await this.authService.findUserByEmail(
      forgotPasswordDto.email,
    );

    // 2. Si NO existe, lanzar excepción
    if (!user) {
      throw new EmailNotFoundException();
    }

    // 3. Crear OTP y enviar email
    const otpSession = await this.otpService.createPasswordResetOtp(user);

    // 4. Retornar sessionId
    return {
      code: 200,
      message: 'Password reset code sent to your email.',
      data: {
        sessionId: otpSession.id,
      },
    };
  }

  /**
   * Resetear password con código OTP
   * Método unificado que verifica OTP y resetea password en una sola llamada
   */
  @Post('reset-password')
  @Public()
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPasswordWithOtp(
      resetPasswordDto.sessionId,
      resetPasswordDto.code,
      resetPasswordDto.newPassword,
    );

    return {
      code: 200,
      message:
        'Password reset successfully. Please login with your new password.',
      data: {},
    };
  }
}
