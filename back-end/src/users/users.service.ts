import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { SubscriptionTier } from '../common/enums/subscription-tier.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(id: bigint): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { username },
    });
  }

  async existsByUsername(username: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { username },
    });
    return !!user;
  }

  async createEmailUser(username: string): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findByUsername(username);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const user = this.userRepository.create({
      username,
      subscriptionTier: SubscriptionTier.FREE,
    });

    return await this.userRepository.save(user);
  }

  async updateUser(username: string, properties: Partial<User>): Promise<void> {
    const user = await this.findByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    } else {
      Object.assign(user, properties);
      await this.userRepository.save(user);
    }
  }

  async deleteUser(userId: bigint): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete (TypeORM will handle this automatically)
    await this.userRepository.softRemove(user);
  }

  async updateSubscriptionTier(
    userId: bigint,
    tier: SubscriptionTier,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.subscriptionTier = tier;
    return await this.userRepository.save(user);
  }
}
