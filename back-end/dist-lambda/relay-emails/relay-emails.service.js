"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RelayEmailsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayEmailsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const mailparser_1 = require("mailparser");
const cache_service_1 = require("../cache/cache.service");
const relay_email_entity_1 = require("./entities/relay-email.entity");
const s3_service_1 = require("src/aws/s3/s3.service");
const sqs_service_1 = require("src/aws/sqs/sqs.service");
const send_mail_service_1 = require("src/mail/send-mail.service");
const custom_env_service_1 = require("src/config/custom-env.service");
const protection_util_1 = require("src/common/utils/protection.util");
const relay_email_util_1 = require("src/common/utils/relay-email.util");
const subscription_tier_enum_1 = require("src/common/enums/subscription-tier.enum");
const user_enums_1 = require("src/users/user.enums");
let RelayEmailsService = RelayEmailsService_1 = class RelayEmailsService {
    constructor(relayEmailRepository, customEnvService, s3Service, sqsService, sendMailService, cacheService, encryptionUtil) {
        this.relayEmailRepository = relayEmailRepository;
        this.customEnvService = customEnvService;
        this.s3Service = s3Service;
        this.sqsService = sqsService;
        this.sendMailService = sendMailService;
        this.cacheService = cacheService;
        this.encryptionUtil = encryptionUtil;
        this.logger = new common_1.Logger(RelayEmailsService_1.name);
        this.FREE_LIMIT = 20;
    }
    async generateRelayEmailAddress(user) {
        if (user.subscriptionTier === subscription_tier_enum_1.SubscriptionTier.FREE) {
            const count = await this.countByUser(user.id);
            if (count >= this.FREE_LIMIT) {
                throw new common_1.ForbiddenException(`FREE tier users can only create up to ${this.FREE_LIMIT}relay emails`);
            }
        }
        let relayEmail = '';
        let exists = true;
        while (exists) {
            const randomUsername = (0, relay_email_util_1.generateRandomRelayUsername)(16);
            relayEmail = `${randomUsername}@${this.customEnvService.get('APP_DOMAIN')}`;
            const existing = await this.relayEmailRepository.findOne({
                where: { relayEmail },
            });
            exists = !!existing;
        }
        const relayEmailEntity = this.relayEmailRepository.create({
            userId: user.id,
            primaryEmail: user.username,
            relayEmail,
        });
        const savedRelayEmail = await this.relayEmailRepository.save(relayEmailEntity);
        await this.cacheService.setRelayMailCache({
            encryptedPrimaryEmail: user.username,
            relayEmail,
        });
        return savedRelayEmail;
    }
    async generateCustomRelayEmailAddress(user, customUsername) {
        if (!this.hasPermissionToCreateCutomRelayEmail(user)) {
            throw new common_1.ForbiddenException('User can not create custom email address');
        }
        const customRelayEmail = `${customUsername}@${this.customEnvService.get('APP_DOMAIN')}`;
        const existing = await this.relayEmailRepository.findOne({
            where: { relayEmail: customRelayEmail },
        });
        if (existing) {
            throw new common_1.BadRequestException('Duplicated email address');
        }
        const relayEmail = this.relayEmailRepository.create({
            userId: user.id,
            primaryEmail: user.username,
            relayEmail: customRelayEmail,
        });
        const savedRelayEmail = await this.relayEmailRepository.save(relayEmail);
        await this.cacheService.setRelayMailCache({
            encryptedPrimaryEmail: user.username,
            relayEmail: customRelayEmail,
        });
        return savedRelayEmail;
    }
    async findPrimaryEmailByRelayEmail(relayEmail) {
        const cachedEncryptedEmail = await this.cacheService.findPrimaryMailFromCache(relayEmail);
        if (cachedEncryptedEmail) {
            return this.encryptionUtil.decrypt(cachedEncryptedEmail);
        }
        const relayEmailEntity = await this.relayEmailRepository.findOne({
            where: { relayEmail },
        });
        if (!relayEmailEntity) {
            return null;
        }
        await this.cacheService.setRelayMailCache({
            relayEmail,
            encryptedPrimaryEmail: relayEmailEntity.primaryEmail,
        });
        return this.encryptionUtil.decrypt(relayEmailEntity.primaryEmail);
    }
    async processIncomingEmails() {
        const startTime = Date.now();
        try {
            const messages = await this.sqsService.receiveMessages(10);
            if (messages.length === 0) {
                return;
            }
            this.logger.log(`Processing ${messages.length} SQS messages in parallel`);
            const results = await Promise.allSettled(messages.map(async (message) => {
                const messageStartTime = Date.now();
                try {
                    await this.processMessage(message);
                    if (message.ReceiptHandle) {
                        await this.sqsService.deleteMessage(message.ReceiptHandle);
                    }
                    const messageElapsed = Date.now() - messageStartTime;
                    this.logger.log(`Successfully processed message ${message.MessageId} in ${messageElapsed}ms`);
                    return {
                        success: true,
                        messageId: message.MessageId,
                        elapsed: messageElapsed,
                    };
                }
                catch (error) {
                    const messageElapsed = Date.now() - messageStartTime;
                    this.logger.error(`Failed to process message ${message.MessageId} after ${messageElapsed}ms: ${error.message}`, error.stack);
                    throw error;
                }
            }));
            const succeeded = results.filter((r) => r.status === 'fulfilled').length;
            const failed = results.filter((r) => r.status === 'rejected').length;
            const totalElapsed = Date.now() - startTime;
            this.logger.log(`Batch processing completed: ${succeeded} succeeded, ${failed} failed in ${totalElapsed}ms`);
        }
        catch (error) {
            const totalElapsed = Date.now() - startTime;
            this.logger.error(`Failed to process incoming emails after ${totalElapsed}ms: ${error.message}`, error.stack);
        }
    }
    hasPermissionToCreateCutomRelayEmail(user) {
        return (user.subscriptionTier === subscription_tier_enum_1.SubscriptionTier.PRO ||
            user.role === user_enums_1.UserRole.ADMIN);
    }
    async processMessage(message) {
        const s3Event = this.sqsService.parseS3Event(message);
        if (!s3Event || !s3Event.Records || s3Event.Records.length === 0) {
            this.logger.warn('No S3 event records found in message');
            return;
        }
        this.logger.log(`Processing ${s3Event.Records.length} S3 records in parallel`);
        await Promise.all(s3Event.Records.map((record) => this.processS3Record(record)));
    }
    async processS3Record(record) {
        const startTime = Date.now();
        try {
            const bucket = record.s3.bucket.name;
            const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
            this.logger.log(`Processing S3 record: s3://${bucket}/${key}`);
            const s3StartTime = Date.now();
            const emailBuffer = await this.s3Service.getObject(bucket, key);
            const s3Elapsed = Date.now() - s3StartTime;
            const parseStartTime = Date.now();
            const parsedMail = await (0, mailparser_1.simpleParser)(emailBuffer);
            const parseElapsed = Date.now() - parseStartTime;
            const relayEmail = this.getOriginalRecipient(parsedMail);
            if (!relayEmail) {
                this.logger.warn('No recipient address found in email');
                return;
            }
            const dbStartTime = Date.now();
            const relayEmailEntity = await this.relayEmailRepository.findOne({
                where: { relayEmail },
            });
            const dbElapsed = Date.now() - dbStartTime;
            if (!relayEmailEntity) {
                this.logger.warn(`No relay email entity found for address: ${relayEmail}`);
                return;
            }
            if (!relayEmailEntity.isActive) {
                this.logger.log(`Relay email is not active, skipping forward: ${relayEmail}`);
                return;
            }
            const primaryEmail = this.encryptionUtil.decrypt(relayEmailEntity.primaryEmail);
            const forwardStartTime = Date.now();
            await this.forwardEmail(primaryEmail, relayEmail, parsedMail);
            const forwardElapsed = Date.now() - forwardStartTime;
            const totalElapsed = Date.now() - startTime;
            this.logger.log(`S3 record processed in ${totalElapsed}ms (S3: ${s3Elapsed}ms, Parse: ${parseElapsed}ms, DB: ${dbElapsed}ms, Forward: ${forwardElapsed}ms) - ${key}`);
        }
        catch (error) {
            const totalElapsed = Date.now() - startTime;
            this.logger.error(`Failed to process S3 record after ${totalElapsed}ms: ${error.message}`, error.stack);
            throw error;
        }
    }
    async forwardEmail(primaryEmailAddress, relayEmailAddress, mail) {
        try {
            const subject = mail?.subject || '(No Subject)';
            const originalSenderAddress = this.getSender(mail);
            if (!originalSenderAddress) {
                throw new common_1.BadRequestException('Sender address not found');
            }
            const from = `${originalSenderAddress} [via Mailhub] <${relayEmailAddress}>`;
            const appName = this.customEnvService.get('APP_NAME') || 'Mailhub';
            const appDomain = this.customEnvService.get('APP_DOMAIN') ||
                'private-mailhub.com';
            const htmlHeader = `
        <div style="max-width: 100%; margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 1px; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);">
            <div style="background-color: #ffffff; border-radius: 7px; padding: 12px 16px;">
              <!-- From and To info -->
              <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
                <div style="display: inline-flex; align-items: center; background: linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%); padding: 4px 10px; border-radius: 6px; font-size: 12px;">
                  <span style="color: #667eea; margin-right: 4px;">▸</span>
                  <span style="color: #4a5568; font-weight: 600;">From:</span>
                  <span style="color: #2d3748; margin-left: 6px; font-weight: 500;">${this.escapeHtml(originalSenderAddress)}</span>
                </div>
                <div style="display: inline-flex; align-items: center; background: linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%); padding: 4px 10px; border-radius: 6px; font-size: 12px;">
                  <span style="color: #667eea; margin-right: 4px;">▸</span>
                  <span style="color: #4a5568; font-weight: 600;">To:</span>
                  <span style="color: #2d3748; margin-left: 6px; font-weight: 500;">${this.escapeHtml(relayEmailAddress || '')}</span>
                </div>
              </div>

              <!-- Footer with link -->
              <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid #e2e8f0;">
                <div style="font-size: 11px; color: #a0aec0;">
                  <span style="opacity: 0.7;">🔒 forwarded by</span>
                  <a href="https://${appDomain}" style="color: #667eea; text-decoration: none; font-weight: 600; margin-left: 4px; transition: color 0.2s;" target="_blank">${appName}</a>
                </div>
                <div style="font-size: 10px; color: #cbd5e0; letter-spacing: 0.5px;">
                  ✓ SECURED
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
            let htmlBody;
            if (mail?.html) {
                htmlBody = htmlHeader + mail.html;
            }
            else if (mail?.text) {
                htmlBody =
                    htmlHeader +
                        `<pre style="white-space: pre-wrap; font-family: inherit;">${this.escapeHtml(mail.text)}</pre>`;
            }
            else {
                htmlBody = htmlHeader + '<p>(No content)</p>';
            }
            const attachments = this.parseAttachments(mail);
            if (attachments.length > 0) {
                this.logger.log(`Forwarding email with ${attachments.length} attachment(s)`);
            }
            await this.sendMailService.sendMail({
                to: primaryEmailAddress,
                from,
                resentFrom: relayEmailAddress,
                replyTo: originalSenderAddress,
                subject,
                htmlBody,
                attachments: attachments.length > 0 ? attachments : undefined,
            });
            await this.incrementForwardCount(relayEmailAddress);
        }
        catch (error) {
            const fromAddress = mail?.from?.text ?? 'unknown';
            this.logger.error(`Failed to forward email to ${primaryEmailAddress} from ${fromAddress}, error=${error.message}`, error.stack);
            return;
        }
    }
    escapeHtml(text) {
        const htmlEscapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };
        return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);
    }
    parseAttachments(mail) {
        try {
            if (!mail.attachments || mail.attachments.length === 0) {
                return [];
            }
            return mail.attachments.map((attachment) => ({
                filename: attachment.filename || 'unnamed',
                content: attachment.content,
                contentType: attachment.contentType,
                contentDisposition: attachment.contentDisposition,
                cid: attachment.cid,
            }));
        }
        catch (error) {
            this.logger.error(`Failed to parse attachments: ${error.message}`, error.stack);
            return [];
        }
    }
    async findRelayEmailWithUserId(relayEmail) {
        return await this.relayEmailRepository.findOne({
            where: { relayEmail },
        });
    }
    async findByUser(userId) {
        return await this.relayEmailRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
    async findById(id, userId) {
        return await this.relayEmailRepository.findOne({
            where: { id, userId },
        });
    }
    async deleteRelayEmail(id, userId) {
        const relayEmailEntity = await this.findById(id, userId);
        if (!relayEmailEntity) {
            throw new common_1.NotFoundException('Relay email not found');
        }
        await this.relayEmailRepository.softRemove(relayEmailEntity);
        await this.cacheService.deleteRelayMailMappingCache(relayEmailEntity.relayEmail);
    }
    async incrementForwardCount(relayEmail) {
        await this.relayEmailRepository
            .createQueryBuilder()
            .update(relay_email_entity_1.RelayEmail)
            .set({
            forwardCount: () => 'forward_count + 1',
            lastForwardedAt: new Date(),
        })
            .where('relay_email = :relayEmail', { relayEmail })
            .execute();
    }
    async countByUser(userId) {
        return await this.relayEmailRepository.count({
            where: { userId },
        });
    }
    async updateDescription(id, userId, description) {
        const relayEmail = await this.findById(id, userId);
        if (!relayEmail) {
            throw new common_1.NotFoundException('Relay email not found');
        }
        relayEmail.description = description;
        return await this.relayEmailRepository.save(relayEmail);
    }
    async updateActiveStatus(id, userId, isActive) {
        const relayEmailEntity = await this.findById(id, userId);
        if (!relayEmailEntity) {
            throw new common_1.NotFoundException('Relay email not found');
        }
        const cached = await this.cacheService.findPrimaryMailFromCache(relayEmailEntity.relayEmail);
        if (!!cached && !isActive) {
            await this.cacheService.deleteRelayMailMappingCache(relayEmailEntity.relayEmail);
        }
        else if (!cached && isActive) {
            await this.cacheService.setRelayMailCache({
                relayEmail: relayEmailEntity.relayEmail,
                encryptedPrimaryEmail: relayEmailEntity.primaryEmail,
            });
        }
        relayEmailEntity.isActive = isActive;
        return await this.relayEmailRepository.save(relayEmailEntity);
    }
    getSender(mail) {
        try {
            if (mail.from?.value &&
                Array.isArray(mail.from.value) &&
                mail.from.value.length > 0) {
                const senderAddress = mail.from.value[0]?.address;
                if (senderAddress) {
                    return senderAddress;
                }
            }
            const returnPath = mail.headers.get('return-path');
            if (returnPath) {
                const returnPathValue = typeof returnPath === 'string'
                    ? returnPath
                    : JSON.stringify(returnPath);
                const emailMatch = returnPathValue.match(/<(.+?)>|([^\s<>]+@[^\s<>]+)/);
                if (emailMatch) {
                    return emailMatch[1] || emailMatch[2];
                }
            }
            this.logger.error(mail, 'Failed to parse sender address found in email');
            throw new common_1.InternalServerErrorException('Failed to parse sender from mail');
        }
        catch (error) {
            this.logger.error(`Failed to parse sender from email: ${error.message}`, error.stack);
            throw error;
        }
    }
    getOriginalRecipient(mail) {
        try {
            const addressObject = mail.to;
            if (!addressObject) {
                this.logger.warn('No recipient address object found in email');
                throw new common_1.InternalServerErrorException('Failed to parse mail recipient');
            }
            const addressArray = Array.isArray(addressObject)
                ? addressObject
                : [addressObject];
            for (const addr of addressArray) {
                if (addr?.value && Array.isArray(addr.value) && addr.value.length > 0) {
                    const recipientAddress = addr.value[0]?.address;
                    if (recipientAddress) {
                        return recipientAddress;
                    }
                }
            }
            this.logger.warn('No valid recipient address found in email');
            throw new common_1.InternalServerErrorException('Failed to parse mail recipient');
        }
        catch (error) {
            this.logger.error(`Failed to parse recipient from email: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.RelayEmailsService = RelayEmailsService;
exports.RelayEmailsService = RelayEmailsService = RelayEmailsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(relay_email_entity_1.RelayEmail)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        custom_env_service_1.CustomEnvService,
        s3_service_1.S3Service,
        sqs_service_1.SqsService,
        send_mail_service_1.SendMailService,
        cache_service_1.CacheService,
        protection_util_1.ProtectionUtil])
], RelayEmailsService);
//# sourceMappingURL=relay-emails.service.js.map