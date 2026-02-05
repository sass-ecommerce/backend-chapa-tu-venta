import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthenticatedUser } from 'src/auth/interfaces/clerk-user.interface';
import { Store } from 'src/stores/entities/store.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createProductDto: CreateProductDto, user: AuthenticatedUser) {
    //validaciones
    const store = await this.storeRepository.findOneBy({
      id: createProductDto.storeId,
    });
    if (!store)
      throw new BadRequestException(
        `Store with id ${createProductDto.storeId} not found`,
      );

    if (store.slug !== user.publicMetadata?.store?.slug) {
      throw new BadRequestException(
        `You do not have permission to create products for this store`,
      );
    }

    if (!store.status) {
      throw new BadRequestException(
        `Cannot create products for an inactive store`,
      );
    }

    const userEntity = await this.userRepository.findOneBy({
      clerkId: user.userId,
    });
    if (!userEntity)
      throw new NotFoundException(`User with id ${user.userId} not found`);

    const productResult: { data: Product | null } = {
      data: null,
    };
    productResult.data = await this.productRepository.findOneBy({
      sku: createProductDto.sku,
    });

    try {
      if (productResult.data) {
        // Actualizar el producto existente
        this.productRepository.merge(productResult.data, createProductDto);
        await this.productRepository.save(productResult.data);

        this.logger.log('Updated product: ', productResult.data);
      } else {
        productResult.data = await this.productRepository.save(
          this.productRepository.create(createProductDto),
        );
        this.logger.log('Created product: ', productResult.data);
      }

      return this.toProductResponse(productResult.data);
    } catch (error) {
      if (error.code === '23505')
        throw new ConflictException('SKU must be unique');

      this.logger.error(`Error upserting product: ${error.message}`);
      throw new InternalServerErrorException(
        'Unexpected error, check server logs',
      );
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0, storeSlug } = paginationDto;

    const store = await this.storeRepository.findOne({
      where: { slug: storeSlug, status: true },
    });
    if (!store) {
      throw new NotFoundException(`Store with slug ${storeSlug} not found`);
    }

    const products = await this.productRepository.find({
      where: { store: { slug: storeSlug } },
      take: limit,
      skip: offset,
    });
    return products.map((product) => this.toProductResponse(product));
  }

  async findOne(slug: string) {
    const product = await this.productRepository.findOneBy({ slug });
    if (!product)
      throw new NotFoundException(`Product with slug ${slug} not found`);

    return this.toProductResponse(product);
  }

  private toProductResponse(product: Product) {
    return {
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: product.price,
      stockQuantity: product.stockQuantity,
      isActive: product.isActive,
      priceList: product.priceList,
      imageUri: product.imageUri,
      trending: product.trending,
    };
  }

  // update(id: number, updateProductDto: UpdateProductDto) {
  //   return `This action updates a #${id} product`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} product`;
  // }
}
