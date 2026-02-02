import { Controller, Post, Body, HttpCode, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Webhook de Clerk - DEBE ser público (no usa Bearer token)
  @Post()
  @Public()
  @HttpCode(200)
  create(@Body() createUserDto: CreateUserDto) {
    console.log('[UsersController][create][createUserDto]', createUserDto);

    return this.usersService.create(createUserDto);
  }

  @Patch()
  update(@Body() updateUserDto: CreateUserDto) {
    return this.usersService.update(updateUserDto);
  }
}
