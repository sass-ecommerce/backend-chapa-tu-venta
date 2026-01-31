import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RawProductData } from './interface/raw-product-data.interface';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save(product);
      console.log('Created product: ', product);
      return product;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = null, offset = 0, storeSlug } = paginationDto;

    try {
      const rawProducts = (await this.productRepository.query(
        'SELECT * FROM b2b.fn_get_products($1, $2, $3)',
        [storeSlug, limit, offset],
      )) as RawProductData[];

      // Transformar de snake_case a camelCase
      const products = rawProducts.map((raw) => ({
        id: raw.id,
        slug: raw.slug,
        storeId: raw.store_id,
        sku: raw.sku,
        name: raw.name,
        description: raw.description,
        price: raw.price,
        stockQuantity: raw.stock_quantity,
        isActive: raw.is_active,
        priceList: raw.price_list,
        priceBase: raw.price_base,
        imageUri: raw.image_uri,
        trending: raw.trending,
        rating: raw.rating,
        status: raw.status,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
      }));

      return products;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findOne(slug: string) {
    const product = await this.productRepository.findOneBy({ slug });
    if (!product)
      throw new NotFoundException(`Product with slug ${slug} not found`);

    return product;
  }

  // update(id: number, updateProductDto: UpdateProductDto) {
  //   return `This action updates a #${id} product`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} product`;
  // }

  private handleDBExceptions(error: any) {
    if (error?.code === '23505') throw new BadRequestException(error.detail);
    console.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
