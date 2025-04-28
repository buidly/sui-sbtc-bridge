import { suiClient } from "@/api/sui.ts";
import {
  formatRewards,
  getFilteredRewards,
  getTotalAprPercent,
  initializeObligations,
  initializeSuilend,
  initializeSuilendRewards,
  LENDING_MARKETS,
  sendObligationToUser,
  Side,
  SuilendClient,
} from "@suilend/sdk";
import { LendingPoolProvider } from "./BaseLendingProvider.ts";
import { btcCoinTypes } from "./config.ts";
import BigNumber from "bignumber.js";
import { AddressLendingInfo, LendingPool, LendingProtocol, RewardInfo } from "@/services/types.ts";
import { Reserve } from "@suilend/sdk/_generated/suilend/reserve/structs";
import { ParsedReserve } from "@suilend/sdk/parsers";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { createObligationIfNoneExists } from "@suilend/sdk/lib/transactions";
import { ObligationOwnerCap } from "@suilend/sdk/_generated/suilend/lending-market/structs";
import { toDenominatedAmount } from "@/lib/helpers.ts";

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

  async getPools(): Promise<LendingPool[]> {
    if (this.pools) {
      return this.pools;
    }

    const suilendClient = await this.getSuilendClient();
    const { lendingMarket, reserveMap, activeRewardCoinTypes, rewardCoinMetadataMap, refreshedRawReserves } =
      await initializeSuilend(suiClient, suilendClient);

    this.refreshedRawReserves = refreshedRawReserves;
    this.reserveMap = reserveMap;

    const { rewardPriceMap } = await initializeSuilendRewards(reserveMap, activeRewardCoinTypes);

    const rewardMap = formatRewards(reserveMap, rewardCoinMetadataMap, rewardPriceMap, []);
    this.pools = lendingMarket.reserves
      .filter((reserve: any) => Object.values(btcCoinTypes).includes(reserve.coinType))
      .map((reserve: any) => {
        // Get supply rewards and calculate APYs
        const supplyRewards = getFilteredRewards(rewardMap[reserve.coinType]?.[Side.DEPOSIT] ?? []);
        const supplyRewardInfos: RewardInfo[] = supplyRewards.map((reward) => ({
          symbol: reward.stats.symbol,
          apy: reward.stats.aprPercent.toNumber(),
        }));

        const stakingYieldAprPercent = new BigNumber(0);

        const baseSupplyApy = reserve.depositAprPercent;
        const baseRewardApy = supplyRewards.reduce(
          (total, reward) => total.plus(reward.stats.aprPercent || 0),
          new BigNumber(0),
        );
        const totalSupplyApy = getTotalAprPercent(Side.DEPOSIT, baseSupplyApy, supplyRewards, stakingYieldAprPercent);

        // Get borrow rewards and calculate APYs
        const borrowRewards = getFilteredRewards(rewardMap[reserve.coinType]?.[Side.BORROW] ?? []);
        const borrowRewardInfos: RewardInfo[] = borrowRewards.map((reward) => ({
          symbol: reward.stats.symbol,
          apy: reward.stats.aprPercent.toNumber(),
        }));

        const baseBorrowApy = reserve.borrowAprPercent;
        const borrowRewardApy = borrowRewards.reduce(
          (total, reward) => total.plus(reward.stats.aprPercent || 0),
          new BigNumber(0),
        );
        const totalBorrowApy = getTotalAprPercent(Side.BORROW, baseBorrowApy, borrowRewards, undefined);

        const name = Object.entries(btcCoinTypes).find(([_, type]) => type === reserve.coinType)?.[0];

        return {
          name,
          coinType: reserve.coinType,
          totalSupply: reserve.depositedAmount.toNumber(),
          totalBorrow: reserve.borrowedAmount.toNumber(),
          supplyApy: totalSupplyApy.toNumber(),
          borrowApy: totalBorrowApy.toNumber(),
          baseSupplyApy: baseSupplyApy.toNumber(),
          baseRewardApy: baseRewardApy.toNumber(),
          baseBorrowApy: baseBorrowApy.toNumber(),
          borrowRewardApy: borrowRewardApy.toNumber(),
          price: reserve.price.toNumber(),
          tvl: reserve.depositedAmountUsd.toNumber(),
          ltv: reserve.config.openLtvPct / 100,
          liquidationThreshold: reserve.config.closeLtvPct / 100,
          protocol: this.protocol,
          supplyRewards: supplyRewardInfos,
          borrowRewards: borrowRewardInfos,
        };
      });

    return this.pools;
  }

  async getAddressInfo(address: string): Promise<AddressLendingInfo[]> {
    const suilendClient = await this.getSuilendClient();
    const result = await initializeObligations(
      suiClient,
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

    await suilendClient.withdrawAndSendToUser(address, obligationOwnerCap.id, obligationOwnerCap.obligationId, coinType, amount.toString(), tx);

    return tx;
  }

  private async getSuilendClient() {
    if (!this.suilendClient) {
      this.suilendClient = await SuilendClient.initialize(mainLendingMarket.id, mainLendingMarket.type, suiClient);
    }

    return this.suilendClient;
  }
}

const suilendPoolProvider = new SuilendPoolProvider();

export default suilendPoolProvider;
