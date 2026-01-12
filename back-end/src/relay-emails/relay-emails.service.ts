import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../cache/cache.service';
import { RelayEmail } from './entities/relay-email.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class RelayEmailsService {
  constructor(
    @InjectRepository(RelayEmail)
    private relayEmailRepository: Repository<RelayEmail>,
    private cacheService: CacheService,
  ) {}

  async generateRelayEmailAddress(
    userId: bigint,
    primaryEmail: string,
  ): Promise<RelayEmail> {
    // Generate a unique relay address
    let relayAddress: string = '';
    let exists = true;

    while (exists) {
      const randomString = randomBytes(8).toString('hex');
      relayAddress = `${randomString}@private-mailhub.com`;

      // Check if this relay address already exists
      const existing = await this.relayEmailRepository.findOne({
        where: { relayAddress },
      });

      exists = !!existing;
    }

    // Create the relay email record
    const relayEmail = this.relayEmailRepository.create({
      userId,
      primaryEmail,
      relayAddress,
    });

    const savedRelayEmail = await this.relayEmailRepository.save(relayEmail);

    // Cache the mapping
    await this.cacheService.storeRelayEmailMapping(
      relayAddress,
      primaryEmail,
    );

    return savedRelayEmail;
  }

  async findPrimaryEmailByRelayEmail(
    relayAddress: string,
  ): Promise<string | null> {
    // Try cache first
    const cachedEmail =
      await this.cacheService.getPrimaryEmailByRelayEmail(relayAddress);

    if (cachedEmail) {
      return cachedEmail;
    }

    // If not in cache, query database
    const relayEmail = await this.relayEmailRepository.findOne({
      where: { relayAddress },
    });

    if (!relayEmail) {
      return null;
    }

    // Cache for future requests
    await this.cacheService.storeRelayEmailMapping(
      relayAddress,
      relayEmail.primaryEmail,
    );

    return relayEmail.primaryEmail;
  }

  async findRelayEmailWithUserId(
    relayAddress: string,
  ): Promise<RelayEmail | null> {
    return await this.relayEmailRepository.findOne({
      where: { relayAddress },
    });
  }

  async findByUser(userId: bigint): Promise<RelayEmail[]> {
    return await this.relayEmailRepository.find({
      where: { userId },
    });
  }

  async findById(id: bigint, userId: bigint): Promise<RelayEmail | null> {
    return await this.relayEmailRepository.findOne({
      where: { id, userId },
    });
  }

  async deleteRelayEmail(id: bigint, userId: bigint): Promise<void> {
    const relayEmail = await this.findById(id, userId);

    if (!relayEmail) {
      throw new NotFoundException('Relay email not found');
    }

    // Delete from database (soft delete via TypeORM)
    await this.relayEmailRepository.softRemove(relayEmail);

    // Remove from cache
    await this.cacheService.deleteRelayEmailMapping(relayEmail.relayAddress);
  }

  async incrementForwardCount(relayAddress: string): Promise<void> {
    await this.relayEmailRepository.increment(
      { relayAddress },
      'forwardCount',
      1,
    );

    await this.relayEmailRepository.update(
      { relayAddress },
      { lastForwardedAt: new Date() },
    );
  }
}
