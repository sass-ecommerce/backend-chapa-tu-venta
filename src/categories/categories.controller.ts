import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('categories')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    const category = await this.categoriesService.create(dto);
    return {
      code: 201,
      message: 'Category created successfully',
      data: category,
    };
  }

  @Get()
  async findAll(@Query('tenantId', ParseUUIDPipe) tenantId: string) {
    const categories = await this.categoriesService.findAllByTenant(tenantId);
    return {
      code: 200,
      message: 'Categories retrieved successfully',
      data: categories,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const category = await this.categoriesService.findOne(id);
    return {
      code: 200,
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.categoriesService.softDelete(id);
    return {
      code: 200,
      message: 'Category deleted successfully',
      data: null,
    };
  }
}
