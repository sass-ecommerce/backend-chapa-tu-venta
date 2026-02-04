import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { ClerkAuthGuard } from 'src/auth/guards/clerk-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/interfaces/clerk-user.interface';

@Controller('stores')
@UseGuards(ClerkAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @HttpCode(200)
  upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createStoreDto: CreateStoreDto,
  ) {
    return this.storesService.upsert(createStoreDto, user);
  }

  // @Get()
  // findAll(@Query() paginationDto: PaginationDto) {
  //   return this.storesService.findAll(paginationDto);
  // }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  // @Delete(':slug')
  // remove(@Param('slug') slug: string) {
  //   return this.storesService.remove(slug);
  // }
}
