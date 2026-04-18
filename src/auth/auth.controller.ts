import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ConfirmRegistrationDto } from './dto/confirm-registration.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '../cognito-auth/decorators/public.decorator';
import { CognitoJwtGuard } from '../cognito-auth/guards/cognito-jwt.guard';

@Controller('auth')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return {
      code: 201,
      message: data.message,
      data: { userSub: data.userSub },
    };
  }

  @Post('confirm-registration')
  @Public()
  @HttpCode(HttpStatus.OK)
  async confirmRegistration(@Body() dto: ConfirmRegistrationDto) {
    const data = await this.authService.confirmRegistration(dto);
    return {
      code: 200,
      message: data.message,
      data: null,
    };
  }

  @Post('resend-code')
  @Public()
  @HttpCode(HttpStatus.OK)
  async resendCode(@Body() dto: ResendCodeDto) {
    const data = await this.authService.resendCode(dto);
    return {
      code: 200,
      message: data.message,
      data: null,
    };
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return {
      code: 200,
      message: 'Login successful',
      data,
    };
  }

  @Post('refresh-token')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    const data = await this.authService.refreshToken(dto);
    return {
      code: 200,
      message: 'Token refreshed successfully',
      data,
    };
  }

  @Post('logout')
  @UseGuards(CognitoJwtGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Headers('authorization') authorization: string) {
    const token = authorization.replace(/^Bearer\s+/i, '');
    const data = await this.authService.logout(token);
    return {
      code: 200,
      message: data.message,
      data: null,
    };
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const data = await this.authService.forgotPassword(dto);
    return {
      code: 200,
      message: data.message,
      data: null,
    };
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const data = await this.authService.resetPassword(dto);
    return {
      code: 200,
      message: data.message,
      data: null,
    };
  }
}
