import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ConfirmRegistrationDto } from './dto/confirm-registration.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { Public } from '../cognito-auth/decorators/public.decorator';

@Controller('auth')
@Public()
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
  @HttpCode(HttpStatus.OK)
  async resendCode(@Body() dto: ResendCodeDto) {
    const data = await this.authService.resendCode(dto);
    return {
      code: 200,
      message: data.message,
      data: null,
    };
  }
}
