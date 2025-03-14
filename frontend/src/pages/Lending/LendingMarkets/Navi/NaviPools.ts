import axios from "axios";
import { LendingPoolProvider } from "../BaseLendingProvider";
import { btcPools } from "../config";
import { LendingPool, LendingProtocol } from "../LendingPools";

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

export class NaviPoolProvider extends LendingPoolProvider {
  constructor() {
    super(LendingProtocol.NAVI);
  }

  async getPools(): Promise<LendingPool[]> {
    try {
      const response = await axios.get<NaviPoolResponse>("https://open-api.naviprotocol.io/api/navi/pools");
      if (!response.data || response.data.code !== 0) return [];

      return response.data.data
        .filter((pool) =>
          Object.values(btcPools).some((type) => pool.coinType.toLowerCase().replace("0x", "") === type.toLowerCase()),
        )
        .map((data) => {
          const name = Object.entries(btcPools).find(([_, type]) => type === data.coinType)?.[0];
          return this.transformToLendingPool(data, name);
        });
    } catch (error) {
      console.error("Error fetching Navi pools:", error);
      return [];
    }
  }

  async getPool(id: string): Promise<LendingPool | undefined> {
    const pools = await this.getPools();
    return pools.find((pool) => pool.coinType === id);
  }

  private transformToLendingPool(data: NaviPool, name: string): LendingPool {
    const totalSupply = Number(data.totalSupplyAmount) / 1e9;
    const totalBorrow = Number(data.borrowedAmount) / 1e9;
    const price = Number(data.oracle.price);
    const supplyApy = Number(data.supplyIncentiveApyInfo.vaultApr) + Number(data.supplyIncentiveApyInfo.boostedApr);
    const borrowApy = Number(data.borrowIncentiveApyInfo.vaultApr) + Number(data.borrowIncentiveApyInfo.boostedApr);

    return {
      name: name,
      coinType: data.coinType,
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
