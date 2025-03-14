import { useApp } from "@/context/app.context.tsx";
import { useEffect, useState } from "react";
import { AxelarApi } from "@/api/axelar.ts";
import { useBalances } from "@/context/balances.context.tsx";
import { StacksApi } from "@/api/stacks.ts";

export function useCrossChainStatus(txId: string) {
  const { bridgeStepInfo, updateBridgeStepInfo } = useApp();

  const [stacksResponse, setStacksResponse] = useState(null);
  const [suiTxHash, setSuiTxHash] = useState(null);
  const [suiRecipientAddress, setSuiRecipientAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  const { getSuiBalances } = useBalances();

  useEffect(() => {
    if (!txId) {
      return;
    }

    if (bridgeStepInfo?.step === "SBTC_SENT_PENDING") {
      const check = async () => {
        setLoading(true);

        const txInfo = await StacksApi.getTransaction(txId);

        if (!txInfo) {
          // TODO: Handle this better in the future
          console.error("Could not retrieve Stacks transaction");
          updateBridgeStepInfo(null, null);
          clearInterval(interval);
          setLoading(false);

          return;
        }
        setStacksResponse(txInfo);

        if (txInfo.tx_status === "success") {
          updateBridgeStepInfo("SBTC_SENT_BRIDGING", bridgeStepInfo.btcTxId, txId);
          clearInterval(interval);
          setLoading(false);

          return;
        }

        updateBridgeStepInfo("SBTC_SENT_PENDING", bridgeStepInfo.btcTxId, txId);
      };
      check();
      const interval = setInterval(check, 10_000);
      return () => clearInterval(interval);
    }

    if (bridgeStepInfo?.step === "SBTC_SENT_BRIDGING") {
      const check = async () => {
        setLoading(true);

        const info = await AxelarApi.getTransactionData(txId);

        if (info === null) {
          // Allow non-existent transactions because it takes a bit for the cross chain transaction to be relayed
          return;
        }

        setSuiRecipientAddress((info?.[1] || info?.[0])?.interchain_transfer?.destinationAddress || null);

        // TODO: Check if connected Bitcoin & Stacks wallets belong to the correct address for this transaction
        if (info.length === 2) {
          if (info[0].status === "executed") {
            setSuiTxHash(info[0].executed.transactionHash);
            updateBridgeStepInfo("SBTC_COMPLETED", bridgeStepInfo.btcTxId, txId);
            clearInterval(interval);
            setLoading(false);

            return;
          }
        }

        updateBridgeStepInfo("SBTC_SENT_BRIDGING", bridgeStepInfo.btcTxId, txId);
      };
      check();
      const interval = setInterval(check, 10_000);
      return () => clearInterval(interval);
    }
  }, [txId, bridgeStepInfo?.step]);

  // Need this useEffect because the setInterval will store an older version of some functions
  useEffect(() => {
    if (bridgeStepInfo && bridgeStepInfo.step === "SBTC_COMPLETED") {
      getSuiBalances();
    }
  }, [bridgeStepInfo]);

  return {
    suiRecipientAddress,
    suiTxHash,
    stacksResponse,
    loading,
  };
}
