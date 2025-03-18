import { useApp } from "@/context/app.context.tsx";
import { useEffect, useState } from "react";
import { MicroserviceApi, SponsoredTransaction } from '@/api/microservice.ts';

export function useSponsoredTransactionStatus(sponsoredTxId: string) {
  const { bridgeStepInfo, updateBridgeStepInfo } = useApp();

  const [sponsoredTxResponse, setSponsoredTxResponse] = useState<SponsoredTransaction | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sponsoredTxId) {
      return;
    }

    if (bridgeStepInfo?.step === "SBTC_SENT_PENDING") {
      const check = async () => {
        setLoading(true);

        const response = await MicroserviceApi.getSponsoredTransaction(sponsoredTxId);

        if (!response) {
          // TODO: Handle this better in the future
          console.error("Could not retrieve Sponsored transaction");
          updateBridgeStepInfo(null, null);
          clearInterval(interval);
          setLoading(false);

          return;
        }
        setSponsoredTxResponse(response);

        if (response.sponsoredTransactionHash) {
          updateBridgeStepInfo(
            "SBTC_SENT_PENDING",
            bridgeStepInfo.btcTxId,
            response.sponsoredTransactionHash,
            sponsoredTxId,
          );
          clearInterval(interval);
          setLoading(false);

          return;
        }
      };
      check();
      const interval = setInterval(check, 12_000);
      return () => clearInterval(interval);
    }
  }, [sponsoredTxId, bridgeStepInfo?.step]);

  return {
    sponsoredTxResponse,
    loading,
  };
}
