import { Controller, Post, Body, HttpCode, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(200)
  create(@Body() createUserDto: CreateUserDto) {
    console.log('[UsersController][create][createUserDto]', createUserDto);

    return this.usersService.create(createUserDto);
  }

  @Patch()
  update(@Body() createUserDto: CreateUserDto) {
    return this.usersService.update(createUserDto);
  }
}
