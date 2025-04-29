import { Module } from '@nestjs/common';
import { NaviPoolsProvider } from '@monorepo/common/services/navi.pools.provider';
import { HelpersModule } from '@monorepo/common/helpers/helpers.module';
import { ScallopPoolsProvider } from '@monorepo/common/services/scallop.pools.provider';
import { SuilendPoolsProvider } from '@monorepo/common/services/suilend.pools.provider';
import { ProviderKeys } from '@monorepo/common/utils/provider.enum';

@Module({
  imports: [HelpersModule],
  providers: [
    NaviPoolsProvider,
    ScallopPoolsProvider,
    SuilendPoolsProvider,
    {
      provide: ProviderKeys.ALL_POOLS_PROVIDERS,
      useFactory: (
        naviPoolsProvider: NaviPoolsProvider,
        scallopPoolsProvider: ScallopPoolsProvider,
        suilendPoolsProvider: SuilendPoolsProvider,
      ) => {
        return [naviPoolsProvider, scallopPoolsProvider, suilendPoolsProvider];
      },
      inject: [NaviPoolsProvider, ScallopPoolsProvider, SuilendPoolsProvider],
    },
  ],
  exports: [ProviderKeys.ALL_POOLS_PROVIDERS],
})
export class ServicesModule {}
