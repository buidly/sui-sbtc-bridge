import React from "react";
import { useApp } from "@/context/app.context.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { AlertCircle, Bitcoin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import StepProgress from "@/components/StepProgress.tsx";

export default function BTCTxStatus() {
  const { bridgeStepInfo } = useApp();

  if (!bridgeStepInfo) {
    return undefined;
  }

  return (
    <div className="flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg gap-4">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <Bitcoin className="h-10 w-10 text-orange-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Step 2 - sBTC Tx Status</CardTitle>
          <CardDescription className="text-center">Waiting for sBTC to arrive on Stacks</CardDescription>
        </CardHeader>
        <CardContent>
          {bridgeStepInfo.step === "BTC_SENT_PENDING" ? (
            <>
              <Alert variant="default" className="bg-amber-50 text-amber-800 border-amber-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Waiting for BTC transaction {bridgeStepInfo.btcTxId} to be confirmed
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <></>
          )}
        </CardContent>
        <CardFooter>
          <StepProgress currentStep={1} />
        </CardFooter>
      </Card>
    </div>
  );
}
