import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CognitoPostConfirmationDto } from './dto/cognito-post-confirmation.dto';
import { Public } from '../cognito-auth/decorators/public.decorator';

@Controller('users')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('cognito-trigger')
  @Public()
  async cognitoPostConfirmation(@Body() dto: CognitoPostConfirmationDto) {
    const user = await this.usersService.upsertFromCognitoConfirmation(dto);
    return {
      code: 201,
      message: 'User synced successfully',
      data: user,
    };
  }
}
