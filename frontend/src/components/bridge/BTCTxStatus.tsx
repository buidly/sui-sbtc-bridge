import React, { useMemo } from "react";
import { useApp } from "@/context/app.context.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { AlertCircle, Bitcoin, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import StepProgress from "@/components/StepProgress.tsx";
import { formatBalance, formatTrimmed, getExplorerUrlAddress, getExplorerUrlTransaction } from "@/lib/helpers.ts";
import { useDepositStatus } from "@/hooks/use-deposit-status.ts";
import bitcoinLogo from "@/assets/images/bitcoin_logo.svg";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";

export default function BTCTxStatus() {
  const { bridgeStepInfo, stacksAddressInfo } = useApp();

  const { recipient, stacksTxId, statusResponse, loading } = useDepositStatus(bridgeStepInfo.btcTxId);

  const btcAmount = useMemo(() => {
    return BigInt(statusResponse?.vout[0].value || 0);
  }, [statusResponse?.vout]);

  if (!stacksAddressInfo) {
    return (
      <Card className="bg-white/50 rounded-2xl p-4">
        <CardHeader className="space-y-1 max-w-lg mx-auto">
          <CardTitle className="text-xl font-bold text-center text-gray-600">
            Connect a Stacks wallet first
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white/50 rounded-2xl p-6 relative">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-6">
          <div className="bg-amber-500/20 rounded-full p-4">
            <Bitcoin className="h-10 w-10 text-orange-500" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center text-gray-800">
          Step 1 - Bridge Bitcoin Status
          {loading && <Loader2 className="inline-flex h-6 w-6 ml-2 animate-spin text-gray-500" />}
        </CardTitle>
        {(bridgeStepInfo.step === "BTC_SENT_PENDING" || bridgeStepInfo.step === "BTC_SENT_MINTING") && (
          <CardDescription className="text-center text-gray-500">Waiting for sBTC to arrive on Stacks</CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-0 max-w-md mx-auto w-full">
        <div className="flex flex-col gap-2 text-gray-500 font-semibold">
          <div className="flex justify-between items-center">
            <div>Amount</div>
            <div className="flex items-center">
              <span className="text-gray-800 font-bold">{formatBalance(btcAmount, 8)}</span>
              <span className="text-amber-400 ml-2">BTC</span>
              <img src={bitcoinLogo} alt={"Bitcoin Logo"} className="ml-1 h-4 w-4" />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>Stacks Address</div>
            <div className="flex items-center">
              <a href={getExplorerUrlAddress("STACKS", recipient)} target="_blank" className="underline">
                {formatTrimmed(recipient)}
              </a>
            </div>
          </div>
        </div>

        {(bridgeStepInfo.step === "BTC_SENT_PENDING" || bridgeStepInfo.step === "BTC_SENT_MINTING") && (
          <Alert variant="default" className="bg-white/50 border-gray-200 mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Waiting for BTC transaction to be confirmed
              <p>
                <strong>Bitcoin Tx Hash:</strong>{" "}
                <a
                  href={getExplorerUrlTransaction("BITCOIN", bridgeStepInfo.btcTxId)}
                  target="_blank"
                  className="underline"
                >
                  {formatTrimmed(bridgeStepInfo.btcTxId)}
                </a>
              </p>
              <p className="text-red-500 font-semibold">To avoid losing your progress, please keep this page open.</p>
            </AlertDescription>
          </Alert>
        )}

        {bridgeStepInfo.step === "BTC_FAILED" && (
          <Alert variant="destructive" className="bg-white/50 border-gray-200 mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-semibold">
              There was a problem confirming your BTC deposit. Please check the official Stacks dApp
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="p-0 max-w-md mx-auto w-full flex-col">
        <div className="w-full justify-between items-center mb-4">
          <a
            href={`https://bridge.sbtc-emily-dev.com/?txId=${bridgeStepInfo.btcTxId}&step=3&amount=${btcAmount}`}
            target="_blank"
          >
            <Button
              variant="default"
              size="lg"
              className={cn(
                "cursor-pointer w-full",
                // bridgeStepInfo.step === "BTC_FAILED"
                //   ? "from-red-400 to-red-600 hover:from-red-400/90 hover:to-red-600/90"
                //   : "from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700",
              )}
            >
              View on Stacks Bridge
            </Button>
          </a>
        </div>

        {bridgeStepInfo.step !== "BTC_FAILED" && (
          <StepProgress
            currentStep={
              bridgeStepInfo.step === "BTC_SENT_PENDING" ? 1 : bridgeStepInfo.step === "BTC_SENT_MINTING" ? 2 : 3
            }
          />
        )}

        {stacksTxId && (
          <div className="w-full justify-between items-center">
            <a href={getExplorerUrlTransaction("STACKS", stacksTxId)} target="_blank">
              <Button variant="default" size="xl" className="w-full">
                View Stacks transaction
              </Button>
            </a>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
