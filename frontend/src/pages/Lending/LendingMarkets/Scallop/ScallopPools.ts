import axios from "axios";
import { LendingPoolProvider } from "../BaseLendingProvider";
import { btcPools } from "../config";
import { LendingPool, LendingProtocol } from "../LendingPools";

interface ScallopPool {
  coinName: string;
  symbol: string;
  coinType: string;
  sCoinType: string;
  marketCoinType: string;
  coinDecimal: number;
  coinPrice: number;
  borrowApr: number;
  borrowApy: number;
  supplyApr: number;
  supplyApy: number;
  supplyCoin: number;
  borrowCoin: number;
  reserveCoin: number;
  utilizationRate: number;
  highKink: number;
  midKink: number;
  reserveFactor: number;
  borrowWeight: number;
  borrowFee: number;
  marketCoinSupplyAmount: number;
  minBorrowAmount: number;
  maxBorrowApr: number;
  maxBorrowApy: number;
  borrowIndex: number;
  growthInterest: number;
  supplyAmount: number;
  borrowAmount: number;
  reserveAmount: number;
  conversionRate: number;
  maxSupplyCoin: number;
  isIsolated: boolean;
  maxBorrowCoin: number;
  ltv: string;
}

interface ScallopResponse {
  tvl: number;
  updatedAt: string;
  pools: ScallopPool[];
}

export class ScallopPoolProvider extends LendingPoolProvider {
  constructor() {
    super(LendingProtocol.SCALLOP);
  }

  async getPools(): Promise<LendingPool[]> {
    try {
      const response = await axios.get<ScallopResponse>("https://sdk.api.scallop.io/api/market/migrate");
      console.log(response.data);
      if (!response.data) return [];

      const btcPoolsArray = Object.values(btcPools);

      return response.data.pools
        .filter((pool) =>
          btcPoolsArray.some((type) => pool.coinType.toLowerCase().replace("0x", "") === type.toLowerCase()),
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

  private transformToLendingPool(data: ScallopPool): LendingPool {
    const name = Object.entries(btcPools).find(
      ([_, type]) => type.toLowerCase().replace("0x", "") === data.coinType.toLowerCase().replace("0x", ""),
    )?.[0];
    const totalSupply = Number(data.supplyCoin);
    const totalBorrow = Number(data.borrowCoin);
    const price = Number(data.coinPrice);

    return {
      name: name,
      coinType: data.coinType,
      totalSupply,
      totalBorrow,
      supplyApy: data.supplyApy * 100,
      borrowApy: data.borrowApy * 100,
      price,
      tvl: totalSupply * price,
      ltv: data.ltv ? Number(data.ltv) : 0,
      liquidationThreshold: data.highKink,
      protocol: this.protocol,
    };
  }
}
