import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SponsoredTransactionProcessorService } from './sponsored-transaction.processor.service';
import { DatabaseModule } from '@monorepo/common/database/database.module';
import { HelpersModule } from '@monorepo/common/helpers/helpers.module';
import { ApiConfigModule } from '@monorepo/common/config/api.config.module';

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule, HelpersModule, ApiConfigModule],
  providers: [SponsoredTransactionProcessorService],
})
export class SponsoredTransactionProcessorModule {}
