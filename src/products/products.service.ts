import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { Store } from 'src/stores/entities/store.entity';
import { User } from 'src/users/entities/user.entity';
import {
  ProductNotFoundException,
  InvalidProductDataException,
} from './exceptions/product.exceptions';
import { StoreNotFoundException } from 'src/stores/exceptions/store.exceptions';
import { UserNotFoundException } from 'src/users/exceptions/user.exceptions';

@Injectable()
export class ProductsService {
  protected readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createProductDto: CreateProductDto, user: AuthenticatedUser) {
    //?validaciones
    const store = await this.storeRepository.findOneBy({
      id: createProductDto.storeId,
    });
    if (!store)
      throw new StoreNotFoundException(createProductDto.storeId.toString());
    // Verificar permisos usando publicMetadata
    const userStoreSlug =
      user.publicMetadata?.storeSlug || user.publicMetadata?.store?.slug;
    if (store.slug !== userStoreSlug) {
      throw new InvalidProductDataException(
        `You do not have permission to create products for this store`,
      );
    }

    if (!store.status) {
      throw new InvalidProductDataException(
        `Cannot create products for an inactive store`,
      );
    }

    const userEntity = await this.userRepository.findOneBy({
      id: user.userId,
    });
    if (!userEntity) throw new UserNotFoundException(user.userId);

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

      return { slug: productResult.data.slug };
    } catch (error) {
      this.logger.error('Error creating product:', error);
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0, storeSlug } = paginationDto;

    const store = await this.storeRepository.findOne({
      where: { slug: storeSlug, status: true },
    });
    if (!store) {
      throw new StoreNotFoundException(storeSlug);
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
    if (!product) throw new ProductNotFoundException(slug);

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
}
