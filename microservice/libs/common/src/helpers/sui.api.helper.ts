import { Injectable } from '@nestjs/common';
import { CoinMetadata, SuiClient } from '@mysten/sui/client';

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
  constructor(private readonly client: SuiClient) {}

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

  async getCoinsMetadata(coinTypes: string[]) {
    try {
      const result = await Promise.all(
        coinTypes.map((coinType) =>
          this.client.getCoinMetadata({
            coinType,
          }),
        ),
      );

      return result.reduce<{ [coinType: string]: CoinMetadata }>((acc, metadata, index) => {
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
