import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RelayEmailsService } from 'src/relay-emails/relay-emails.service';

@Injectable()
export class QueuePollerService implements OnModuleInit {
  private readonly logger = new Logger(QueuePollerService.name);
  private isProcessing = false;
  private isWorkerMode = false;

  constructor(private readonly relayEmailService: RelayEmailsService) {}

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

  @Cron(CronExpression.EVERY_30_SECONDS)
  async pollSQS() {
    // Skip polling if not in worker mode
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
    } catch (error) {
      this.logger.error(`Failed to poll SQS: ${error.message}`, error.stack);
    } finally {
      this.isProcessing = false;
    }
  }
}
