import axios from "axios";

const client = axios.create({
  baseURL: "https://beta.sbtc-mempool.tech/api/proxy", // TODO: Support mainnet
  timeout: 30_000,
});

export const BitcoinApi = {
  async getAddressBalance(address: string) {
    try {
      const result = await client.get(`/address/${address}`);

      return result.data?.chain_stats?.funded_txo_sum as bigint;
    } catch {
      return 0n;
    }
  },

  async getRawTransaction(txId: string) {
    try {
      const result = await client.get(`/tx/${txId}`);

      return result.data;
    } catch {
      return null;
    }
  },

  async getCurrentBlockHeight() {
    try {
      const result = await client.get(`/blocks/tip/height`);

      return Number(result.data);
    } catch {
      return null;
    }
  }
};
