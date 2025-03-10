import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { ArrowRight, Loader2 } from "lucide-react";
import { useApp } from "@/context/app.context.tsx";
import suiLogo from "@/assets/images/sui_logo.svg";
import stacksLogo from "@/assets/images/stacks_logo.svg";
import { SBTC_TOKEN_CONTRACT, StacksApi } from "@/api/stacks.ts";
import { formatBalance } from "@/lib/helpers.ts";
import sbtcLogo from "@/assets/images/sbtc_logo.png";
import { request } from "@stacks/connect";
import { Pc, principalCV, stringAsciiCV, tupleCV, uintCV } from "@stacks/transactions";
import { bufferFromHex } from "@stacks/transactions/dist/cl";

const AXELAR_ITS_DEPLOYER = "ST237BAVWHZ124P5XWDRJEB40WNRGM9C8A9CK02Q6";

const SBTC_TOKEN_MANAGER = "ST1SCVNT9406763532TGDC5BWXZWTA2Z51GYENQ83.sbtc-token-manager";
const SBTC_ITS_TOKEN_ID = "0xb4239bb6e1af9cb2df851f76d0bd297a6d1feee6db4dc8318d6ba463132886cf";
// const SUI_AXELAR_CHAIN = "sui-2"; // TODO: Change to `sui-2` after that works properly
const AVALANCHE_AXELAR_CHAIN = 'avalanche-fuji'; // TODO: Temporary send to Fuji until sui-2 token deployment is working

export default function BridgeSBTCForm() {
  const { stacksAddress, suiAddress, bridgeStepInfo, updateBridgeStepInfo } = useApp();

  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const denominatedAmount = Math.round(parseFloat(amount) * 10 ** 8);

    console.log('denominated amount', denominatedAmount);

    try {
      const response = await request("stx_callContract", {
        contract: `${AXELAR_ITS_DEPLOYER}.interchain-token-service`, // Axelar ITS contract // TODO: Move to env var
        functionName: "interchain-transfer",
        functionArgs: [
          principalCV(`${AXELAR_ITS_DEPLOYER}.gateway-impl`),
          principalCV(`${AXELAR_ITS_DEPLOYER}.gas-impl`),
          principalCV(`${AXELAR_ITS_DEPLOYER}.interchain-token-service-impl`),
          principalCV(SBTC_TOKEN_MANAGER),
          principalCV(SBTC_TOKEN_CONTRACT),
          bufferFromHex(SBTC_ITS_TOKEN_ID),
          stringAsciiCV(AVALANCHE_AXELAR_CHAIN), // TODO: Update to correct chain
          // bufferFromHex(suiAddress.slice(2)), // remove 0x prefix // TODO: Set correct address
          bufferFromHex('0xF12372616f9c986355414BA06b3Ca954c0a7b0dC'),
          uintCV(denominatedAmount), // sBTC has 8 decimals
          tupleCV({ data: bufferFromHex(''), version: uintCV(0) }),
          uintCV(1_000_000), // 1 STX for paying cross chain fee
        ],
        postConditions: [
          // Pc.origin().willSendEq(1_000_000).ustx(),
          // Pc.origin()
          //   .willSendEq(denominatedAmount)
          //   .ft(SBTC_TOKEN_CONTRACT, "sbtc-token"),
        ],
        network: "testnet", // TODO:
      });

      if (!response?.txid) {
        alert("Failed to send Stacks transaction");
        setIsSubmitting(false);

        return;
      }

      console.log("Respoinse", response);

      updateBridgeStepInfo("BTC_SENT_PENDING", bridgeStepInfo.btcTxId, response.txid);
    } catch (e) {
      console.error(e);

      setIsSubmitting(false);
    }
    // TODO: Handle submit
  };

  const [stacksBalances, setStacksBalances] = useState(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stacksAddress) {
      const getBalance = async () => {
        setLoading(true);

        // TODO: Move this to a hook/context to be used globally
        const balances = await StacksApi.getAddressBalances(stacksAddress);

        setStacksBalances(balances);
        setLoading(false);
      };

      getBalance();
    }
  }, [stacksAddress]);

  // TODO: Check if Stacks address is the correct one
  if (!stacksAddress || !suiAddress) {
    return (
      <div className="flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Connect a Stacks and Sui wallet first</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg shadow-lg gap-4">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <img src={stacksLogo} alt={"Stacks Logo"} className="h-8 w-8" /> <ArrowRight className="h-5 w-5 mx-1" />
            <img src={suiLogo} alt={"Sui Logo"} className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Step 3 - Bridge sBTC
            {loading && <Loader2 className="inline-flex h-6 w-6 ml-1 animate-spin text-sky-500" />}
          </CardTitle>
          <CardDescription className="text-center">Send sBTC from Stacks to Sui</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <p className="mb-2 flex items-center">
              <strong className="mr-1">sBTC Balance:</strong> {formatBalance(stacksBalances?.sbtcBalance, 8)} sBTC
              <img src={sbtcLogo} alt={"sBTC Logo"} className="ml-1 h-4 w-4" />
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-3">
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
                    className="pr-12"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500">sBTC</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full bg-sky-400 hover:bg-sky-500/90"
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
    </div>
  );
}
