import { Module } from '@nestjs/common';
import { HelpersModule } from '@monorepo/common/helpers/helpers.module';
import { ScallopPoolsProvider } from '@monorepo/common/services/scallop.pools.provider';
import { SuilendPoolsProvider } from '@monorepo/common/services/suilend.pools.provider';
import { ProviderKeys } from '@monorepo/common/utils/provider.enum';

@Module({
  imports: [HelpersModule],
  providers: [
    ScallopPoolsProvider,
    SuilendPoolsProvider,
    {
      provide: ProviderKeys.ALL_POOLS_PROVIDERS,
      useFactory: (
        scallopPoolsProvider: ScallopPoolsProvider,
        suilendPoolsProvider: SuilendPoolsProvider,
      ) => {
        return [scallopPoolsProvider, suilendPoolsProvider];
      },
      inject: [ScallopPoolsProvider, SuilendPoolsProvider],
    },
  ],
  exports: [ProviderKeys.ALL_POOLS_PROVIDERS],
})
export class ServicesModule {}
