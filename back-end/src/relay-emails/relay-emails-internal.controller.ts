import {
  Controller,
  Post,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { RelayEmailsService } from './relay-emails.service';
import { CustomEnvService } from 'src/config/custom-env.service';

@Controller('relay-emails/internal')
export class RelayEmailsInternalController {
  private readonly logger = new Logger(RelayEmailsInternalController.name);
  private isProcessing = false;

  constructor(
    private readonly relayEmailsService: RelayEmailsService,
    private readonly customEnvService: CustomEnvService,
  ) {}

  @Public()
  @Post('poll-sqs')
  @HttpCode(HttpStatus.OK)
  async pollSqs(@Headers('x-internal-secret') secret: string) {
    const expected = this.customEnvService.get<string>('INTERNAL_POLL_SECRET');
    if (!secret || secret !== expected) {
      throw new UnauthorizedException();
    }

    if (this.isProcessing) {
      return { status: 'busy' };
    }

    this.isProcessing = true;
    try {
      await this.relayEmailsService.processIncomingEmails();
      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`Failed to poll SQS: ${error.message}`, error.stack);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }
}
