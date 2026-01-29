import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { productsSeed } from './data/products.seed';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async seedProducts() {
    await this.productRepository.query(
      'TRUNCATE TABLE products RESTART IDENTITY CASCADE',
    );
    await this.productRepository.save(productsSeed);
    return { inserted: productsSeed.length };
  }
}
