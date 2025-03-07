/// Code loosly from https://github.com/stacks-network/sbtc-bridge/blob/main/src/util/use-emily-deposit.ts

/// Further reference: https://docs.stacks.co/concepts/sbtc/emily

import { useMutation } from "@tanstack/react-query";

const EMILY_URL = 'https://bridge.sbtc-emily-dev.com/api/emilyDeposit'; // TODO: Update

const expBackoff = (attempt: number) => Math.min(2 ** attempt, 30) * 1000;
export const useEmilyDeposit = () => {
  const { mutateAsync, failureCount, isPending } = useMutation({
    mutationFn: async (params: {
      bitcoinTxid: string;
      bitcoinTxOutputIndex: number;
      reclaimScript: string;
      depositScript: string;
    }) => {
      console.log({ emilyReqPayloadClient: JSON.stringify(params) });
      const res = await fetch(EMILY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        if (failureCount > 2) {
          alert('Error creating deposit retrying...')
        }

        throw res;
      }
      return res;
    },
    retryDelay: expBackoff,
    retry: true,
  });
  return { notifyEmily: mutateAsync, isPending };
};
