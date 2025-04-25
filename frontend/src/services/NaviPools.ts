import axios from "axios";
import { LendingPoolProvider } from "./BaseLendingProvider.ts";
import { btcCoinTypes, LendingProtocol } from "./config.ts";
import { LendingPool } from "@/services/types.ts";
import { NAVISDKClient } from "navi-sdk";

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
  // @ts-ignore
  private readonly client: NAVISDKClient;

  constructor() {
    super(LendingProtocol.NAVI);

    this.client = new NAVISDKClient({
      networkType: "mainnet",
    });
  }

  async getPools(): Promise<LendingPool[]> {
    if (this.pools) {
      return this.pools;
    }

    try {
      const response = await axios.get<NaviPoolResponse>("https://open-api.naviprotocol.io/api/navi/pools");
      if (!response.data || response.data.code !== 0) {
        return [];
      }

      this.pools = response.data.data
        .filter((pool) => Object.values(btcCoinTypes).some((type) => `0x${pool.coinType}` === type))
        .map((data) => {
          const name = Object.entries(btcCoinTypes).find(([_, type]) => `0x${data.coinType}` === type)?.[0];

          return this.transformToLendingPool(data, name);
        });

      return this.pools;
    } catch (error) {
      console.error("Error fetching Navi pools:", error);
      this.pools = [];
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
