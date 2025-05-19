import React from "react";
import { useApp } from "@/context/app.context.tsx";
import { Card, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import SendBTCForm from "@/components/bridge/SendBTCForm.tsx";
import BTCTxStatus from "@/components/bridge/BTCTxStatus.tsx";
import BridgeSBTCForm from "@/components/bridge/BridgeSBTCForm.tsx";
import BridgeTxStatus from "@/components/bridge/BridgeTxStatus.tsx";
import BitcoinConnect from "@/components/BitcoinConnect.tsx";
import SuiConnect from "@/components/SuiConnect.tsx";
import StacksConnect from "@/components/StacksConnect.tsx";

export default function Bridge() {
  const { stacksAddressInfo, btcAddressInfo, bridgeStepInfo } = useApp();

  return (
    <div className="container max-w-5xl contain mx-auto bg-white/30 backdrop-blur-lg rounded-2xl p-6 shadow flex flex-col gap-6">
      <h2 className="text-3xl font-bold text-slate-700 text-center">
        BTC Bridge
      </h2>

      <div className="flex gap-4 justify-between">
        <BitcoinConnect />
        <SuiConnect />
        <StacksConnect />
      </div>

      <div className="flex items-center justify-center">
        <div className="w-full">
          {!bridgeStepInfo &&
            (!btcAddressInfo ||
              !stacksAddressInfo ||
              ((!bridgeStepInfo?.step || bridgeStepInfo?.step === "BTC_COMPLETED") &&
                stacksAddressInfo?.type === "GENERATED" &&
                !stacksAddressInfo?.privateKey)) && (
              <Card className="bg-slate-200 rounded-2xl p-4">
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
    </div>
  );
}
