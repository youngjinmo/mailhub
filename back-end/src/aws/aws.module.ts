import { Module } from '@nestjs/common';
import { SesService } from './ses/ses.service';

@Module({
  providers: [SesService],
  exports: [SesService],
})
export class AwsModule {}
