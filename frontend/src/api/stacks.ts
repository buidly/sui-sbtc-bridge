import axios from "axios";
import { BufferCV, fetchCallReadOnlyFunction } from "@stacks/transactions";
import { ENV } from "@/lib/env.ts";

export const STACKS_NETWORK = ENV.STACKS_API.includes("testnet") ? "testnet" : "mainnet";

export const SBTC_TOKEN_CONTRACT = `${ENV.STACKS_SBTC_CONTRACT_DEPLOYER}.sbtc-token` as `${string}.${string}`;
const SBTC_TOKEN = `${SBTC_TOKEN_CONTRACT}::sbtc-token`;

export interface Transaction {
  tx_id: string;
  sender_address: string;
  tx_status: "success" | "pending" | "error";
  post_conditions: {
    amount: string;
    type: string;
  }[]
}

const client = axios.create({
  baseURL: ENV.STACKS_API,
  timeout: 30_000,
});

export const StacksApi = {
  async getAddressBalances(address: string) {
    try {
      const result = await client.get(`/extended/v1/address/${address}/balances`);

      return {
        stxBalance: BigInt(result.data?.stx?.balance || 0),
        sbtcBalance: BigInt(result.data?.fungible_tokens?.[SBTC_TOKEN]?.balance || 0),
      };
    } catch {
      return undefined;
    }
  },

  async getAggregateKey() {
    const result = (await fetchCallReadOnlyFunction({
      contractName: "sbtc-registry",
      contractAddress: ENV.STACKS_SBTC_CONTRACT_DEPLOYER,
      functionName: "get-current-aggregate-pubkey",
      functionArgs: [],
      network: STACKS_NETWORK,
      senderAddress: ENV.STACKS_SBTC_CONTRACT_DEPLOYER,
      client: {
        baseUrl: client.defaults.baseURL,
      },
    })) as BufferCV;

    return result.value;
  },

  async getTransaction(txHash: string): Promise<Transaction | undefined> {
    try {
      const response = await client.get(`/extended/v1/tx/${txHash}`);

      return response.data;
    } catch {
      return undefined;
    }
  }
};
