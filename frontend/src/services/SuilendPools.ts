import {
  initializeObligations,
  initializeSuilend,
  LENDING_MARKETS,
  sendObligationToUser,
  SuilendClient,
} from "@suilend/sdk";
import { LendingPoolProvider } from "./BaseLendingProvider.ts";
import { btcCoinTypes } from "./config.ts";
import { AddressLendingInfo, LendingProtocol } from "@/services/types.ts";
import { Reserve } from "@suilend/sdk/_generated/suilend/reserve/structs";
import { ParsedReserve } from "@suilend/sdk/parsers";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { createObligationIfNoneExists } from "@suilend/sdk/lib/transactions";
import { ObligationOwnerCap } from "@suilend/sdk/_generated/suilend/lending-market/structs";
import { toDenominatedAmount } from "@/lib/helpers.ts";
import { suiClientMainnet } from '@/api/sui.ts';

const mainLendingMarket = {
  name: "Main market",
  slug: "main",
  id: "0x84030d26d85eaa7035084a057f2f11f701b7e2e4eda87551becbc7c97505ece1",
  type: "0xf95b06141ed4a174f239417323bde3f209b972f5930d8521ea38a52aff3a6ddf::suilend::MAIN_POOL",
  ownerCapId: "0xf7a4defe0b6566b6a2674a02a0c61c9f99bd012eed21bc741a069eaa82d35927",
};

class SuilendPoolProvider extends LendingPoolProvider {
  private suilendClient: SuilendClient;
  private refreshedRawReserves: Reserve<string>[];
  private reserveMap: Record<string, ParsedReserve>;
  private obligationOwnerCaps: ObligationOwnerCap<string>[];

  constructor() {
    super(LendingProtocol.SUILEND);
  }

  async getAddressInfo(address: string): Promise<AddressLendingInfo[]> {
    const suilendClient = await this.getSuilendClient();

    if (!this.refreshedRawReserves) {
      const { reserveMap, refreshedRawReserves } = await initializeSuilend(suiClientMainnet, suilendClient);

      this.refreshedRawReserves = refreshedRawReserves;
      this.reserveMap = reserveMap;
    }

    const result = await initializeObligations(
      suiClientMainnet,
      suilendClient,
      this.refreshedRawReserves,
      this.reserveMap,
      address,
    );

    this.obligationOwnerCaps = result.obligationOwnerCaps;

    const mainMarket = result.obligations.find(
      (obligation) =>
        obligation.original.$typeArgs[0] === LENDING_MARKETS.find((market) => market.slug === "main").type,
    );

    if (!mainMarket) {
      return [];
    }

    return mainMarket.deposits.map((deposit) => {
      const name = Object.entries(btcCoinTypes).find(([_, type]) => type === deposit.coinType)?.[0];

      return {
        name,
        coinType: deposit.coinType,
        supplyBalance: BigInt(deposit.depositedCtokenAmount.toNumber()),
        underlyingBalance: toDenominatedAmount(deposit.depositedAmount.toNumber(), deposit.reserve.token.decimals),
        protocol: LendingProtocol.SUILEND,
      };
    });
  }

  async supplyTx(coinType: string, address: string, amount: bigint): Promise<Transaction> {
    const tx = new Transaction();
    tx.setSender(address);

    const coin = coinWithBalance({
      type: coinType,
      balance: amount,
    });

    const suilendClient = await this.getSuilendClient();

    const { obligationOwnerCapId, didCreate } = createObligationIfNoneExists(
      suilendClient,
      tx,
      this.obligationOwnerCaps.find(
        (obligation) => obligation.$typeArgs[0] === LENDING_MARKETS.find((market) => market.slug === "main").type,
      ),
    );

    suilendClient.deposit(coin, coinType, obligationOwnerCapId, tx);

    if (didCreate) {
      sendObligationToUser(obligationOwnerCapId, address, tx);
    }

    return tx;
  }

  async withdrawTx(coinType: string, address: string, amount: bigint): Promise<Transaction> {
    const tx = new Transaction();
    tx.setSender(address);

    const suilendClient = await this.getSuilendClient();

    const obligationOwnerCap = this.obligationOwnerCaps.find(
      (obligation) => obligation.$typeArgs[0] === LENDING_MARKETS.find((market) => market.slug === "main").type,
    );

    await suilendClient.withdrawAndSendToUser(
      address,
      obligationOwnerCap.id,
      obligationOwnerCap.obligationId,
      coinType,
      amount.toString(),
      tx,
    );

    return tx;
  }

  private async getSuilendClient() {
    if (!this.suilendClient) {
      this.suilendClient = await SuilendClient.initialize(mainLendingMarket.id, mainLendingMarket.type, suiClientMainnet);
    }

    return this.suilendClient;
  }
}

const suilendPoolProvider = new SuilendPoolProvider();

export default suilendPoolProvider;
