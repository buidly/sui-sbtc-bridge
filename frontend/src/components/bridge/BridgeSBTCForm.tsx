import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { ArrowRight, Loader2 } from "lucide-react";
import { useApp } from "@/context/app.context.tsx";
import suiLogo from "@/assets/images/sui_logo.svg";
import stacksLogo from "@/assets/images/stacks_logo.svg";
import { SBTC_TOKEN_CONTRACT, STACKS_NETWORK, StacksApi } from "@/api/stacks.ts";
import { formatBalance } from "@/lib/helpers.ts";
import sbtcLogo from "@/assets/images/sbtc_logo.png";
import { Pc, principalCV, stringAsciiCV, tupleCV, uintCV } from "@stacks/transactions";
import { bufferFromHex } from "@stacks/transactions/dist/cl";
import { openContractCall } from "@stacks/connect";
import { ENV } from "@/lib/env.ts";
import { CONSTANTS } from "@/lib/constants.ts";
import { useBalances } from "@/context/balances.context.tsx";

export default function BridgeSBTCForm() {
  const { stacksAddress, suiAddress, bridgeStepInfo, updateBridgeStepInfo } = useApp();

  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const denominatedAmount = Math.round(parseFloat(amount) * 10 ** 8);

    console.log("denominated amount", denominatedAmount);

    try {
      openContractCall({
        contractAddress: ENV.STACKS_AXELAR_CONTRACT_DEPLOYER, // Axelar ITS contract
        contractName: "interchain-token-service",
        functionName: "interchain-transfer",
        functionArgs: [
          principalCV(`${ENV.STACKS_AXELAR_CONTRACT_DEPLOYER}.gateway-impl`),
          principalCV(`${ENV.STACKS_AXELAR_CONTRACT_DEPLOYER}.gas-impl`),
          principalCV(`${ENV.STACKS_AXELAR_CONTRACT_DEPLOYER}.interchain-token-service-impl`),
          principalCV(ENV.STACKS_SBTC_TOKEN_MANAGER),
          principalCV(SBTC_TOKEN_CONTRACT),
          bufferFromHex(ENV.ITS_SBTC_TOKEN_ID),
          stringAsciiCV(CONSTANTS.SUI_AXELAR_CHAIN),
          // bufferFromHex(suiAddress.slice(2)), // remove 0x prefix // TODO: Set correct address
          bufferFromHex("0xF12372616f9c986355414BA06b3Ca954c0a7b0dC"),
          uintCV(denominatedAmount), // sBTC has 8 decimals
          tupleCV({ data: bufferFromHex(""), version: uintCV(0) }),
          uintCV(1_000_000), // 1 STX for paying cross chain fee
        ],
        postConditions: [
          Pc.origin().willSendEq(1_000_000).ustx(),
          Pc.origin().willSendEq(denominatedAmount).ft(SBTC_TOKEN_CONTRACT, "sbtc-token"),
        ],
        network: STACKS_NETWORK,
        onFinish: (response) => {
          console.log("response", response);

          if (!response?.txId) {
            alert("Failed to send Stacks transaction");
            setIsSubmitting(false);

            return;
          }

          console.log("Respoinse", response);

          updateBridgeStepInfo("SBTC_SENT", bridgeStepInfo.btcTxId, response.txId);
        },
        onCancel: () => {
          setIsSubmitting(false);
        },
      });
    } catch (e) {
      console.error(e);

      setIsSubmitting(false);
    }
  };

  const { stacksBalances, loading } = useBalances();

  // TODO: Check if Stacks address is the correct one
  if (!stacksAddress || !suiAddress) {
    return (
      <Card className="bg-slate-50/5 border-slate-700 shadow-xl backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-white">
            Connect a Stacks and Sui wallet first
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-50/5 border-slate-700 shadow-xl backdrop-blur-sm text-white">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-2">
          <img src={stacksLogo} alt={"Stacks Logo"} className="h-8 w-8" /> <ArrowRight className="h-5 w-5 mx-1" />
          <img src={suiLogo} alt={"Sui Logo"} className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          Step 3 - Bridge sBTC
          {loading && <Loader2 className="inline-flex h-6 w-6 ml-1 animate-spin text-sky-400" />}
        </CardTitle>
        <CardDescription className="text-center text-slate-300">Send sBTC from Stacks to Sui</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 text-slate-300">
          <p className="mb-2 flex items-center">
            <strong className="mr-1">sBTC Balance:</strong> {formatBalance(stacksBalances?.sbtcBalance, 8)}
            <span className="text-orange-400 ml-1">sBTC</span>
            <img src={sbtcLogo} alt={"sBTC Logo"} className="ml-1 h-4 w-4" />
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-3 text-slate-300">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  step="0.00000001"
                  min="0.00000001"
                  max={formatBalance(stacksBalances?.sbtcBalance, 8)}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-12 text-slate-300"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">sBTC</div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          className="cursor-pointer w-full bg-gradient-to-r from-sky-400 to-sky-700 hover:from-sky-400/90 hover:to-sky-700/90"
          type="submit"
          onClick={handleSubmit}
          disabled={
            isSubmitting || !amount || parseFloat(amount) > parseFloat(formatBalance(stacksBalances?.sbtcBalance, 8))
          }
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Bridging...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              Bridge <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
