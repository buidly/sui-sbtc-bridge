import axios from "axios";
import { ENV } from "@/lib/env.ts";
import { CoinMetadata } from "@mysten/sui/client";
import { LendingPool } from "@/services/types.ts";

export const SponsoredTransactionStatus = {
  PENDING: "PENDING",
  PENDING_STX: "PENDING_STX",
  PENDING_SPONSORED: "PENDING_SPONSORED",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
};

export interface SponsoredTransaction {
  id: string;
  stacksAddress: string;
  suiAddress: string;
  sbtcAmount: string;
  status: typeof SponsoredTransactionStatus;
  originalTransaction: string;
  stxTransactionHash: string | null;
  sponsoredTransactionHash: string | null;
  retry: number;
  createdAt: Date;
  updatedAt: Date;
}

const client = axios.create({
  baseURL: ENV.MICROSERVICE_URL,
  timeout: 30_000,
});

export const MicroserviceApi = {
  async sendSponsoredTransaction(rawTransaction: string): Promise<string | null> {
    try {
      const result = await client.post(`/sponsored-transactions/send`, {
        rawTransaction,
      });

      return result.data?.sponsoredTransactionId;
    } catch (e) {
      return null;
    }
  },

  async getSponsoredTransaction(id: string): Promise<SponsoredTransaction | null> {
    try {
      const result = await client.get(`/sponsored-transactions/${id}`);

      return result.data as SponsoredTransaction;
    } catch (e) {
      return null;
    }
  },

  async getSuiBtcCoins(): Promise<{ [coinType: string]: CoinMetadata }> {
    try {
      const result = await client.get(`/general/sui/btc-coins`);

      return result.data;
    } catch (e) {
      return {};
    }
  },

  async getLendingBtcPools(): Promise<{
    pools: LendingPool[];
    coinsMetadata: { [coinType: string]: CoinMetadata };
  }> {
    try {
      const result = await client.get(`/lending/btc-pools`);

      return result.data;
    } catch (e) {
      return {
        pools: [],
        coinsMetadata: {},
      };
    }
  },
};
