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
var SesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SesService = void 0;
const common_1 = require("@nestjs/common");
const client_ses_1 = require("@aws-sdk/client-ses");
const custom_env_service_1 = require("../../config/custom-env.service");
const nodemailer_1 = require("nodemailer");
let SesService = SesService_1 = class SesService {
    constructor(customEnvService) {
        this.customEnvService = customEnvService;
        this.logger = new common_1.Logger(SesService_1.name);
        const region = this.customEnvService.get('AWS_REGION');
        const accessKeyId = this.customEnvService.get('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.customEnvService.get('AWS_SECRET_ACCESS_KEY');
        this.sesClient = new client_ses_1.SESClient({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }
    async sendEmail(dto) {
        try {
            if (dto.attachments && dto.attachments.length > 0) {
                await this.sendEmailWithAttachments(dto);
            }
            else {
                const sesCommand = this.generateCommand(dto);
                await this.sesClient.send(sesCommand);
            }
            this.logger.log(`email sent successfully`);
        }
        catch (error) {
            this.logger.error(`Failed to send email, error=%o`, error);
            if (error instanceof client_ses_1.MessageRejected) {
                throw new common_1.BadRequestException('Email domain not supported');
            }
            throw error;
        }
    }
    async sendEmailWithAttachments(dto) {
        const mailOptions = {
            from: dto.from,
            to: dto.to,
            subject: dto.subject,
        };
        if (dto.htmlBody) {
            mailOptions.html = dto.htmlBody;
        }
        if (dto.textBody) {
            mailOptions.text = dto.textBody;
        }
        if (!dto.htmlBody && !dto.textBody && dto.body) {
            mailOptions.html = dto.body;
        }
        if (dto.attachments && dto.attachments.length > 0) {
            mailOptions.attachments = dto.attachments.map((att) => ({
                filename: att.filename,
                content: att.content,
                contentType: att.contentType,
                contentDisposition: att.contentDisposition,
                cid: att.cid,
            }));
        }
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
        const sendRawEmailCommand = new client_ses_1.SendRawEmailCommand({
            RawMessage: {
                Data: rawMessage,
            },
        });
        await this.sesClient.send(sendRawEmailCommand);
    }
    streamToBuffer(stream) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });
    }
    generateCommand(dto) {
        const bodyConfig = {};
        if (dto.htmlBody) {
            bodyConfig.Html = {
                Data: dto.htmlBody,
                Charset: 'UTF-8',
            };
        }
        if (dto.textBody) {
            bodyConfig.Text = {
                Data: dto.textBody,
                Charset: 'UTF-8',
            };
        }
        if (!dto.htmlBody && !dto.textBody && dto.body) {
            bodyConfig.Html = {
                Data: dto.body,
                Charset: 'UTF-8',
            };
        }
        if (!bodyConfig.Html && !bodyConfig.Text) {
            throw new Error('Email must have at least one body type (HTML or Text)');
        }
        return new client_ses_1.SendEmailCommand({
            Source: dto.from,
            Destination: {
                ToAddresses: [dto.to],
            },
            Message: {
                Subject: {
                    Data: dto.subject,
                    Charset: 'UTF-8',
                },
                Body: bodyConfig,
            },
        });
    }
};
exports.SesService = SesService;
exports.SesService = SesService = SesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [custom_env_service_1.CustomEnvService])
], SesService);
//# sourceMappingURL=ses.service.js.map