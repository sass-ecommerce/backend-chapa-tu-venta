import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProductsService, PRODUCTS_CACHE_RESOURCE } from './products.service';
import { ProductImagesService } from './product-images.service';
import { CacheService } from '../common/helpers/cache.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductVariantsDto } from './dto/create-product-variants.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { AddProductImageDto } from './dto/add-product-image.dto';
import { CognitoJwtGuard } from 'src/auth/guards/cognito-jwt.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import type { CognitoUser } from 'src/auth/interfaces/cognito-user.interface';

@Controller('products')
@UseGuards(CognitoJwtGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productImagesService: ProductImagesService,
    private readonly cacheService: CacheService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: CognitoUser,
    @Body() dto: CreateProductDto,
  ) {
    const product = await this.productsService.create(dto, user.tenantId!);
    return {
      code: 201,
      message: 'Product created successfully',
      data: product,
    };
  }

  @Get()
  async findAll(
    @CurrentUser() user: CognitoUser,
    @Query() query: QueryProductDto,
  ) {
    const result = await this.productsService.findAll(query, user.tenantId!);
    return {
      code: 200,
      message: 'Products retrieved successfully',
      data: { products: result.data, meta: result.meta },
    };
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const product = await this.productsService.findOne(id, user.tenantId!);
    return {
      code: 200,
      message: 'Product retrieved successfully',
      data: product,
    };
  }

  @Post(':id/variants')
  async createVariants(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProductVariantsDto,
  ) {
    const variants = await this.productsService.createVariants(
      id,
      dto,
      user.tenantId!,
    );
    return {
      code: 201,
      message: 'Variants created successfully',
      data: variants,
    };
  }

  @Get(':id/variants')
  async findVariants(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const variants = await this.productsService.findVariantsByProduct(
      id,
      user.tenantId!,
    );
    return {
      code: 200,
      message: 'Variants retrieved successfully',
      data: variants,
    };
  }

  @Patch('variants/:id')
  async updateVariant(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    const variant = await this.productsService.updateVariant(
      id,
      dto,
      user.tenantId!,
    );
    return {
      code: 200,
      message: 'Variant updated successfully',
      data: variant,
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.productsService.update(id, dto, user.tenantId!);
    return {
      code: 200,
      message: 'Product updated successfully',
      data: product,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.productsService.softDelete(id, user.tenantId!);
  }

  @Post('images')
  @Public()
  async addImage(@Body() dto: AddProductImageDto) {
    const image = await this.productImagesService.addImage(dto);
    await this.cacheService.deleteListByScope(
      PRODUCTS_CACHE_RESOURCE,
      dto.tenantId,
    );
    return {
      code: 201,
      message: 'Image added successfully',
      data: image,
    };
  }

  @Delete('images/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeImage(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.productImagesService.removeImage(id, user.tenantId!);
  }

  @Get(':id/images')
  async findProductImages(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const images = await this.productImagesService.findImagesByProduct(
      id,
      user.tenantId!,
    );
    return {
      code: 200,
      message: 'Images retrieved successfully',
      data: images,
    };
  }
}
