import React from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import StacksConnect from "./components/StacksConnect";
import SuiConnect from "./components/SuiConnect";
import BitcoinConnect from "@/components/BitcoinConnect";
import SendBTCForm from "@/components/bridge/SendBTCForm.tsx";
import { useApp } from "@/context/app.context.tsx";
import BTCTxStatus from "@/components/bridge/BTCTxStatus.tsx";
import { Card, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { LendingPoolsPage } from "./pages/Lending/LendingPoolsPage";

function App() {
  const { stacksAddress, btcAddressInfo, bridgeStepInfo } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="container mx-auto p-4">
        <div className="max-w-5xl mx-auto px-0 grid md:grid-cols-3 gap-5">
          <div>
            <BitcoinConnect />
          </div>
          <div>
            <StacksConnect />
          </div>
          <div>
            <SuiConnect />
          </div>
        </div>

        {(!btcAddressInfo || !stacksAddress) && (
          <div className="flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-lg shadow-lg">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                  Connect a Bitcoin wallet & Stacks wallet first
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {btcAddressInfo && stacksAddress && (!bridgeStepInfo?.step ? <SendBTCForm /> : <BTCTxStatus />)}
        <LendingPoolsPage />
      </div>
    </div>
  );
}

export default App;
