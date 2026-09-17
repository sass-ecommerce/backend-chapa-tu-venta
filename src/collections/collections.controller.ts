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
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { QueryCollectionProductsDto } from './dto/query-collection-products.dto';
import { AddProductsToCollectionDto } from './dto/add-products-to-collection.dto';
import { RemoveProductsFromCollectionDto } from './dto/remove-products-from-collection.dto';
import { DeleteCollectionsDto } from './dto/delete-collections.dto';
import { CognitoJwtGuard } from 'src/auth/guards/cognito-jwt.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CognitoUser } from 'src/auth/interfaces/cognito-user.interface';

@Controller('collections')
@UseGuards(CognitoJwtGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  async create(
    @CurrentUser() user: CognitoUser,
    @Body() dto: CreateCollectionDto,
  ) {
    const collection = await this.collectionsService.create(
      dto,
      user.tenantId!,
    );
    return {
      code: 201,
      message: 'Collection created successfully',
      data: collection,
    };
  }

  @Get()
  async findAll(@CurrentUser() user: CognitoUser) {
    const collections = await this.collectionsService.findAll(user.tenantId!);
    return {
      code: 200,
      message: 'Collections retrieved successfully',
      data: collections,
    };
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const collection = await this.collectionsService.findOne(
      id,
      user.tenantId!,
    );
    return {
      code: 200,
      message: 'Collection retrieved successfully',
      data: collection,
    };
  }

  @Get(':id/products')
  async findProducts(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryCollectionProductsDto,
  ) {
    const result = await this.collectionsService.findProducts(
      id,
      query,
      user.tenantId!,
    );
    return {
      code: 200,
      message: 'Collection products retrieved successfully',
      data: { products: result.products, meta: result.meta },
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    const collection = await this.collectionsService.update(
      id,
      dto,
      user.tenantId!,
    );
    return {
      code: 200,
      message: 'Collection updated successfully',
      data: collection,
    };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async removeMany(
    @CurrentUser() user: CognitoUser,
    @Body() dto: DeleteCollectionsDto,
  ) {
    const result = await this.collectionsService.softDeleteMany(
      dto.ids,
      user.tenantId!,
    );
    return {
      code: 200,
      message: 'Collections deleted successfully',
      data: result,
    };
  }

  @Post(':id/products')
  async addProducts(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddProductsToCollectionDto,
  ) {
    const result = await this.collectionsService.addProducts(
      id,
      dto,
      user.tenantId!,
    );
    return {
      code: 201,
      message: 'Products added to collection successfully',
      data: result,
    };
  }

  @Delete(':id/products')
  @HttpCode(HttpStatus.OK)
  async removeProducts(
    @CurrentUser() user: CognitoUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RemoveProductsFromCollectionDto,
  ) {
    const result = await this.collectionsService.removeProducts(
      id,
      dto,
      user.tenantId!,
    );
    return {
      code: 200,
      message: 'Products removed from collection successfully',
      data: result,
    };
  }
}
