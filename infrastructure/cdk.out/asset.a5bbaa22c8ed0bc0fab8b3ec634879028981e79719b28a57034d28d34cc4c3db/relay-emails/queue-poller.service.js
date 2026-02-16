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
var QueuePollerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuePollerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const relay_emails_service_1 = require("src/relay-emails/relay-emails.service");
let QueuePollerService = QueuePollerService_1 = class QueuePollerService {
    constructor(relayEmailService) {
        this.relayEmailService = relayEmailService;
        this.logger = new common_1.Logger(QueuePollerService_1.name);
        this.isProcessing = false;
        this.isWorkerMode = false;
    }
    onModuleInit() {
        this.isWorkerMode = process.env.WORKER_MODE === 'true';
        if (!this.isWorkerMode) {
            this.logger.warn('Queue polling is DISABLED - Not in worker mode');
            this.logger.warn('Set WORKER_MODE=true to enable polling');
            return;
        }
        this.logger.log('Queue Poller Service initialized');
        this.logger.log('Queue polling will run every 30 seconds');
    }
    async pollSQS() {
        if (!this.isWorkerMode) {
            return;
        }
        if (this.isProcessing) {
            this.logger.debug('Previous poll is still processing, skipping...');
            return;
        }
        this.isProcessing = true;
        try {
            await this.relayEmailService.processIncomingEmails();
        }
        catch (error) {
            this.logger.error(`Failed to poll SQS: ${error.message}`, error.stack);
        }
        finally {
            this.isProcessing = false;
        }
    }
};
exports.QueuePollerService = QueuePollerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QueuePollerService.prototype, "pollSQS", null);
exports.QueuePollerService = QueuePollerService = QueuePollerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [relay_emails_service_1.RelayEmailsService])
], QueuePollerService);
//# sourceMappingURL=queue-poller.service.js.map