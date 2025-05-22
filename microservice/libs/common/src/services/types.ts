export enum LendingProtocol {
  SCALLOP = "scallop",
  SUILEND = "suilend",
}

export interface LendingPool {
  name: string;
  coinType: string;
  totalSupply: number;
  totalBorrow: number;
  supplyApy: number; // Total APY (base + all rewards)
  borrowApy: number; // Total APY (base + all rewards)
  baseSupplyApy: number; // Base interest rate
  baseBorrowApy: number; // Base interest rate
  supplyRewards: RewardInfo[]; // Initialize as empty array for non-Suilend pools
  borrowRewards: RewardInfo[]; // Initialize as empty array for non-Suilend pools
  price: number;
  tvl: number;
  ltv: number;
  liquidationThreshold: number;
  protocol: LendingProtocol;
}

export interface RewardInfo {
  symbol: string; // Token symbol (e.g. "DEEP", "USDC")
  apy: number; // APY for this reward token
}
