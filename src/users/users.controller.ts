import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CognitoPostConfirmationDto } from './dto/cognito-post-confirmation.dto';
import { BulkDeleteUsersDto } from './dto/bulk-delete-users.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CognitoUser } from '../auth/interfaces/cognito-user.interface';
import { DevOnlyGuard } from '../common/guards/dev-only.guard';

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

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async deleteMe(@CurrentUser() user: CognitoUser) {
    await this.usersService.deleteMe(user.sub);
    return {
      code: 200,
      message: 'User account deleted successfully',
      data: null,
    };
  }

  @Delete('internal/bulk-delete')
  @Public()
  @UseGuards(DevOnlyGuard)
  @HttpCode(HttpStatus.OK)
  async bulkDelete(@Body() dto: BulkDeleteUsersDto) {
    const result = await this.usersService.bulkDeleteByEmails(dto.emails);
    return {
      code: 200,
      message: 'Bulk delete completed',
      data: result,
    };
  }
}
