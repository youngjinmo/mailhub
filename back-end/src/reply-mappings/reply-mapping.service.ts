import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ReplyMapping } from './entities/reply-mapping.entity';
import { ProtectionUtil } from 'src/common/utils/protection.util';
import { CacheService } from 'src/cache/cache.service';
import { CustomEnvService } from 'src/config/custom-env.service';

@Injectable()
export class ReplyMappingService {
  private readonly logger = new Logger(ReplyMappingService.name);

  constructor(
    @InjectRepository(ReplyMapping)
    private readonly replyMappingRepository: Repository<ReplyMapping>,
    private readonly encryptionUtil: ProtectionUtil,
    private readonly cacheService: CacheService,
    private readonly customEnvService: CustomEnvService,
  ) {}

  async findOrCreateReplyAddress(
    relayEmailId: bigint,
    originalSender: string,
    userId: bigint,
  ): Promise<string> {
    const appDomain = this.customEnvService.get<string>('APP_DOMAIN');
    const originalSenderHash = this.encryptionUtil.hash(originalSender);

    // Check if mapping already exists
    const existing = await this.replyMappingRepository.findOne({
      where: { relayEmailId, originalSenderHash },
    });

    if (existing) {
      return `${existing.replyAddress}@${appDomain}`;
    }

    // Create new mapping
    const replyLocalPart = this.generateReplyLocalPart();
    const originalSenderEncrypted = this.encryptionUtil.encrypt(originalSender);

    const replyMapping = this.replyMappingRepository.create({
      replyAddress: replyLocalPart,
      relayEmailId,
      originalSenderEncrypted,
      originalSenderHash,
      userId,
    });

    await this.replyMappingRepository.save(replyMapping);

    this.logger.log(
      `Created new reply mapping: ${replyLocalPart} for relay email ${relayEmailId}`,
    );

    return `${replyLocalPart}@${appDomain}`;
  }

  async resolveReplyMapping(
    replyLocalPart: string,
  ): Promise<{ originalSender: string; relayEmailAddress: string } | null> {
    // Try cache first
    const cached = await this.cacheService.getReplyMappingCache(replyLocalPart);

    if (cached) {
      return cached;
    }

    // Query DB with relay email relation
    const mapping = await this.replyMappingRepository.findOne({
      where: { replyAddress: replyLocalPart },
      relations: ['relayEmail'],
    });

    if (!mapping) {
      return null;
    }

    const originalSender = this.encryptionUtil.decrypt(
      mapping.originalSenderEncrypted,
    );
    const relayEmailAddress = mapping.relayEmail.relayEmail;

    // Cache for future lookups (24h TTL)
    await this.cacheService.setReplyMappingCache(
      replyLocalPart,
      originalSender,
      relayEmailAddress,
    );

    return { originalSender, relayEmailAddress };
  }

  async updateLastUsedAt(replyLocalPart: string): Promise<void> {
    await this.replyMappingRepository
      .createQueryBuilder()
      .update(ReplyMapping)
      .set({ lastUsedAt: new Date() })
      .where('reply_address = :replyLocalPart', { replyLocalPart })
      .execute();
  }

  private generateReplyLocalPart(): string {
    return `reply-${crypto.randomBytes(6).toString('hex')}`;
  }
}
