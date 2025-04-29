import axios, { AxiosInstance } from 'axios';
import { BasePoolsProvider } from './base.pools.provider';
import { LendingPool, LendingProtocol } from '@monorepo/common/services/types';
import { Injectable } from '@nestjs/common';
import { btcCoinTypes, NAVI_API_POOLS } from '@monorepo/common/services/config';

interface NaviPoolResponse {
  data: NaviPool[];
  code: number;
}

interface NaviPool {
  id: number;
  coinType: string;
  totalSupplyAmount: string;
  borrowedAmount: string;
  oracle: {
    price: string;
  };
  supplyIncentiveApyInfo: {
    vaultApr: string;
    boostedApr: string;
  };
  borrowIncentiveApyInfo: {
    vaultApr: string;
    boostedApr: string;
  };
  liquidationFactor: {
    threshold: string;
  };
  ltv: string;
}

const API_TIMEOUT = 30_000; // 30 seconds

@Injectable()
export class NaviPoolsProvider extends BasePoolsProvider {
  private readonly client: AxiosInstance;

  constructor() {
    super(LendingProtocol.NAVI);

    this.client = axios.create({
      baseURL: NAVI_API_POOLS,
      timeout: API_TIMEOUT,
      headers: {
        Accept: 'application/json',
      },
    });
  }

  async getPools(): Promise<LendingPool[]> {
    try {
      const response = await this.client.get<NaviPoolResponse>(NAVI_API_POOLS);
      if (!response.data || response.data.code !== 0) {
        return [];
      }

      return response.data.data
        .filter((pool) => Object.values(btcCoinTypes).some((type) => `0x${pool.coinType}` === type))
        .map((data) => {
          const name = Object.entries(btcCoinTypes).find(([_, type]) => `0x${data.coinType}` === type)?.[0];

          if (!name) {
            return null;
          }

          return this.transformToLendingPool(data, name);
        })
        .filter((pool) => pool !== null);
    } catch (error) {
      console.error('Error fetching Navi pools:', error);
      return [];
    }
  }

  private transformToLendingPool(data: NaviPool, name: string): LendingPool {
    const totalSupply = Number(data.totalSupplyAmount) / 1e9;
    const totalBorrow = Number(data.borrowedAmount) / 1e9;
    const price = Number(data.oracle.price);
    const supplyApy = Number(data.supplyIncentiveApyInfo.vaultApr) + Number(data.supplyIncentiveApyInfo.boostedApr);
    const borrowApy = Number(data.borrowIncentiveApyInfo.vaultApr) + Number(data.borrowIncentiveApyInfo.boostedApr);

    return {
      name,
      coinType: `0x${data.coinType}`,
      totalSupply,
      totalBorrow,
      supplyApy,
      borrowApy,
      price,
      tvl: totalSupply * price,
      ltv: Number(data.ltv) / 1e27,
      liquidationThreshold: Number(data.liquidationFactor.threshold),
      protocol: this.protocol,
      baseSupplyApy: supplyApy,
      baseBorrowApy: borrowApy,
      supplyRewards: [],
      borrowRewards: [],
    };
  }
}
