import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ClerkAuthGuard } from 'src/auth/guards/clerk-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/interfaces/clerk-user.interface';

@Controller('stores')
@UseGuards(ClerkAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createStoreDto: CreateStoreDto,
  ) {
    return this.storesService.create(createStoreDto, user);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.storesService.findAll(paginationDto);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.storesService.findOne(slug);
  }

  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storesService.update(slug, updateStoreDto);
  }

  @Delete(':slug')
  remove(@Param('slug') slug: string) {
    return this.storesService.remove(slug);
  }
}
