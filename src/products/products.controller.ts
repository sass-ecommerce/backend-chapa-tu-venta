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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductVariantsDto } from './dto/create-product-variants.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { QueryProductDto } from './dto/query-product.dto';

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

  // 1. Crear producto base
  @Post()
  async create(@Body() dto: CreateProductDto) {
    const product = await this.productsService.create(dto);
    return {
      code: 201,
      message: 'Product created successfully',
      data: product,
    };
  }

  // 3. Listar productos base
  @Get()
  async findAll(@Query() query: QueryProductDto) {
    const result = await this.productsService.findAll(query);
    return {
      code: 200,
      message: 'Products retrieved successfully',
      data: { products: result.data, meta: result.meta },
    };
  }

  // 2. Crear variantes de un producto (acepta array)
  @Post(':id/variants')
  async createVariants(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProductVariantsDto,
  ) {
    const variants = await this.productsService.createVariants(id, dto);
    return {
      code: 201,
      message: 'Variants created successfully',
      data: variants,
    };
  }

  // 4. Listar variantes de un producto base
  @Get(':id/variants')
  async findVariants(@Param('id', ParseUUIDPipe) id: string) {
    const variants = await this.productsService.findVariantsByProduct(id);
    return {
      code: 200,
      message: 'Variants retrieved successfully',
      data: variants,
    };
  }

  // 6. Actualizar variante (solo una por vez) — debe ir antes de PATCH :id
  @Patch('variants/:id')
  async updateVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    const variant = await this.productsService.updateVariant(id, dto);
    return {
      code: 200,
      message: 'Variant updated successfully',
      data: variant,
    };
  }

  // 5. Actualizar producto base
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.productsService.update(id, dto);
    return {
      code: 200,
      message: 'Product updated successfully',
      data: product,
    };
  }

  // 7. Eliminación lógica de producto base
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.productsService.softDelete(id);
  }
}
