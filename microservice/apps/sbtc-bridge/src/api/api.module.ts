import { Module } from '@nestjs/common';
import { ApiConfigModule } from '@monorepo/common/config/api.config.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { SponsoredController } from './sponsored.controller';
import { SponsoredService } from './services/sponsored.service';
import { HelpersModule } from '@monorepo/common/helpers/helpers.module';
import { DatabaseModule } from '@monorepo/common/database/database.module';
import { GeneralService } from './services/general.service';
import { GeneralController } from './general.controller';
import { LendingService } from './services/lending.service';
import { LendingController } from './lending.controller';
import { ServicesModule } from '@monorepo/common/services/services.module';

@Module({
  imports: [
    ApiConfigModule,
    HelpersModule,
    DatabaseModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 60 seconds
        limit: 6,
      },
    ]),
    ServicesModule,
  ],
  providers: [SponsoredService, GeneralService, LendingService],
  controllers: [SponsoredController, GeneralController, LendingController],
  exports: [],
})
export class ApiModule {}
