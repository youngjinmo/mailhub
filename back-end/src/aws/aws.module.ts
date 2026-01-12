import { Module } from '@nestjs/common';
import { SesService } from './ses/ses.service';
import { SendEmailService } from './ses/send-email.service';

@Module({
  providers: [SesService, SendEmailService],
  exports: [SesService, SendEmailService],
})
export class AwsModule {}
