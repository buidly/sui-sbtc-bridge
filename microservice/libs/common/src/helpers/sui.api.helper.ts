import { Inject, Injectable } from '@nestjs/common';
import { CoinMetadata, SuiClient } from '@mysten/sui/client';
import { InMemoryCacheService } from '@monorepo/common/utils/in-memory-cache';
import { CacheInfo } from '@monorepo/common/utils/cache.info';
import { ProviderKeys } from '@monorepo/common/utils/provider.enum';

export interface StableSwapPool {
  admin_fee: string;
  amp: bigint;
  fee: string;
  lp_supply: string;
  types: string[];
  values: bigint[];
}

@Injectable()
export class SuiApiHelper {
  constructor(
    private readonly client: SuiClient,
    @Inject(ProviderKeys.SUI_CLIENT_MAINNET) private readonly clientMainnet: SuiClient,
    private readonly cache: InMemoryCacheService,
  ) {}

  async getObject(objectId: string): Promise<StableSwapPool | undefined> {
    try {
      const result = await this.client.getObject({
        id: objectId,
        options: {
          showContent: true,
        },
      });

      const data = (result?.data?.content as any)?.fields as StableSwapPool;

      // Do type conversions
      if (data?.types) {
        data.types = data.types.map((type) => `0x${type}`);
      }
      if (data?.values) {
        data.values = data.values.map((value) => BigInt(value));
      }
      data.amp = BigInt(data.amp);

      return data;
    } catch (e) {
      console.error(e);

      return undefined;
    }
  }

  async getCoinsMetadata(coinTypes: string[], useMainnet: boolean = false) {
    try {
      const result = await Promise.all(
        coinTypes.map(async (coinType) => {
          let result = this.cache.get<CoinMetadata>(CacheInfo.CoinMetadata(coinType).key) || null;

          if (!result) {
            result = await (useMainnet ? this.clientMainnet : this.client).getCoinMetadata({
              coinType,
            });
            this.cache.set(CacheInfo.CoinMetadata(coinType).key, result, CacheInfo.CoinMetadata(coinType).ttl);
          }

          return result;
        }),
      );

      return result
        .filter((coinMetadata) => coinMetadata !== null)
        .reduce<{
          [coinType: string]: CoinMetadata;
        }>((acc, metadata, index) => {
          if (metadata) {
            acc[coinTypes[index]] = metadata;
          }

          return acc;
        }, {});
    } catch (e) {
      console.error(e);

      return {};
    }
  }
}
