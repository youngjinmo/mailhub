import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RelayEmailsController } from './relay-emails.controller';
import { RelayEmailsService } from './relay-emails.service';
import { RelayEmail } from './entities/relay-email.entity';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([RelayEmail]), CacheModule],
  controllers: [RelayEmailsController],
  providers: [RelayEmailsService],
  exports: [RelayEmailsService],
})
export class RelayEmailsModule {}
