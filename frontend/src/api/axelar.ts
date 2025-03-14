import axios from "axios";
import { ENV } from "@/lib/env.ts";

const client = axios.create({
  baseURL: `${ENV.AXELAR_AMPLIFIER_API}/gmp/searchGMP`,
  timeout: 30_000,
});

interface AxelarTransaction {
  amount: number;
  confirm_failed: boolean;
  confirm_failed_event: null;
  execute_nonce: null;
  execute_pending_transaction_hash: null;
  gas_status: string;
  id: string;
  interchain_transfer: {
    amount: string;
    decimals: number;
    destinationAddress: string;
    destinationChain: string;
    name: string;
    sourceAddress: string;
    symbol: string;
    tokenId: string;
  };
  message_id: string;
  simplified_status: string;
  status: string;
  symbol: string;
  executed: {
    chain: string;
    transactionHash: string;
  };
}

export const AxelarApi = {
  async getTransactionData(txHash: string): Promise<AxelarTransaction[] | null> {
    try {
      const result = await client.post("", {
        txHash,
      });

      if (!result.data?.total) {
        return null;
      }

      const firstTransaction: AxelarTransaction | null = result.data?.data?.[0] || null;

      if (!firstTransaction) {
        return null;
      }

      if (firstTransaction.status === "executed") {
        const newResult = await client.post("", {
          txHash: firstTransaction.executed.transactionHash,
        });

        return newResult.data?.data || null;
      }

      return [firstTransaction];
    } catch {
      return null;
    }
  },
};
