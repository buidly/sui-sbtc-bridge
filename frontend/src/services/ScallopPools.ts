import { LendingPoolProvider } from "./BaseLendingProvider.ts";
import { btcCoinTypes, LendingProtocol } from "./config.ts";
import { LendingPool } from "@/services/types.ts";
import { MarketPool, Scallop } from "@scallop-io/sui-scallop-sdk";

export class ScallopPoolProvider extends LendingPoolProvider {
  private readonly client: Scallop;

  constructor() {
    super(LendingProtocol.SCALLOP);

    this.client = new Scallop({
      addressId: "67c44a103fe1b8c454eb9699",
      networkType: "mainnet",
    });
  }

  async getPools(): Promise<LendingPool[]> {
    try {
      const response = await (await this.client.createScallopClient()).queryMarket();
      if (!response.pools) return [];

      return Object.values(response.pools)
        .filter((pool) =>
          Object.values(btcCoinTypes).some((type) => pool.coinType.toLowerCase() === type.toLowerCase()),
        )
        .map((data) => this.transformToLendingPool(data));
    } catch (error) {
      console.error("Error fetching Scallop pools:", error);
      return [];
    }
  }

  async getPool(id: string): Promise<LendingPool | undefined> {
    const pools = await this.getPools();
    return pools.find((pool) => pool.coinType === id);
  }

  private transformToLendingPool(data: MarketPool): LendingPool {
    const name = Object.entries(btcCoinTypes).find(([_, type]) => type === data.coinType)?.[0];
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
