import { client } from "@/api/sui";
import axios from "axios";
import { LendingPool, LendingProtocol } from "../LendingPools";
import { pool as naviPools } from "./config";
import { LendingPoolProvider } from "../BaseLendingProvider";
import { SuiClient } from "@mysten/sui/client";

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
  private poolDataMap: Map<string, NaviPool> = new Map();

  constructor() {
    super(LendingProtocol.NAVI);
  }

  async fetchAllPools(): Promise<void> {
    try {
      const response = await axios.get<NaviPoolResponse>("https://open-api.naviprotocol.io/api/navi/pools");
      if (!response.data || response.data.code !== 0) return;

      const poolInfo = response.data.data;
      const configuredPools = Object.values(naviPools);

      configuredPools.forEach((config) => {
        const poolData = poolInfo.find((p) => p.id === config.assetId);
        if (poolData) {
          this.poolDataMap.set(config.name, poolData);
          this.pools.push(this.transformToLendingPool(config, poolData));
        }
      });
    } catch (error) {
      console.error("Error fetching Navi pools:", error);
    }
  }

  getPool(id: string): LendingPool | undefined {
    return this.pools.find((pool) => pool.id === id);
  }

  private transformToLendingPool(config: { name: string; poolId: string }, data: NaviPool): LendingPool {
    const totalSupply = Number(data.totalSupplyAmount) / 1e9;
    const totalBorrow = Number(data.borrowedAmount) / 1e9;
    const price = Number(data.oracle.price);
    const supplyApy = Number(data.supplyIncentiveApyInfo.vaultApr) + Number(data.supplyIncentiveApyInfo.boostedApr);
    const borrowApy = Number(data.borrowIncentiveApyInfo.vaultApr) + Number(data.borrowIncentiveApyInfo.boostedApr);

    return {
      id: config.poolId,
      name: config.name,
      symbol: config.name,
      totalSupply,
      totalBorrow,
      supplyApy,
      borrowApy,
      price,
      tvl: totalSupply * price,
      ltv: Number(data.ltv) / 1e27,
      liquidationThreshold: Number(data.liquidationFactor.threshold),
      protocol: this.protocol,
    };
  }
}

export async function getPoolInfo() {
  try {
    const response = await axios.get("https://api-defi.naviprotocol.io/getIndexAssetData");
    return response.data;
  } catch (error) {
    console.error("Error fetching pool info:", error);
    return null;
  }
}

export const fetchPoolData = async ({ poolId }: { poolId: number }) => {
  const poolInfo = await getPoolInfo();
  if (!poolInfo) {
    return null;
  }
  const reserveParentId = getConfig().ReserveParentId;
  const poolData = poolInfo[poolId];
  const result: any = await client.getDynamicFieldObject({
    parentId: reserveParentId,
    name: { type: "u8", value: poolId },
  });
  const filedsData = result.data?.content?.fields?.value?.fields;
  const total_supply_with_index = (poolData.total_supply * filedsData.current_supply_index) / 1e27;
  const total_borrow_with_index = (poolData.total_borrow * filedsData.current_borrow_index) / 1e27;

  return {
    coin_type: poolData.coin_type,
    total_supply: total_supply_with_index,
    total_borrow: total_borrow_with_index,
    tokenPrice: poolData.price,
    base_supply_rate: poolData.supply_rate,
    base_borrow_rate: poolData.borrow_rate,
    boosted_supply_rate: poolData.boosted,
    boosted_borrow_rate: poolData.borrow_reward_apy,
    supply_cap_ceiling: Number(filedsData.supply_cap_ceiling / 1e36),
    borrow_cap_ceiling: Number((filedsData.borrow_cap_ceiling / 1e27).toFixed(2)) * poolData.total_supply,
    current_supply_utilization: total_supply_with_index / Number(filedsData.supply_cap_ceiling / 1e36),
    current_borrow_utilization:
      total_borrow_with_index / (Number((filedsData.borrow_cap_ceiling / 1e27).toFixed(2)) * poolData.total_supply),
    optimal_borrow_utilization: (Number(filedsData.borrow_rate_factors?.fields?.optimal_utilization) / 1e27).toFixed(2),
    pool: poolData.pool,
    max_ltv: (Number(filedsData.ltv) / 1e27).toFixed(2),
    liquidation_threshold: (Number(filedsData.liquidation_factors.fields.threshold) / 1e27).toFixed(2),
    symbol: poolData.symbol,
    rewardTokenAddress: poolData.rewardTokens,
  };
};

export async function getReservesDetail(assetId: number, client: SuiClient) {
  const config = getConfig();
  const result = await client.getDynamicFieldObject({
    parentId: config.ReserveParentId,
    name: { type: "u8", value: assetId },
  });
  return result;
}
export const getConfig = () => {
  const protocolPackage = "0x81c408448d0d57b3e371ea94de1d40bf852784d3e225de1e74acab3e8395c18f";
  return {
    ProtocolPackage: protocolPackage,
    StorageId: "0xbb4e2f4b6205c2e2a2db47aeb4f830796ec7c005f88537ee775986639bc442fe",
    IncentiveV2: "0xf87a8acb8b81d14307894d12595541a73f19933f88e1326d5be349c7a6f7559c", // The new incentive version: V2
    IncentiveV3: "0x62982dad27fb10bb314b3384d5de8d2ac2d72ab2dbeae5d801dbdb9efa816c80", // The new incentive version: V3

    PriceOracle: "0x1568865ed9a0b5ec414220e8f79b3d04c77acc82358f6e5ae4635687392ffbef",
    ReserveParentId: "0xe6d4c6610b86ce7735ea754596d71d72d10c7980b5052fc3c8cdf8d09fea9b4b", // get it from storage object id. storage.reserves
    uiGetter: "0x9fc07f422912997425114d97ccdfd4ff31b7d1f1b314cd41b57f5cb3697cedab",
    flashloanConfig: "0x3672b2bf471a60c30a03325f104f92fb195c9d337ba58072dce764fe2aa5e2dc",
    flashloanSupportedAssets: "0x6c8fc404b4f22443302bbcc50ee593e5b898cc1e6755d72af0a6aab5a7a6f6d3",
  };
};
