import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReplyMasking } from './entities/reply-masking.entity';
import { CacheService } from 'src/cache/cache.service';
import { ProtectionUtil } from 'src/common/utils/protection.util';
import { CustomEnvService } from 'src/config/custom-env.service';
import { REFRESH_TOKEN_TTL } from 'src/common/utils/policy';

@Injectable()
export class ReplyEmailsService {
  private readonly logger = new Logger(ReplyEmailsService.name);

  constructor(
    @InjectRepository(ReplyMasking)
    private readonly replyMasingRepository: Repository<ReplyMasking>,
    private readonly protectionUtil: ProtectionUtil,
    private readonly cacheService: CacheService,
    private readonly customEnvService: CustomEnvService,
  ) {}

  async findReplyMaskingEmail(sender: string, receiver?: string): Promise<ReplyMasking | null> {
    const replyAddress = receiver
      ? this.generateReplyMaskingEmail(sender, receiver)
      : sender;
    return await this.replyMasingRepository.findOne({
      where: { replyAddress },
    });
  }

  async create(sender: string, receiver: string): Promise<ReplyMasking> {
    // check if its existing
    const existing = await this.findReplyMaskingEmail(sender, receiver).catch((err) => {
      this.logger.debug(`failed to find reply masking email, by ${err.message}`, err.stack);
      return null;
    });

    if (existing) {
      return existing;
    }

    // create
    const replyAddress = this.generateReplyMaskingEmail(sender, receiver);
    const entity = this.replyMasingRepository.create({
      replyAddress,
      senderAddress: this.protectionUtil.encrypt(sender),
      senderAddressHash: this.protectionUtil.hash(sender),
      receiverAddress: this.protectionUtil.encrypt(receiver),
      receiverAddressHash: this.protectionUtil.hash(receiver),
    });
    this.logger.log('created reply email address');

    // store cache
    await this.cacheService
      .set(
        replyAddress,
        {
          sender,
          receiver,
        },
        REFRESH_TOKEN_TTL, // 7 days
      )
      .catch((err) => {
        this.logger.debug(`failed to set cache reply email address, by ${err.message}`);
      });

    return this.replyMasingRepository.save(entity);
  }

  private generateReplyMaskingEmail(sender: string, receiver: string): string {
    const domain = this.customEnvService.get<string>('APP_DOMAIN') || 'private-mailhub.com';
    return 'reply-'.concat(this.protectionUtil.hash(`${sender}:${receiver}`)).concat(`@${domain}`);
  }
}
