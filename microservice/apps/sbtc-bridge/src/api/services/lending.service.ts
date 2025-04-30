import { Inject, Injectable, Logger } from '@nestjs/common';
import { InMemoryCacheService } from '@monorepo/common/utils/in-memory-cache';
import { ProviderKeys } from '@monorepo/common/utils/provider.enum';
import { BasePoolsProvider } from '@monorepo/common/services/base.pools.provider';
import { CacheInfo } from '@monorepo/common/utils/cache.info';
import { LendingPool } from '@monorepo/common/services/types';
import { SuiApiHelper } from '@monorepo/common/helpers/sui.api.helper';
import { btcCoinTypes } from '@monorepo/common/services/config';

@Injectable()
export class LendingService {
  private readonly logger: Logger;

  constructor(
    @Inject(ProviderKeys.ALL_POOLS_PROVIDERS) private readonly allPoolsProviders: BasePoolsProvider[],
    private readonly suiApiHelper: SuiApiHelper,
    private readonly cache: InMemoryCacheService,
  ) {
    this.logger = new Logger(LendingService.name);
  }

  async getBtcPools() {
    const poolsArrays = await Promise.all(
      this.allPoolsProviders.map(async (provider) => {
        try {
          let result = this.cache.get<LendingPool[]>(CacheInfo.LendingBtcPools(provider.protocol).key);

          if (!result?.length) {
            result = await provider.getPools();
            this.cache.set(
              CacheInfo.LendingBtcPools(provider.protocol).key,
              result,
              CacheInfo.LendingBtcPools(provider.protocol).ttl,
            );
          }

          return result;
        } catch (e) {
          this.logger.error(`Failed to fetch pools from provider: ${provider.protocol}`, e);

          return [];
        }
      }),
    );
    const pools = poolsArrays.flat().sort((poolA, poolB) => {
      if (poolA.coinType < poolB.coinType) {
        return -1; // poolA should come before poolB
      }
      if (poolA.coinType > poolB.coinType) {
        return 1; // poolA should come after poolB
      }
      return 0; // poolA and poolB have the same coinType (order doesn't matter for grouping)
    });

    const coinsMetadata = await this.suiApiHelper.getCoinsMetadata(
      Object.values(btcCoinTypes),
      true,
    );

    return {
      pools,
      coinsMetadata,
    };
  }
}
