import { LendingPoolProvider } from "./BaseLendingProvider.ts";
import { btcCoinTypes } from "./config.ts";
import { AddressLendingInfo, LendingProtocol } from "@/services/types.ts";
import { Scallop, ScallopClient } from "@scallop-io/sui-scallop-sdk";
import { Transaction } from "@mysten/sui/transactions";

class ScallopPoolProvider extends LendingPoolProvider {
  private readonly client: Scallop;
  private scallopClient: ScallopClient;

  constructor() {
    super(LendingProtocol.SCALLOP);

    this.client = new Scallop({
      addressId: "67c44a103fe1b8c454eb9699",
      networkType: "mainnet",
    });
  }

  async getAddressInfo(address: string): Promise<AddressLendingInfo[]> {
    const query = (await this.getScallopClient()).query;
    const utils = await this.client.createScallopUtils();

    const poolCoinNames = Object.values(btcCoinTypes).map((type) => utils.parseCoinNameFromType(type));

    const lendings = await query.getLendings(poolCoinNames, address);

    return Object.values(lendings).map((lending) => {
      const name = Object.entries(btcCoinTypes).find(([_, type]) => type === lending.coinType)?.[0];

      return {
        name,
        coinType: lending.coinType,
        supplyBalance: BigInt(Math.round(lending.availableStakeAmount)),
        underlyingBalance: BigInt(Math.round(lending.availableWithdrawAmount)),
        protocol: LendingProtocol.SCALLOP,
      };
    });
  }

  async supplyTx(coinType: string, address: string, amount: bigint): Promise<Transaction> {
    const builder = (await this.getScallopClient()).builder;
    const utils = await this.client.createScallopUtils();

    const coinName = utils.parseCoinNameFromType(coinType);

    const txBlock = builder.createTxBlock();
    txBlock.setSender(address);

    const marketCoin = await txBlock.depositQuick(Number(amount), coinName);
    txBlock.transferObjects([marketCoin], address);

    return txBlock.txBlock;
  }

  async withdrawTx(coinType: string, address: string, amount: bigint): Promise<Transaction> {
    const builder = (await this.getScallopClient()).builder;
    const utils = await this.client.createScallopUtils();

    const coinName = utils.parseCoinNameFromType(coinType);

    const txBlock = builder.createTxBlock();
    txBlock.setSender(address);

    const coin = await txBlock.withdrawQuick(Number(amount), coinName);
    txBlock.transferObjects([coin], address);

    return txBlock.txBlock;
  }

  private async getScallopClient() {
    if (!this.scallopClient) {
      this.scallopClient = await this.client.createScallopClient();
    }

    return this.scallopClient;
  }
}

const scallopPoolProvider = new ScallopPoolProvider();

export default scallopPoolProvider;
