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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var MailgunService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailgunService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer_1 = require("nodemailer");
const form_data_1 = __importDefault(require("form-data"));
const custom_env_service_1 = require("../config/custom-env.service");
let MailgunService = MailgunService_1 = class MailgunService {
    constructor(customEnvService) {
        this.customEnvService = customEnvService;
        this.logger = new common_1.Logger(MailgunService_1.name);
        this.domain = this.customEnvService.get('APP_DOMAIN');
        this.apiKey = this.customEnvService.get('MAILGUN_API_KEY');
        this.baseUrl = this.customEnvService.get('MAILGUN_BASE_URL');
    }
    async sendEmail(dto) {
        try {
            if (dto.attachments && dto.attachments.length > 0) {
                const mailOptions = {
                    from: dto.from,
                    to: dto.to,
                    subject: dto.subject,
                    headers: {},
                };
                if (dto.resentFrom) {
                    mailOptions.headers['Resent-From'] = dto.resentFrom;
                }
                if (dto.replyTo) {
                    mailOptions.headers['Reply-To'] = dto.replyTo;
                }
                if (dto.htmlBody) {
                    mailOptions.html = dto.htmlBody;
                }
                if (dto.textBody) {
                    mailOptions.text = dto.textBody;
                }
                mailOptions.attachments = dto.attachments.map((att) => ({
                    filename: att.filename,
                    content: att.content,
                    contentType: att.contentType,
                    contentDisposition: att.contentDisposition,
                    cid: att.cid,
                }));
                const transporter = (0, nodemailer_1.createTransport)({
                    streamTransport: true,
                });
                const info = await transporter.sendMail(mailOptions);
                let rawMessage;
                if (Buffer.isBuffer(info.message)) {
                    rawMessage = info.message;
                }
                else {
                    rawMessage = await this.streamToBuffer(info.message);
                }
                const formData = new form_data_1.default();
                formData.append('to', dto.to);
                formData.append('message', rawMessage, {
                    filename: 'message.mime',
                    contentType: 'message/rfc2822',
                });
                const response = await fetch(`${this.baseUrl}/v3/${this.domain}/messages.mime`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`,
                        ...formData.getHeaders(),
                    },
                    body: new Uint8Array(formData.getBuffer()),
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    this.logger.error(`Mailgun MIME API error: ${response.status} - ${errorText}`);
                    if (response.status === 401 || response.status === 403) {
                        throw new common_1.BadRequestException('Email domain not supported');
                    }
                    throw new Error(`Mailgun API error: ${response.status}`);
                }
                const result = (await response.json());
                this.logger.log(`Email with attachments sent successfully, mailgun messageId=${result.id}`);
                return;
            }
            const params = new URLSearchParams();
            params.append('from', dto.from);
            params.append('to', dto.to);
            params.append('subject', dto.subject);
            if (dto.resentFrom) {
                params.append('h:Resent-From', dto.resentFrom);
            }
            if (dto.replyTo) {
                params.append('h:Reply-To', dto.replyTo);
            }
            if (dto.htmlBody) {
                params.append('html', dto.htmlBody);
            }
            if (dto.textBody) {
                params.append('text', dto.textBody);
            }
            if (!dto.htmlBody && !dto.textBody && dto.body) {
                params.append('text', dto.body);
            }
            const response = await fetch(`${this.baseUrl}/v3/${this.domain}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`Mailgun API error: ${response.status} - ${errorText}`);
                if (response.status === 401 || response.status === 403) {
                    throw new common_1.BadRequestException('Email domain not supported');
                }
                throw new Error(`Mailgun API error: ${response.status}`);
            }
            const result = (await response.json());
            this.logger.log(`Email sent successfully, messageId=${result.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to send email, error=%o`, error);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw error;
        }
    }
    streamToBuffer(stream) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });
    }
};
exports.MailgunService = MailgunService;
exports.MailgunService = MailgunService = MailgunService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [custom_env_service_1.CustomEnvService])
], MailgunService);
//# sourceMappingURL=mailgun.service.js.map