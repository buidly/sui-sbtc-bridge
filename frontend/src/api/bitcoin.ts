import axios from "axios";

const client = axios.create({
  baseURL: 'https://beta.sbtc-mempool.tech', // TODO: Support mainnet
  timeout: 30_000,
});

export const BitcoinApi = {
  async getAddressBalance(address: string) {
    try {
      const result = await client.get(`/api/proxy/address/${address}`);

      return result.data?.chain_stats?.funded_txo_sum as bigint;
    } catch {
      return 0n;
    }
  }
};
