import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Public } from '../auth/decorators/public.decorator';
import { ClerkAuthGuard } from 'src/auth/guards/clerk-auth.guard';

@Controller('users')
@UsePipes(
  new ValidationPipe({
    whitelist: false,
    transform: true,
    forbidNonWhitelisted: false,
  }),
)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Webhook de Clerk - DEBE ser público (no usa Bearer token)
  // Se desactiva la validación estricta para permitir datos adicionales del webhook
  @Post()
  @Public()
  @HttpCode(200)
  create(@Body() createUserDto: CreateUserDto) {
    // console.log('[UsersController][create][createUserDto]', createUserDto);

    return this.usersService.create(createUserDto);
  }

  // Endpoint de actualización - También recibe datos de webhook/externos
  // Se desactiva la validación estricta para permitir propiedades adicionales
  @Post('/update')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(200)
  update(@Body() updateUserDto: CreateUserDto) {
    return this.usersService.update(updateUserDto);
  }

  // @Post('/delete')
  // @UseGuards(ClerkAuthGuard)
  // @HttpCode(200)
  // delete(@Body() deleteUserDto: DeleteUserDto) {
  //   return this.usersService.delete(deleteUserDto);
  // }
}
