import { useApp } from "@/context/app.context.tsx";
import { useEffect, useState } from "react";
import { AxelarApi } from "@/api/axelar.ts";
import { useBalances } from "@/context/balances.context.tsx";

export function useCrossChainStatus(txId: string) {
  const { bridgeStepInfo, updateBridgeStepInfo } = useApp();

  const [axelarResponse, setAxelarResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const { getSuiBalances } = useBalances();

  useEffect(() => {
    if (txId && bridgeStepInfo?.step !== "SBTC_COMPLETED") {
      const check = async () => {
        setLoading(true);

        const info = await AxelarApi.getTransactionData(txId);

        if (!info) {
          // TODO: For now allow non-existent transactions because it takes a bit for the cross chain transaction to be relayed
          // TODO: Handle this better in the future
          // console.error("Could not retrieve Axelar transaction");
          // updateBridgeStepInfo(null, null);
          // clearInterval(interval);
          // setLoading(false);

          return;
        }
        setAxelarResponse(info);

        // TODO: Check if connected Bitcoin & Stacks wallets belong to the correct address for this transaction
        if (info.status === "executed") {
          if (info.simplified_status === "received") {
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

  // Need this useEffect because the setInterval will store an older version of some functions
  useEffect(() => {
    if (bridgeStepInfo && bridgeStepInfo.step === 'SBTC_COMPLETED') {
      getSuiBalances();
    }
  }, [bridgeStepInfo]);

  return {
    statusResponse: axelarResponse,
    loading,
  };
}
