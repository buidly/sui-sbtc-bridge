import { client } from "@/api/sui";
import {
  initializeSuilend,
  SuilendClient,
  Side,
  getTotalAprPercent,
  getFilteredRewards,
  formatRewards,
  initializeSuilendRewards,
} from "@suilend/sdk";
import { LendingPoolProvider } from "../BaseLendingProvider";
import { LendingPool, LendingProtocol } from "../LendingPools";
import { btcPools } from "../config";
import BigNumber from "bignumber.js";

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
    const suilendClient = await SuilendClient.initialize(mainLendingMarket.id, mainLendingMarket.type, client);
    const { lendingMarket, reserveMap, activeRewardCoinTypes, rewardCoinMetadataMap } = await initializeSuilend(
      client,
      suilendClient,
    );
    const { rewardPriceMap } = await initializeSuilendRewards(reserveMap, activeRewardCoinTypes);

    const rewardMap = formatRewards(reserveMap, rewardCoinMetadataMap, rewardPriceMap, []);
    return lendingMarket.reserves
      .filter((reserve: any) => Object.values(btcPools).includes(reserve.coinType.slice(2)))
      .map((reserve: any) => {
        // Get supply rewards from formatted rewards
        const supplyRewards = getFilteredRewards(rewardMap[reserve.coinType]?.[Side.DEPOSIT] ?? []);
        const stakingYieldAprPercent = new BigNumber(0);

        // Calculate total supply APY including rewards
        const totalSupplyApy = getTotalAprPercent(
          Side.DEPOSIT,
          reserve.depositAprPercent,
          supplyRewards,
          stakingYieldAprPercent,
        );

        // Get borrow rewards and calculate total borrow APY
        const borrowRewards = getFilteredRewards(rewardMap[reserve.coinType]?.[Side.BORROW] ?? []);
        const totalBorrowApy = getTotalAprPercent(Side.BORROW, reserve.borrowAprPercent, borrowRewards, undefined);

        return {
          name: reserve.token.symbol,
          coinType: reserve.coinType,
          totalSupply: reserve.depositedAmount.toNumber(),
          totalBorrow: reserve.borrowedAmount.toNumber(),
          supplyApy: totalSupplyApy.toNumber(),
          borrowApy: totalBorrowApy.toNumber(),
          price: reserve.price.toNumber(),
          tvl: reserve.depositedAmountUsd.toNumber(),
          ltv: reserve.config.openLtvPct / 100,
          liquidationThreshold: reserve.config.closeLtvPct / 100,
          protocol: this.protocol,
        };
      });
  }

  async getPool(id: string): Promise<LendingPool | undefined> {
    const pools = await this.getPools();
    return pools.find((pool) => pool.coinType === id);
  }
}
