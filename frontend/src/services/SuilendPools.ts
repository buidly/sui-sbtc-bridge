import { client } from "@/api/sui.ts";
import {
  formatRewards,
  getFilteredRewards,
  getTotalAprPercent,
  initializeSuilend,
  initializeSuilendRewards,
  Side,
  SuilendClient,
} from "@suilend/sdk";
import { LendingPoolProvider } from "./BaseLendingProvider.ts";
import { btcCoinTypes, LendingProtocol } from "./config.ts";
import BigNumber from "bignumber.js";
import { LendingPool, RewardInfo } from "@/services/types.ts";

const mainLendingMarket = {
  name: "Main market",
  slug: "main",
  id: "0x84030d26d85eaa7035084a057f2f11f701b7e2e4eda87551becbc7c97505ece1",
  type: "0xf95b06141ed4a174f239417323bde3f209b972f5930d8521ea38a52aff3a6ddf::suilend::MAIN_POOL",
  ownerCapId: "0xf7a4defe0b6566b6a2674a02a0c61c9f99bd012eed21bc741a069eaa82d35927",
};

export class SuilendPoolProvider extends LendingPoolProvider {
  constructor() {
    super(LendingProtocol.SUILEND);
  }

  async getPools(): Promise<LendingPool[]> {
    if (this.pools) {
      return this.pools;
    }

    const suilendClient = await SuilendClient.initialize(mainLendingMarket.id, mainLendingMarket.type, client);
    const { lendingMarket, reserveMap, activeRewardCoinTypes, rewardCoinMetadataMap } = await initializeSuilend(
      client,
      suilendClient,
    );
    const { rewardPriceMap } = await initializeSuilendRewards(reserveMap, activeRewardCoinTypes);

    const rewardMap = formatRewards(reserveMap, rewardCoinMetadataMap, rewardPriceMap, []);
    this.pools = lendingMarket.reserves
      .filter((reserve: any) => Object.values(btcCoinTypes).includes(reserve.coinType))
      .map((reserve: any) => {
        // Get supply rewards and calculate APYs
        const supplyRewards = getFilteredRewards(rewardMap[reserve.coinType]?.[Side.DEPOSIT] ?? []);
        const supplyRewardInfos: RewardInfo[] = supplyRewards.map((reward) => ({
          symbol: reward.stats.symbol,
          apy: reward.stats.aprPercent.toNumber(),
        }));

        const stakingYieldAprPercent = new BigNumber(0);

        const baseSupplyApy = reserve.depositAprPercent;
        const baseRewardApy = supplyRewards.reduce(
          (total, reward) => total.plus(reward.stats.aprPercent || 0),
          new BigNumber(0),
        );
        const totalSupplyApy = getTotalAprPercent(Side.DEPOSIT, baseSupplyApy, supplyRewards, stakingYieldAprPercent);

        // Get borrow rewards and calculate APYs
        const borrowRewards = getFilteredRewards(rewardMap[reserve.coinType]?.[Side.BORROW] ?? []);
        const borrowRewardInfos: RewardInfo[] = borrowRewards.map((reward) => ({
          symbol: reward.stats.symbol,
          apy: reward.stats.aprPercent.toNumber(),
        }));

        const baseBorrowApy = reserve.borrowAprPercent;
        const borrowRewardApy = borrowRewards.reduce(
          (total, reward) => total.plus(reward.stats.aprPercent || 0),
          new BigNumber(0),
        );
        const totalBorrowApy = getTotalAprPercent(Side.BORROW, baseBorrowApy, borrowRewards, undefined);

        return {
          name: reserve.token.symbol,
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
      });

    return this.pools;
  }
}
