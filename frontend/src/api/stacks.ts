import axios from "axios";

const SBTC_TOKEN = 'SN1Z0WW5SMN4J99A1G1725PAB8H24CWNA7Z8H7214.sbtc-token::sbtc-token'; // TODO: Support mainnet

const client = axios.create({
  baseURL: 'https://api.testnet.hiro.so', // TODO: Support mainnet
  timeout: 30_000,
});

export const StacksApi = {
  async getAddressBalances(address: string) {
    try {
      const result = await client.get(`/extended/v1/address/${address}/balances`);

      return {
        stxBalance: BigInt(result.data?.stx?.balance || 0),
        sbtcBalance: BigInt(result.data?.fungible_tokens?.[SBTC_TOKEN]?.balance || 0),
      }
    } catch {
      return undefined;
    }
  }
};
