import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ValidationPipe,
  UsePipes,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CurrentUser } from 'src/passport-auth/decorators/current-user.decorator';
import { Public } from 'src/passport-auth/decorators/public.decorator';
import type { AuthenticatedUser } from 'src/passport-auth/interfaces/authenticated-user.interface';

@Controller('products')
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
  @Public()
  findAll(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    console.log('[ProductsController][findAll][user]', user);
    return this.productsService.findAll(paginationDto);
  }

  @Get(':slug')
  @Public()
  findOne(@Param('slug', ParseUUIDPipe) slug: string) {
    return this.productsService.findOne(slug);
  }
}
