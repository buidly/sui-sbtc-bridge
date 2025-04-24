import { useApp } from "@/context/app.context.tsx";
import { Card, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import SendBTCForm from "@/components/bridge/SendBTCForm.tsx";
import BTCTxStatus from "@/components/bridge/BTCTxStatus.tsx";
import BridgeSBTCForm from "@/components/bridge/BridgeSBTCForm.tsx";
import BridgeTxStatus from "@/components/bridge/BridgeTxStatus.tsx";
import React from "react";
import BitcoinConnect from "@/components/BitcoinConnect.tsx";
import SuiConnect from "@/components/SuiConnect.tsx";
import StacksConnect from "@/components/StacksConnect.tsx";

export default function Bridge() {
  const { stacksAddressInfo, btcAddressInfo, bridgeStepInfo } = useApp();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <BitcoinConnect />
        <SuiConnect />
        <StacksConnect />
      </div>

      <div className="flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {!bridgeStepInfo &&
            (!btcAddressInfo ||
              !stacksAddressInfo ||
              ((!bridgeStepInfo?.step || bridgeStepInfo?.step === "BTC_COMPLETED") &&
                stacksAddressInfo?.type === "GENERATED" &&
                !stacksAddressInfo?.privateKey)) && (
              <Card className="bg-slate-50/5 border-slate-700 shadow-xl backdrop-blur-sm">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-center text-white">
                    Connect a Bitcoin & Stacks wallet first
                  </CardTitle>
                </CardHeader>
              </Card>
            )}

          {!bridgeStepInfo?.step ? (
            <SendBTCForm />
          ) : bridgeStepInfo.step === "BTC_SENT_PENDING" ||
            bridgeStepInfo.step === "BTC_SENT_MINTING" ||
            bridgeStepInfo.step === "BTC_FAILED" ? (
            <BTCTxStatus />
          ) : bridgeStepInfo.step === "BTC_COMPLETED" ? (
            <BridgeSBTCForm />
          ) : bridgeStepInfo.step === "SBTC_SENT_PENDING" ||
            bridgeStepInfo.step === "SBTC_SENT_BRIDGING" ||
            bridgeStepInfo.step === "SBTC_COMPLETED" ? (
            <BridgeTxStatus />
          ) : undefined}
        </div>
      </div>
    </>
  );
}
