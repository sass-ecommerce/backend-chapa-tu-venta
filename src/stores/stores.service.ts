import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
  ) {}

  async create(createStoreDto: CreateStoreDto) {
    console.log(createStoreDto);
    try {
      const store = this.storesRepository.create(createStoreDto);
      return await this.storesRepository.save(store);
    } catch (error) {
      console.error('Error creating store:', error);
    }
  }

  async findAll() {
    return await this.storesRepository.find();
  }

  async findOne(id: string) {
    const store = await this.storesRepository.findOneBy({ slug: id });
    if (!store) throw new NotFoundException(`Store with ID ${id} not found`);
    return store;
  }

  // update(id: number, updateStoreDto: UpdateStoreDto) {
  //   return `This action updates a #${id} store`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} store`;
  // }
}
