/// Code loosely from https://github.com/stacks-network/sbtc-bridge/blob/main/src/hooks/use-deposit-status.ts

import { useEffect, useMemo, useState } from "react";
import { Cl, PrincipalCV } from "@stacks/transactions";
import { EMILY_WRAPPER_URL } from "@/hooks/use-emily-deposit.ts";
import { BitcoinApi } from "@/api/bitcoin.ts";
import { useApp } from "@/context/app.context.tsx";
import { useBalances } from "@/context/balances.context.tsx";

export enum DepositStatus {
  PendingConfirmation = "pending",
  Completed = "confirmed",
}

// From https://github.com/stacks-network/sbtc-bridge/blob/main/src/util/tx-utils.ts#L43C1-L62C3
const getEmilyDepositInfo = async (txId: string) => {
  const searchParams = new URLSearchParams();
  searchParams.append("bitcoinTxid", txId);
  searchParams.append("vout", "0");
  const response = await fetch(`${EMILY_WRAPPER_URL}?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await response.json();
};

export function useDepositStatus(txId: string) {
  const { bridgeStepInfo, updateBridgeStepInfo, stacksAddressInfo } = useApp();

  const [emilyResponse, setEmilyResponse] = useState(null);
  const [statusResponse, setStatusResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const RECLAIM_LOCK_TIME = 18;
  const POLLING_INTERVAL = 10_000;

  const recipient = useMemo(() => {
    const temp = emilyResponse?.recipient || "";

    if (!temp) {
      return null;
    }

    return (Cl.deserialize(temp) as PrincipalCV).value;
  }, [emilyResponse]);

  const stacksTxId = useMemo(() => {
    return (emilyResponse?.status === DepositStatus.Completed && emilyResponse.fulfillment.StacksTxid) || "";
  }, [emilyResponse]);

  const { getStacksBalances } = useBalances();

  useEffect(() => {
    if (
      txId &&
      stacksAddressInfo &&
      bridgeStepInfo?.step !== "BTC_COMPLETED" &&
      bridgeStepInfo?.step !== "BTC_FAILED"
    ) {
      const check = async () => {
        setLoading(true);

        const info = await BitcoinApi.getRawTransaction(txId);

        const txInfo = await getEmilyDepositInfo(txId);
        setEmilyResponse(txInfo);

        // Check if transaction is not found or if Stacks address is not correct
        if (
          !info ||
          (txInfo &&
            txInfo.recipient &&
            (Cl.deserialize(txInfo.recipient) as PrincipalCV).value !== stacksAddressInfo.address)
        ) {
          // TODO: Handle this better in the future
          console.error("Could not retrieve bitcoin transaction");
          updateBridgeStepInfo(null, null);
          clearInterval(interval);
          setLoading(false);

          return;
        }
        setStatusResponse(info);

        if (info.status.confirmed) {
          if (txInfo.status === DepositStatus.Completed) {
            updateBridgeStepInfo("BTC_COMPLETED", txId);
            clearInterval(interval);
            // This works here for Stacks because stacksAddress is set before the setInterval
            // However a useEffect doesn't work because the updateBridgeStepInfo doesn't update the object just a property
            getStacksBalances();
            setLoading(false);

            return;
          }

          const currentBlockHeight = await BitcoinApi.getCurrentBlockHeight();

          const unlockBlock = Number(RECLAIM_LOCK_TIME || 144) + info.status.block_height - 1;

          const isPastLockTime = currentBlockHeight >= unlockBlock;
          if (isPastLockTime) {
            updateBridgeStepInfo("BTC_FAILED", txId);
            clearInterval(interval);
            setLoading(false);

            return;
          }

          updateBridgeStepInfo(
            (txInfo.status as DepositStatus) === DepositStatus.PendingConfirmation
              ? "BTC_SENT_PENDING"
              : "BTC_SENT_MINTING",
            txId,
          );
        }
      };
      check();
      const interval = setInterval(check, POLLING_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [POLLING_INTERVAL, RECLAIM_LOCK_TIME, txId, stacksAddressInfo]);

  return {
    recipient,
    stacksTxId: stacksTxId,
    statusResponse,
    loading,
  };
}
