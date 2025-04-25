import { Module } from '@nestjs/common';
import { ApiConfigModule } from '@monorepo/common/config/api.config.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { SponsoredController } from './sponsored.controller';
import { SponsoredService } from './services/sponsored.service';
import { HelpersModule } from '@monorepo/common/helpers/helpers.module';
import { DatabaseModule } from '@monorepo/common/database/database.module';
import { GeneralService } from "./services/general.service";
import { GeneralController } from "./general.controller";

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
  ],
  providers: [SponsoredService, GeneralService],
  controllers: [SponsoredController, GeneralController],
  exports: [],
})
export class ApiModule {}
