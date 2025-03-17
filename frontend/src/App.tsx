import BitcoinConnect from "@/components/BitcoinConnect";
import BridgeSBTCForm from "@/components/bridge/BridgeSBTCForm.tsx";
import BridgeTxStatus from "@/components/bridge/BridgeTxStatus.tsx";
import BTCTxStatus from "@/components/bridge/BTCTxStatus.tsx";
import SendBTCForm from "@/components/bridge/SendBTCForm.tsx";
import { Card, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useApp } from "@/context/app.context.tsx";
import "./App.css";
import Navbar from "./components/Navbar";
import StacksConnect from "./components/StacksConnect";
import SuiConnect from "./components/SuiConnect";
import { LendingPoolsPage } from "./pages/Lending/LendingPoolsPage";

function App() {
  const { stacksAddress, btcAddressInfo, bridgeStepInfo } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <Navbar />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <BitcoinConnect />
          <StacksConnect />
          <SuiConnect />
        </div>

        <div className="flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            {!bridgeStepInfo && (!btcAddressInfo || !stacksAddress) && (
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

        <LendingPoolsPage />
      </div>
    </div>
  );
}

export default App;
