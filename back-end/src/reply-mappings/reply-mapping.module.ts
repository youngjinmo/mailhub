import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReplyMapping } from './entities/reply-mapping.entity';
import { ReplyMappingService } from './reply-mapping.service';
import { CacheModule } from '../cache/cache.module';
import { ConfigModule } from 'src/config/config.module';
import { ProtectionUtil } from 'src/common/utils/protection.util';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReplyMapping]),
    CacheModule,
    ConfigModule,
  ],
  providers: [ReplyMappingService, ProtectionUtil],
  exports: [ReplyMappingService],
})
export class ReplyMappingModule {}
