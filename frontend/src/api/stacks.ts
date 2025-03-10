import axios from "axios";
import { BufferCV, fetchCallReadOnlyFunction } from "@stacks/transactions";

const STACKS_NETWORK = 'testnet'; // TODO: Update for mainnet

const SBTC_TOKEN = 'SN1Z0WW5SMN4J99A1G1725PAB8H24CWNA7Z8H7214.sbtc-token::sbtc-token'; // TODO: Support mainnet
export const SBTC_TOKEN_CONTRACT = SBTC_TOKEN.split('::')[0] as `${string}.${string}`;
const SBTC_CONTRACT_DEPLOYER = 'SN1Z0WW5SMN4J99A1G1725PAB8H24CWNA7Z8H7214';

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
  },

  async getAggregateKey() {
    const result = (await fetchCallReadOnlyFunction({
      contractName: "sbtc-registry",
      contractAddress: SBTC_CONTRACT_DEPLOYER!,
      functionName: "get-current-aggregate-pubkey",
      functionArgs: [],
      network: STACKS_NETWORK,
      senderAddress: SBTC_CONTRACT_DEPLOYER!,
      client: {
        baseUrl: client.defaults.baseURL,
      },
    })) as BufferCV;

    return result.value;
  }
};
