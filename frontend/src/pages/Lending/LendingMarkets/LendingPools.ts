export interface LendingPools {
  pools: LendingPool[];
}

export interface LendingPool {
  id: string;
  name: string;
  symbol: string;
  totalSupply: number;
  totalBorrow: number;
  supplyApy: number;
  borrowApy: number;
  price: number;
  tvl: number;
  ltv: number;
  liquidationThreshold: number;
  protocol: LendingProtocol;
}

export enum LendingProtocol {
  NAVI = "navi",
  SCALLOP = "scallop",
  SUILEND = "suilend",
}

export interface PoolConfig {
  name: string;
  symbol: string;
  poolId: string;
  assetId: number;
  type: string;
}
