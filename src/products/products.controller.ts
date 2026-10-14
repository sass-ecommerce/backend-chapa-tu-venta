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
import { ProductsService } from './products.service';
import { ProductImagesService } from './product-images.service';
import { ProductVariantImagesService } from './product-variant-images.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductVariantsDto } from './dto/create-product-variants.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { RegisterProductImageDto } from './dto/register-product-image.dto';
import { ReorderProductImagesDto } from './dto/reorder-product-images.dto';
import { CognitoJwtGuard } from 'src/auth/guards/cognito-jwt.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
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
    private readonly productVariantImagesService: ProductVariantImagesService,
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

  @Post(':id/variants/:variantId/images')
  async registerVariantImage(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: RegisterProductImageDto,
  ) {
    const image = await this.productVariantImagesService.addImage(
      id,
      variantId,
      user.tenantId!,
      dto,
    );
    return {
      code: 201,
      message: 'Variant image registered successfully',
      data: image,
    };
  }

  @Patch(':id/variants/:variantId/images/order')
  async reorderVariantImages(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: ReorderProductImagesDto,
  ) {
    const images = await this.productVariantImagesService.reorderImages(
      id,
      variantId,
      dto.imageIds,
      user.tenantId!,
    );
    return {
      code: 200,
      message: 'Variant images reordered successfully',
      data: images,
    };
  }

  @Get(':id/variants/:variantId/images')
  async findVariantImages(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ) {
    const images = await this.productVariantImagesService.findImagesByVariant(
      id,
      variantId,
      user.tenantId!,
    );
    return {
      code: 200,
      message: 'Variant images retrieved successfully',
      data: images,
    };
  }

  @Delete('variants/images/:id')
  @HttpCode(HttpStatus.OK)
  async removeVariantImage(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.productVariantImagesService.removeImage(id, user.tenantId!);
    return {
      code: 200,
      message: 'Variant image deleted successfully',
      data: null,
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
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.productsService.softDelete(id, user.tenantId!);
    return {
      code: 200,
      message: 'Product deleted successfully',
      data: null,
    };
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
