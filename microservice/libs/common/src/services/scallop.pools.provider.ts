import { MarketPool, Scallop, ScallopClient } from '@scallop-io/sui-scallop-sdk';
import { BasePoolsProvider } from '@monorepo/common/services/base.pools.provider';
import { LendingPool, LendingProtocol } from '@monorepo/common/services/types';
import { btcCoinTypes } from '@monorepo/common/services/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ScallopPoolsProvider extends BasePoolsProvider {
  private readonly client: Scallop;
  private scallopClient: ScallopClient | null = null;

  constructor() {
    super(LendingProtocol.SCALLOP);

    this.client = new Scallop({
      addressId: '67c44a103fe1b8c454eb9699',
      networkType: 'mainnet',
    });
  }

  async getPools(): Promise<LendingPool[]> {
    try {
      const response = await (await this.getScallopClient()).queryMarket();
      if (!response.pools) return [];

      return Object.values(response.pools)
        .filter((pool) => {
          if (!pool) {
            return false;
          }

          return Object.values(btcCoinTypes).some((type) => pool.coinType.toLowerCase() === type.toLowerCase());
        })
        .map((data) => {
          if (!data) {
            return null;
          }

          const name = Object.entries(btcCoinTypes).find(([_, type]) => type === data.coinType)?.[0];

          if (!name) {
            return null;
          }

          return this.transformToLendingPool(data, name);
        })
        .filter((pool) => pool !== null);
    } catch (error) {
      console.error('Error fetching Scallop pools:', error);
      return [];
    }
  }

  private async getScallopClient() {
    if (!this.scallopClient) {
      this.scallopClient = await this.client.createScallopClient();
    }

    return this.scallopClient;
  }

  private transformToLendingPool(data: MarketPool, name: string): LendingPool {
    const totalBorrow = Number(data.borrowCoin);
    const price = Number(data.coinPrice);

    return {
      name,
      coinType: data.coinType,
      totalSupply: data.supplyAmount,
      totalBorrow,
      supplyApy: data.supplyApy * 100,
      borrowApy: data.borrowApy * 100,
      price,
      tvl: data.supplyAmount * price,
      ltv: data.reserveFactor,
      liquidationThreshold: data.highKink,
      protocol: this.protocol,
      baseSupplyApy: data.supplyApy * 100,
      baseBorrowApy: data.borrowApy * 100,
      supplyRewards: [],
      borrowRewards: [],
    };
  }
}
