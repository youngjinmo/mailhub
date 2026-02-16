import { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RelayEmailsService } from '../relay-emails/relay-emails.service';
import { Logger } from '@nestjs/common';
import { Message } from '@aws-sdk/client-sqs';

// Global variables to cache the NestJS app for warm starts
let app: any;
const logger = new Logger('LambdaSQSWorkerHandler');

/**
 * Lambda handler for processing SQS messages from email queue
 *
 * This function is triggered by SQS event source mapping
 * and processes incoming email notifications from S3
 */
export const handler: SQSHandler = async (event: SQSEvent) => {
  const startTime = Date.now();
  logger.log(`Received ${event.Records.length} SQS messages`);

  try {
    // Initialize NestJS application context (reused in warm starts)
    if (!app) {
      logger.log('Initializing NestJS application context...');
      app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn', 'log'],
      });
      logger.log('NestJS application context initialized');
    }

    // Get RelayEmailsService from DI container
    const relayEmailsService = app.get(RelayEmailsService);

    // Process all SQS records in parallel
    const results = await Promise.allSettled(
      event.Records.map((record) =>
        processSQSRecord(record, relayEmailsService),
      ),
    );

    // Analyze results
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    const elapsed = Date.now() - startTime;

    logger.log(
      `Batch processing completed: ${succeeded} succeeded, ${failed} failed in ${elapsed}ms`,
    );

    // Report batch item failures for partial batch failure handling
    // Failed messages will be retried by SQS
    const batchItemFailures = event.Records.filter((_, index) => {
      return results[index].status === 'rejected';
    }).map((record) => ({
      itemIdentifier: record.messageId,
    }));

    if (batchItemFailures.length > 0) {
      logger.warn(
        `${batchItemFailures.length} messages failed and will be retried`,
      );
    }

    return {
      batchItemFailures,
    };
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.error(
      `Critical error in Lambda handler after ${elapsed}ms: ${error.message}`,
      error.stack,
    );
    throw error; // Let Lambda retry the entire batch
  }
};

/**
 * Process a single SQS record
 */
async function processSQSRecord(
  record: SQSRecord,
  relayEmailsService: RelayEmailsService,
): Promise<void> {
  const startTime = Date.now();

  try {
    logger.log(`Processing message ${record.messageId}`);

    // Convert SQS Record to AWS SDK Message format
    // This matches the format expected by RelayEmailsService
    const message: Message = {
      MessageId: record.messageId,
      ReceiptHandle: record.receiptHandle,
      Body: record.body,
      Attributes: record.attributes as any,
      MessageAttributes: record.messageAttributes as any,
    };

    // Call the service method to process the message
    await relayEmailsService.processMessage(message);

    const elapsed = Date.now() - startTime;
    logger.log(`Successfully processed message ${record.messageId} in ${elapsed}ms`);
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.error(
      `Failed to process message ${record.messageId} after ${elapsed}ms: ${error.message}`,
      error.stack,
    );
    throw error; // Will be caught by Promise.allSettled
  }
}

/**
 * Optional: Graceful shutdown handler
 * Called when Lambda container is shut down
 */
export const shutdown = async () => {
  if (app) {
    logger.log('Closing NestJS application context...');
    await app.close();
    app = null;
  }
};
