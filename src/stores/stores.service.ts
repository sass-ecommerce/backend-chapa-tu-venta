import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { ClekService } from '../auth/clerk.service';
import { JwtPayload } from '@clerk/types';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    private readonly clerkService: ClekService,
  ) {}

  async create(createStoreDto: CreateStoreDto, user: JwtPayload) {
    // console.log(createStoreDto);
    const userEntity = await this.usersRepository.findOneBy({
      clerkId: user.sub,
    });
    if (!userEntity)
      throw new NotFoundException(`User with Clerk ID ${user.sub} not found`);

    try {
      const store = this.storesRepository.create(createStoreDto);
      const savedStore = await this.storesRepository.save(store);
      await this.clerkService.updateUserIdWithSlug(user.sub, savedStore.slug);
      console.log('Created store: ', savedStore);
      return savedStore;
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
