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
var SqsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqsService = void 0;
const common_1 = require("@nestjs/common");
const client_sqs_1 = require("@aws-sdk/client-sqs");
const custom_env_service_1 = require("../../config/custom-env.service");
let SqsService = SqsService_1 = class SqsService {
    constructor(customEnvService) {
        this.customEnvService = customEnvService;
        this.logger = new common_1.Logger(SqsService_1.name);
        const accessKeyId = this.customEnvService.get('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.customEnvService.get('AWS_SECRET_ACCESS_KEY');
        const region = this.customEnvService.get('AWS_REGION');
        this.sqsClient = new client_sqs_1.SQSClient({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
        this.queueUrl = this.customEnvService.get('AWS_SQS_QUEUE_URL');
    }
    async receiveMessages(maxMessages = 10) {
        try {
            const command = new client_sqs_1.ReceiveMessageCommand({
                QueueUrl: this.queueUrl,
                MaxNumberOfMessages: maxMessages,
                WaitTimeSeconds: 20,
                VisibilityTimeout: 60,
                MessageAttributeNames: ['All'],
            });
            const response = await this.sqsClient.send(command);
            const messages = response.Messages || [];
            if (messages.length > 0) {
                this.logger.log(`Received ${messages.length} messages from SQS`);
            }
            return messages;
        }
        catch (error) {
            this.logger.error(`Failed to receive messages from SQS: ${error.message}`, error.stack);
            throw error;
        }
    }
    async deleteMessage(receiptHandle) {
        try {
            const command = new client_sqs_1.DeleteMessageCommand({
                QueueUrl: this.queueUrl,
                ReceiptHandle: receiptHandle,
            });
            await this.sqsClient.send(command);
            this.logger.log('Message deleted from SQS');
        }
        catch (error) {
            this.logger.error(`Failed to delete message from SQS: ${error.message}`, error.stack);
            throw error;
        }
    }
    parseS3Event(message) {
        try {
            if (!message.Body) {
                this.logger.warn('Message body is empty');
                return null;
            }
            const body = JSON.parse(message.Body);
            if (body.Records) {
                return body;
            }
            if (body.Message) {
                const s3Event = JSON.parse(body.Message);
                return s3Event;
            }
            this.logger.warn('Unable to parse S3 event from message');
            return null;
        }
        catch (error) {
            this.logger.error(`Failed to parse S3 event: ${error.message}`, error.stack);
            return null;
        }
    }
};
exports.SqsService = SqsService;
exports.SqsService = SqsService = SqsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [custom_env_service_1.CustomEnvService])
], SqsService);
//# sourceMappingURL=sqs.service.js.map