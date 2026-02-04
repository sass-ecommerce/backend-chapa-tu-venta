import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
  UsePipes,
  HttpCode,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ClerkAuthGuard } from 'src/auth/guards/clerk-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/interfaces/clerk-user.interface';

@Controller('products')
@UseGuards(ClerkAuthGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(200)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(createProductDto, user);
  }

  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    console.log('[ProductsController][findAll][user]', user);
    return this.productsService.findAll(paginationDto);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.productsService.findOne(slug);
  }
}
