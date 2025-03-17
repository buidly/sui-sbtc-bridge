import { Module } from '@nestjs/common';
import { ApiConfigModule } from '@monorepo/common/config/api.config.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { GeneralController } from './general.controller';

@Module({
  imports: [
    ApiConfigModule,
    ThrottlerModule.forRoot([
      {
        ttl: 120_000, // 120 seconds
        limit: 5,
      },
    ]),
  ],
  providers: [],
  controllers: [GeneralController],
  exports: [],
})
export class ApiModule {}
