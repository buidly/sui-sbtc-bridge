import { LendingPoolProvider } from "./BaseLendingProvider.ts";
import { btcCoinTypes, LendingProtocol } from "./config.ts";
import { AddressLendingInfo, LendingPool } from "@/services/types.ts";
import { MarketPool, Scallop, ScallopClient } from "@scallop-io/sui-scallop-sdk";
import { Transaction } from "@mysten/sui/transactions";
import { SUI_NETWORK } from "@/api/sui.ts";

export class ScallopPoolProvider extends LendingPoolProvider {
  private readonly client: Scallop;
  private scallopClient: ScallopClient;

  constructor() {
    super(LendingProtocol.SCALLOP);

    this.client = new Scallop({
      addressId: "67c44a103fe1b8c454eb9699",
      networkType: SUI_NETWORK,
    });
  }

  async getPools(): Promise<LendingPool[]> {
    try {
      const response = await (await this.getScallopClient()).queryMarket();
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

  // TODO:
  async getAddressInfo(address: string): Promise<AddressLendingInfo[]> {
    const utils = await this.client.createScallopUtils();
    const query = (await this.getScallopClient()).query;

    const poolCoinNames = Object.values(btcCoinTypes).map((type) => utils.parseCoinNameFromType(type));

    console.log("pool coin names", poolCoinNames);

    const lendings = await query.getLendings(poolCoinNames, address);

    console.log("lendings", lendings);

    return Object.values(lendings).map((lending) => {
      const name = Object.entries(btcCoinTypes).find(([_, type]) => type === lending.coinType)?.[0];

      return {
        name,
        coinType: lending.coinType,
        supplyBalance: lending.availableStakeAmount,
        underlyingBalance: lending.availableWithdrawAmount,
        protocol: LendingProtocol.SCALLOP,
      };
    });
  }

  async supplyTx(coinType: string, address: string, amount: number): Promise<Transaction> {
    const utils = await this.client.createScallopUtils();
    const builder = (await this.getScallopClient()).builder;

    const coinName = utils.parseCoinNameFromType(coinType);

    const txBlock = builder.createTxBlock();
    txBlock.setSender(address);

    const marketCoin = await txBlock.depositQuick(amount, coinName);
    txBlock.transferObjects([marketCoin], address);

    return txBlock.txBlock;
  }

  private async getScallopClient() {
    if (!this.scallopClient) {
      this.scallopClient = await this.client.createScallopClient();
    }

    return this.scallopClient;
  }

  async withdrawTx(coinType: string, address: string, amount: number): Promise<Transaction> {
    const utils = await this.client.createScallopUtils();
    const builder = (await this.getScallopClient()).builder;

    const coinName = utils.parseCoinNameFromType(coinType);

    const txBlock = builder.createTxBlock();
    txBlock.setSender(address);

    const coin = await txBlock.withdrawQuick(amount, coinName);
    txBlock.transferObjects([coin], address);

    return txBlock.txBlock;
  }

  private async getScallopClient() {
    if (!this.scallopClient) {
      this.scallopClient = await this.client.createScallopClient();
    }

    return this.scallopClient;
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
