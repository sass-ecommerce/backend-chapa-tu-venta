import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CognitoJwtGuard } from 'src/auth/guards/cognito-jwt.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CognitoUser } from 'src/auth/interfaces/cognito-user.interface';

@Controller('categories')
@UseGuards(CognitoJwtGuard)
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
  async create(
    @CurrentUser() user: CognitoUser,
    @Body() dto: CreateCategoryDto,
  ) {
    const category = await this.categoriesService.create(dto, user.tenantId!);
    return {
      code: 201,
      message: 'Category created successfully',
      data: category,
    };
  }

  @Get()
  async findAll(@CurrentUser() user: CognitoUser) {
    const categories = await this.categoriesService.findAllByTenant(
      user.tenantId!,
    );
    return {
      code: 200,
      message: 'Categories retrieved successfully',
      data: categories,
    };
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const category = await this.categoriesService.findOne(id, user.tenantId!);
    return {
      code: 200,
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.categoriesService.softDelete(id, user.tenantId!);
    return {
      code: 200,
      message: 'Category deleted successfully',
      data: null,
    };
  }
}
