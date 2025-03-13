import React from "react";
import { useApp } from "@/context/app.context.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { formatTrimmed, getExplorerUrlAddress, getExplorerUrlTransaction } from "@/lib/helpers.ts";
import { Button } from "@/components/ui/button.tsx";
import suiLogo from "@/assets/images/sui_logo.svg";
import { useCrossChainStatus } from "@/hooks/use-cross-chain-status.ts";

export default function BridgeTxStatus() {
  const { suiAddress, bridgeStepInfo, updateBridgeStepInfo } = useApp();

  const { statusResponse, loading } = useCrossChainStatus(bridgeStepInfo.stacksTxId);

  return (
    <Card className="bg-slate-50/5 border-slate-700 shadow-xl backdrop-blur-sm gap-4">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-2">
          <img src={suiLogo} alt={"Sui Logo"} className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold text-center text-white">
          Step 4 - Bridge sBTC Tx Status
          {loading && <Loader2 className="inline-flex h-6 w-6 ml-1 animate-spin text-sky-400" />}
        </CardTitle>
        {bridgeStepInfo.step === "SBTC_SENT" && (
          <CardDescription className="text-center text-slate-400">Waiting for sBTC to arrive on Sui</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 text-slate-300">
          <div className="space-y-2">
            {/*<p className="mb-0 flex items-center">*/}
            {/*  <strong className="mr-1">Amount:</strong> {formatBalance(btcAmount, 8)} BTC{" "}*/}
            {/*  <img src={bitcoinLogo} alt={"Bitcoin Logo"} className="ml-1 h-4 w-4" />*/}
            {/*</p>*/}

            <p>
              <strong>Sui Address:</strong>{" "}
              <a href={getExplorerUrlAddress("STACKS", suiAddress)} target="_blank" className="underline">
                {formatTrimmed(suiAddress)}
              </a>
            </p>
          </div>
        </div>

        {bridgeStepInfo.step === "SBTC_SENT" && (
          <Alert variant="default" className="bg-amber-50 border-amber-200 mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Waiting for sBTC transaction to be confirmed
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
              <p className="text-red-500">To avoid losing your progress, please keep this page open.</p>
            </AlertDescription>
          </Alert>
        )}

        {bridgeStepInfo.step === "SBTC_COMPLETED" && (
          <Alert variant="default" className="bg-sky-50 border-sky-200 mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Transaction was succesfully confirmed and sBTC was bridged to Sui!</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex-col">
        <div className="w-full flex-row flex justify-between items-center">
          <a href={`https://devnet-amplifier.axelarscan.io/gmp/${bridgeStepInfo.stacksTxId}`} target="_blank">
            <Button className="cursor-pointer w-full bg-gradient-to-r from-sky-400 to-sky-700 hover:from-sky-400/90 hover:to-sky-700/90">
              View on Axelar Explorer
            </Button>
          </a>

          {bridgeStepInfo.step === "SBTC_COMPLETED" && (
            <Button
              className={
                "cursor-pointer bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              }
              onClick={() => updateBridgeStepInfo()}
            >
              Bridge again
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
