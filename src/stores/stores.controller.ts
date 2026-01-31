import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { ClerkAuthGuard } from 'src/auth/guards/clerk.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@clerk/types';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentUser() user: JwtPayload,
    @Body() createStoreDto: CreateStoreDto,
  ) {
    console.log('User creating store: ', user);
    return this.storesService.create(createStoreDto, user);
  }

  @Get()
  findAll() {
    return this.storesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
  //   return this.storesService.update(+id, updateStoreDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.storesService.remove(+id);
  // }
}
