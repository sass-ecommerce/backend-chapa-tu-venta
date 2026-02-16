import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { CurrentUser } from 'src/passport-auth/decorators/current-user.decorator';
import { Public } from 'src/passport-auth/decorators/public.decorator';
import type { AuthenticatedUser } from 'src/passport-auth/interfaces/authenticated-user.interface';

@Controller('stores')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createStoreDto: CreateStoreDto,
  ) {
    return this.storesService.upsert(createStoreDto, user);
  }

  @Get(':slug')
  @Public()
  findOne(@Param('slug') slug: string) {
    return this.storesService.findOne(slug);
  }
}
