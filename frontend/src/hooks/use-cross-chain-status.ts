import { useApp } from "@/context/app.context.tsx";
import { useEffect, useState } from "react";
import { AxelarApi } from "@/api/axelar.ts";

export function useCrossChainStatus(txId: string) {
  const { bridgeStepInfo, updateBridgeStepInfo } = useApp();

  const [axelarResponse, setAxelarResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (txId && bridgeStepInfo?.step !== "SBTC_COMPLETED") {
      const check = async () => {
        setLoading(true);

        const info = await AxelarApi.getTransactionData(txId);

        if (!info) {
          // TODO: Handle this better in the future
          console.error("Could not retrieve Axelar transaction");
          updateBridgeStepInfo(null, null);
          clearInterval(interval);
          setLoading(false);

          return;
        }
        setAxelarResponse(info);

        // TODO: Check if connected Bitcoin & Stacks wallets belong to the correct address for this transaction
        if (info.status === "executed") {
          if (info.simplified_status === "received") {
            // TODO: Update Sui address sBTC balance
            updateBridgeStepInfo("SBTC_COMPLETED", bridgeStepInfo.btcTxId, txId); // TODO: Add Sui transaction hash
            clearInterval(interval);
            setLoading(false);

            return;
          }

          updateBridgeStepInfo("SBTC_SENT", bridgeStepInfo.btcTxId, txId);
        }
      };
      check();
      const interval = setInterval(check, 10_000);
      return () => clearInterval(interval);
    }
  }, [txId]);

  return {
    statusResponse: axelarResponse,
    loading,
  };
}
