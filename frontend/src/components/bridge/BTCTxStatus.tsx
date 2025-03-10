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
  const { bridgeStepInfo } = useApp();

  const { recipient, stacksTxId, statusResponse, loading } = useDepositStatus(bridgeStepInfo.btcTxId);

  const btcAmount = useMemo(() => {
    return BigInt(statusResponse?.vout[0].value || 0);
  }, [statusResponse?.vout]);

  return (
    <div className="flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg shadow-lg gap-4">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <Bitcoin className="h-10 w-10 text-orange-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Step 2 - sBTC Tx Status
            {loading && <Loader2 className="inline-flex h-6 w-6 ml-1 animate-spin text-orange-500" />}
          </CardTitle>
          {bridgeStepInfo.step === "BTC_SENT_PENDING" ||
            (bridgeStepInfo.step === "BTC_SENT_MINTING" && (
              <CardDescription className="text-center">Waiting for sBTC to arrive on Stacks</CardDescription>
            ))}
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="space-y-2">
              <p className="mb-0 flex items-center">
                <strong className="mr-1">Amount:</strong> {formatBalance(btcAmount, 8)} BTC{" "}
                <img src={bitcoinLogo} alt={"Bitcoin Logo"} className="ml-1 h-4 w-4" />
              </p>

              <p>
                <strong>Stacks Address:</strong>{" "}
                <a href={getExplorerUrlAddress("STACKS", recipient)} target="_blank" className="underline">
                  {formatTrimmed(recipient)}
                </a>
              </p>
            </div>
          </div>

          {bridgeStepInfo.step === "BTC_SENT_PENDING" ||
            (bridgeStepInfo.step === "BTC_SENT_MINTING" && (
              <Alert variant="default" className="bg-amber-50 border-amber-200 mt-3">
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
                  <p className="text-red-500">To avoid losing your progress, please keep this page open.</p>
                </AlertDescription>
              </Alert>
            ))}

          {bridgeStepInfo.step === "BTC_FAILED" && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                There was a problem confirming your BTC deposit. Please check the official Stacks dApp
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex-col">
          <div className="w-full flex-row flex justify-between items-center">
            <a
              href={`https://bridge.sbtc-emily-dev.com/?txId=${bridgeStepInfo.btcTxId}&step=3&amount=${btcAmount}`}
              target="_blank"
            >
              <Button
                className={cn(
                  "cursor-pointer",
                  bridgeStepInfo.step === "BTC_FAILED"
                    ? "bg-red-400 hover:bg-red-400/90 "
                    : "bg-orange-400 hover:bg-orange-400/90",
                )}
              >
                View on Stacks Bridge dApp
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
            <div className="w-full flex-row flex justify-between items-center">
              <a href={getExplorerUrlTransaction("STACKS", stacksTxId)} target="_blank">
                <Button className="bg-orange-400 hover:bg-orange-400/90 cursor-pointer">View stacks tx</Button>
              </a>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
