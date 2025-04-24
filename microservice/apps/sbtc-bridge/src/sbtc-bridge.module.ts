import { Module } from '@nestjs/common';
import { ApiModule } from './api/api.module';
import {
  SponsoredTransactionProcessorModule
} from './sponsored-transaction-processor/sponsored-transaction.processor.module';

@Module({
  imports: [ApiModule, SponsoredTransactionProcessorModule],
  providers: [],
  exports: [],
})
export class SbtcBridgeModule {}
