import React, { useMemo } from "react";
import { useApp } from "@/context/app.context.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { formatBalance, formatTrimmed, getExplorerUrlAddress, getExplorerUrlTransaction } from "@/lib/helpers.ts";
import { Button } from "@/components/ui/button.tsx";
import { useCrossChainStatus } from "@/hooks/use-cross-chain-status.ts";
import StepProgress from "@/components/StepProgress.tsx";

import suiLogo from "@/assets/images/sui_logo.svg";
import sbtcLogo from "@/assets/images/sbtc_logo.png";
import { useSponsoredTransactionStatus } from "@/hooks/use-sponsored-transaction-status.ts";
import stacksLogo from '@/assets/images/stacks_logo.svg';

export default function BridgeTxStatus() {
  const { bridgeStepInfo, updateBridgeStepInfo } = useApp();

  const { suiRecipientAddress, suiTxHash, stacksResponse, loading } = useCrossChainStatus(bridgeStepInfo?.stacksTxId);
  const { sponsoredTxResponse, loading: loadingSponsoredTx } = useSponsoredTransactionStatus(
    bridgeStepInfo?.sponsoredTxId,
  );

  const sbtcAmount = useMemo(() => {
    if (sponsoredTxResponse?.sbtcAmount) {
      return BigInt(sponsoredTxResponse?.sbtcAmount);
    }

    const sbtcCondition = (stacksResponse?.post_conditions || []).find((condition) => condition.type === "fungible");

    return BigInt(sbtcCondition?.amount || 0);
  }, [stacksResponse?.post_conditions, sponsoredTxResponse?.sbtcAmount]);

  return (
    <Card className="bg-white/50 rounded-2xl p-6 relative">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-2">
          <img src={stacksLogo} alt={"Stacks Logo"} className="h-8 w-8" /> <ArrowRight className="h-5 w-5 mx-1" />
          <img src={suiLogo} alt={"Sui Logo"} className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold text-center text-gray-800">
          Step 2 - Bridge sBTC Status
          {(loading || loadingSponsoredTx) && (
            <Loader2 className="inline-flex h-6 w-6 ml-1 animate-spin text-sky-400" />
          )}
        </CardTitle>
        {(bridgeStepInfo.step === "SBTC_SENT_PENDING" || bridgeStepInfo.step === "SBTC_SENT_BRIDGING") && (
          <CardDescription className="text-center text-gray-500">Waiting for sBTC to arrive on Sui</CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-0 max-w-md mx-auto w-full">
        <div className="flex flex-col gap-2 text-gray-500 font-semibold">
          <div className="flex justify-between items-center">
            <div>Amount</div>
            <div className="flex items-center">
              <span className="text-gray-800 font-bold">{formatBalance(sbtcAmount, 8)}</span>
              <span className="text-amber-400 ml-2">sBTC</span>
              <img src={sbtcLogo} alt={"sBTC Logo"} className="ml-1 h-4 w-4" />
            </div>
          </div>
          {suiRecipientAddress && (
            <div className="flex justify-between items-center">
              <div>Sui Address</div>
              <div className="flex items-center">
                <a href={getExplorerUrlAddress("SUI", suiRecipientAddress)} target="_blank" className="underline">
                  {formatTrimmed(suiRecipientAddress)}
                </a>
              </div>
            </div>
          )}
        </div>

        {(bridgeStepInfo.step === "SBTC_SENT_PENDING" || bridgeStepInfo.step === "SBTC_SENT_BRIDGING") && (
          <Alert variant="default" className="bg-white/50 border-gray-200 mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Waiting for sBTC transaction to be confirmed
              {sponsoredTxResponse?.stxTransactionHash && (
                <p>
                  <strong>Sponsored Tx Hash:</strong>{" "}
                  <a
                    href={getExplorerUrlTransaction("STACKS", sponsoredTxResponse?.stxTransactionHash)}
                    target="_blank"
                    className="underline"
                  >
                    {formatTrimmed(sponsoredTxResponse?.stxTransactionHash)}
                  </a>
                </p>
              )}
              {bridgeStepInfo.stacksTxId && (
                <p>
                  <strong>Stacks Tx Hash:</strong>{" "}
                  <a
                    href={getExplorerUrlTransaction("STACKS", bridgeStepInfo.stacksTxId)}
                    target="_blank"
                    className="underline"
                  >
                    {formatTrimmed(bridgeStepInfo.stacksTxId)}
                  </a>
                </p>
              )}
              <p className="text-red-500 font-semibold">To avoid losing your progress, please keep this page open.</p>
            </AlertDescription>
          </Alert>
        )}

        {bridgeStepInfo.step === "SBTC_COMPLETED" && (
          <Alert variant="default" className="bg-white/50 border-gray-200 mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-semibold">Transaction was succesfully confirmed and sBTC was bridged to Sui!</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="p-0 max-w-md mx-auto w-full flex-col">
        {bridgeStepInfo.step !== "SBTC_SENT_PENDING" && (
          <div className="w-full justify-between items-center">
            <a href={`https://devnet-amplifier.axelarscan.io/gmp/${bridgeStepInfo.stacksTxId}`} target="_blank">
              <Button variant="default" size="lg" className="cursor-pointer w-full bg-sky-500">
                View on Axelar Explorer
              </Button>
            </a>
          </div>
        )}

        <StepProgress
          currentStep={
            bridgeStepInfo.step === "SBTC_SENT_PENDING" ? 1 : bridgeStepInfo.step === "SBTC_SENT_BRIDGING" ? 2 : 3
          }
          steps={["Pending", "Bridging", "Completed"]}
          accentColor="sky"
        />

        {bridgeStepInfo.step === "SBTC_COMPLETED" && (
          <div className="w-full flex-row flex justify-between items-center gap-4">
            {suiTxHash && (
              <a href={getExplorerUrlTransaction("SUI", suiTxHash)} target="_blank" className="basis-1/2">
                <Button variant="default" size="xl" className="w-full bg-sky-500">
                  View Sui tx
                </Button>
              </a>
            )}

            <Button
              variant="default"
              size="xl"
              className={
                `cursor-pointer ${suiTxHash ? 'basis-1/2' : 'w-full'}`
              }
              onClick={() => updateBridgeStepInfo()}
            >
              Bridge again
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
