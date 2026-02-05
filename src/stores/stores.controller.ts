import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { ClerkAuthGuard } from 'src/auth/guards/clerk-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/interfaces/clerk-user.interface';

@Controller('stores')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
@UseGuards(ClerkAuthGuard)
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
  findOne(@Param('slug') slug: string) {
    return this.storesService.findOne(slug);
  }
}
