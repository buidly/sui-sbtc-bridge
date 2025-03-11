export const pool: { [key: string]: PoolConfig } = {
  WBTC: {
    name: "WBTC",
    assetId: 8,
    poolId: "0xd162cbe40f8829ce71c9b3d3bf3a83859689a79fa220b23d70dc0300b777ae6e",
    type: "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN",
    reserveObjectId: "0x8b4d81f004e4e9faf4540951a896b6d96e42598a270e6375f598b99742db767e",
    borrowBalanceParentId: "0x55e1f3c9e6e5cf9fff563bdd61db07a3826458c56ef72c455e049ab3b1b0e99c",
    supplyBalanceParentId: "0x821e505a0091b089edba94deaa14c2f2230d026bbaa7b85680554441aad447e0",
    rewardFundId: "",
  },
  suiBTC: {
    name: "suiBTC",
    assetId: 21,
    poolId: "0x348f4049063e6c4c860064d67a170a7b3de033db9d67545d98fa5da3999966bc",
    type: "0xaafb102dd0902f5055cadecd687fb5b71ca82ef0e0285d90afde828ec58ca96b::btc::BTC",
    reserveObjectId: "0xb6a8441d447dd5b7cd45ef874728a700cd05366c331f9cc1e37a4665f0929c2b",
    borrowBalanceParentId: "0x33d8a4cb800c863f19ae27fc173e1eb5895cdbcea7ae302b756fb275c678dc72",
    supplyBalanceParentId: "0xf99e9bbd4c2b5dee460abeddc0f96042f2fb51420cb634d5a378d5d7643dd189",
    rewardFundId: "",
  },
  LBTC: {
    name: "LBTC",
    assetId: 23,
    poolId: "",
    type: "0x3e8e9423d80e1774a7ca128fccd8bf5f1f7753be658c5e645929037f7c819040::lbtc::LBTC",
    reserveObjectId: "",
    borrowBalanceParentId: "",
    supplyBalanceParentId: "",
    rewardFundId: "",
  },
  LorenzoBTC: {
    name: "stBTC",
    assetId: 14,
    poolId: "0xd96dcd6982c45e580c83ff1d96c2b4455a874c284b637daf67c0787f25bc32dd",
    type: "0x5f496ed5d9d045c5b788dc1bb85f54100f2ede11e46f6a232c29daada4c5bdb6::coin::COIN",
    reserveObjectId: "0x9634f9f7f8ea7236e2ad5bfbecdce9673c811a34cf8c3741edfbcaf5d9409100",
    borrowBalanceParentId: "0xb5cac1b39f67da86f4496f75339001a12f4b8ba78b047682f5158ac4ae8e1649",
    supplyBalanceParentId: "0xad0d8be450e020f54e3212b5b1f4f1256bb8ea882bc85bc9f86708f73d653720",
    rewardFundId: "",
  },
};

export interface PoolConfig {
  name: string; // Customized Names
  assetId: number;
  poolId: string; // Type must be ${PriceOraclePackage}::pool::Pool<${CoinType}>
  type: string; // CoinType
  reserveObjectId: string; // Get it from dynamic object, type must be ${ProtocolPackage}::storage::ReserveData
  borrowBalanceParentId: string; // Get it from dynamic object, type must be ${ProtocolPackage}::storage::TokenBalance
  supplyBalanceParentId: string; // Get it from dynamic object, type must be ${ProtocolPackage}::storage::TokenBalance
  rewardFundId: string; // Get it from dynamic object, type must be ${ProtocolPackage}::storage::TokenBalance
}
