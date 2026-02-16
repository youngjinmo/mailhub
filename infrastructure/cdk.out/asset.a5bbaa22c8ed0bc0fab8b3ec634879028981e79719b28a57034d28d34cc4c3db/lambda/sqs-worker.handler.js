"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shutdown = exports.handler = void 0;
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const relay_emails_service_1 = require("../relay-emails/relay-emails.service");
const common_1 = require("@nestjs/common");
let app;
const logger = new common_1.Logger('LambdaSQSWorkerHandler');
const handler = async (event) => {
    const startTime = Date.now();
    logger.log(`Received ${event.Records.length} SQS messages`);
    try {
        if (!app) {
            logger.log('Initializing NestJS application context...');
            app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
                logger: ['error', 'warn', 'log'],
            });
            logger.log('NestJS application context initialized');
        }
        const relayEmailsService = app.get(relay_emails_service_1.RelayEmailsService);
        const results = await Promise.allSettled(event.Records.map((record) => processSQSRecord(record, relayEmailsService)));
        const succeeded = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;
        const elapsed = Date.now() - startTime;
        logger.log(`Batch processing completed: ${succeeded} succeeded, ${failed} failed in ${elapsed}ms`);
        const batchItemFailures = event.Records.filter((_, index) => {
            return results[index].status === 'rejected';
        }).map((record) => ({
            itemIdentifier: record.messageId,
        }));
        if (batchItemFailures.length > 0) {
            logger.warn(`${batchItemFailures.length} messages failed and will be retried`);
        }
        return {
            batchItemFailures,
        };
    }
    catch (error) {
        const elapsed = Date.now() - startTime;
        logger.error(`Critical error in Lambda handler after ${elapsed}ms: ${error.message}`, error.stack);
        throw error;
    }
};
exports.handler = handler;
async function processSQSRecord(record, relayEmailsService) {
    const startTime = Date.now();
    try {
        logger.log(`Processing message ${record.messageId}`);
        const message = {
            MessageId: record.messageId,
            ReceiptHandle: record.receiptHandle,
            Body: record.body,
            Attributes: record.attributes,
            MessageAttributes: record.messageAttributes,
        };
        await relayEmailsService.processMessage(message);
        const elapsed = Date.now() - startTime;
        logger.log(`Successfully processed message ${record.messageId} in ${elapsed}ms`);
    }
    catch (error) {
        const elapsed = Date.now() - startTime;
        logger.error(`Failed to process message ${record.messageId} after ${elapsed}ms: ${error.message}`, error.stack);
        throw error;
    }
}
const shutdown = async () => {
    if (app) {
        logger.log('Closing NestJS application context...');
        await app.close();
        app = null;
    }
};
exports.shutdown = shutdown;
//# sourceMappingURL=sqs-worker.handler.js.map