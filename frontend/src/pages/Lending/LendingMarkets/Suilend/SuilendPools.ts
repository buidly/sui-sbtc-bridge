import { client } from "@/api/sui";
import { initializeSuilend, SuilendClient } from "@suilend/sdk";
import { LendingPoolProvider } from "../BaseLendingProvider";
import { LendingPool, LendingProtocol } from "../LendingPools";
import { btcPools } from "../config";

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
    const { lendingMarket } = await initializeSuilend(client, suilendClient);

    return lendingMarket.reserves
      .filter((reserve: any) => Object.values(btcPools).includes(reserve.coinType.slice(2)))
      .map((reserve: any) => ({
        name: reserve.token.symbol,
        coinType: reserve.coinType,
        totalSupply: reserve.depositedAmount.toNumber(),
        totalBorrow: reserve.borrowedAmount.toNumber(),
        supplyApy: reserve.depositAprPercent.toNumber(),
        borrowApy: reserve.borrowAprPercent.toNumber(),
        price: reserve.price.toNumber(),
        tvl: reserve.depositedAmountUsd.toNumber(),
        ltv: reserve.config.openLtvPct / 100,
        liquidationThreshold: reserve.config.closeLtvPct / 100,
        protocol: this.protocol,
      }));
  }

  async getPool(id: string): Promise<LendingPool | undefined> {
    const pools = await this.getPools();
    return pools.find((pool) => pool.coinType === id);
  }
}
