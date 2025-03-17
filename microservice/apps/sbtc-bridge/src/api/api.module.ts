import { Module } from '@nestjs/common';
import { ApiConfigModule } from '@monorepo/common/config/api.config.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { SponsoredController } from './sponsored.controller';
import { SponsoredService } from './sponsored.service';
import { HelpersModule } from '@monorepo/common/helpers/helpers.module';

@Module({
  imports: [
    ApiConfigModule,
    HelpersModule,
    ThrottlerModule.forRoot([
      {
        ttl: 120_000, // 120 seconds
        limit: 5,
      },
    ]),
  ],
  providers: [SponsoredService],
  controllers: [SponsoredController],
  exports: [],
})
export class ApiModule {}
