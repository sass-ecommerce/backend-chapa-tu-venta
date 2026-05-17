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
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductVariantsDto } from './dto/create-product-variants.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { QueryProductDto } from './dto/query-product.dto';
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
  constructor(private readonly productsService: ProductsService) {}

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
}
