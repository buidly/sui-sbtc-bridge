import {
  formatRewards,
  getFilteredRewards,
  getTotalAprPercent,
  initializeSuilend,
  initializeSuilendRewards,
  Side,
  SuilendClient,
} from '@suilend/sdk';
import BigNumber from 'bignumber.js';
import { BasePoolsProvider } from '@monorepo/common/services/base.pools.provider';
import { LendingPool, LendingProtocol, RewardInfo } from '@monorepo/common/services/types';
import { SuiClient } from '@mysten/sui/client';
import { btcCoinTypes } from '@monorepo/common/services/config';
import { Inject, Injectable } from '@nestjs/common';
import { ProviderKeys } from '@monorepo/common/utils/provider.enum';

const mainLendingMarket = {
  name: 'Main market',
  slug: 'main',
  id: '0x84030d26d85eaa7035084a057f2f11f701b7e2e4eda87551becbc7c97505ece1',
  type: '0xf95b06141ed4a174f239417323bde3f209b972f5930d8521ea38a52aff3a6ddf::suilend::MAIN_POOL',
  ownerCapId: '0xf7a4defe0b6566b6a2674a02a0c61c9f99bd012eed21bc741a069eaa82d35927',
};

@Injectable()
export class SuilendPoolsProvider extends BasePoolsProvider {
  private suilendClient: SuilendClient | null = null;

  constructor(@Inject(ProviderKeys.SUI_CLIENT_MAINNET) private readonly suiClient: SuiClient) {
    super(LendingProtocol.SUILEND);
  }

  async getPools(): Promise<LendingPool[]> {
    const suilendClient = await this.getSuilendClient();
    const { lendingMarket, reserveMap, activeRewardCoinTypes, rewardCoinMetadataMap } = await initializeSuilend(
      this.suiClient,
      suilendClient,
    );

    const { rewardPriceMap } = await initializeSuilendRewards(reserveMap, activeRewardCoinTypes);

    const rewardMap = formatRewards(reserveMap, rewardCoinMetadataMap, rewardPriceMap, []);
    return lendingMarket.reserves
      .filter((reserve: any) => Object.values(btcCoinTypes).includes(reserve.coinType))
      .map((reserve: any) => {
        // Get supply rewards and calculate APYs
        const supplyRewards = getFilteredRewards(rewardMap[reserve.coinType]?.[Side.DEPOSIT] ?? []);
        const supplyRewardInfos: RewardInfo[] = supplyRewards.map((reward) => ({
          symbol: reward.stats.symbol,
          apy: reward.stats.aprPercent?.toNumber() || 0,
        }));

        const stakingYieldAprPercent = new BigNumber(0);

        const baseSupplyApy = reserve.depositAprPercent;
        const baseRewardApy = supplyRewards.reduce(
          (total, reward) => total.plus(reward.stats.aprPercent || 0),
          new BigNumber(0),
        );
        // @ts-ignore
        const totalSupplyApy = getTotalAprPercent(Side.DEPOSIT, baseSupplyApy, supplyRewards, stakingYieldAprPercent);

        // Get borrow rewards and calculate APYs
        const borrowRewards = getFilteredRewards(rewardMap[reserve.coinType]?.[Side.BORROW] ?? []);
        const borrowRewardInfos: RewardInfo[] = borrowRewards.map((reward) => ({
          symbol: reward.stats.symbol,
          apy: reward.stats.aprPercent?.toNumber() || 0,
        }));

        const baseBorrowApy = reserve.borrowAprPercent;
        const borrowRewardApy = borrowRewards.reduce(
          (total, reward) => total.plus(reward.stats.aprPercent || 0),
          new BigNumber(0),
        );
        const totalBorrowApy = getTotalAprPercent(Side.BORROW, baseBorrowApy, borrowRewards, undefined);

        const name = Object.entries(btcCoinTypes).find(([_, type]) => type === reserve.coinType)?.[0];

        if (!name) {
          return null;
        }

        return {
          name,
          coinType: reserve.coinType,
          totalSupply: reserve.depositedAmount.toNumber(),
          totalBorrow: reserve.borrowedAmount.toNumber(),
          supplyApy: totalSupplyApy.toNumber(),
          borrowApy: totalBorrowApy.toNumber(),
          baseSupplyApy: baseSupplyApy.toNumber(),
          baseRewardApy: baseRewardApy.toNumber(),
          baseBorrowApy: baseBorrowApy.toNumber(),
          borrowRewardApy: borrowRewardApy.toNumber(),
          price: reserve.price.toNumber(),
          tvl: reserve.depositedAmountUsd.toNumber(),
          ltv: reserve.config.openLtvPct / 100,
          liquidationThreshold: reserve.config.closeLtvPct / 100,
          protocol: this.protocol,
          supplyRewards: supplyRewardInfos,
          borrowRewards: borrowRewardInfos,
        };
      })
      .filter((pool) => pool !== null);
  }

  private async getSuilendClient() {
    if (!this.suilendClient) {
      this.suilendClient = await SuilendClient.initialize(mainLendingMarket.id, mainLendingMarket.type, this.suiClient);
    }

    return this.suilendClient;
  }
}
