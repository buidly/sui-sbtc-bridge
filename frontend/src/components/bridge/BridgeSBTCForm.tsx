import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useApp } from "@/context/app.context.tsx";
import suiLogo from "@/assets/images/sui_logo.svg";
import stacksLogo from "@/assets/images/stacks_logo.svg";
import { SBTC_TOKEN_CONTRACT, STACKS_NETWORK, StacksApi } from "@/api/stacks.ts";
import { formatBalance, toDenominatedAmount } from "@/lib/helpers.ts";
import sbtcLogo from "@/assets/images/sbtc_logo.png";
import {
  makeContractCall,
  Pc,
  PostConditionMode,
  principalCV,
  stringAsciiCV,
  tupleCV,
  uintCV,
} from "@stacks/transactions";
import { bufferFromHex } from "@stacks/transactions/dist/cl";
import { openContractCall } from "@stacks/connect";
import { ENV } from "@/lib/env.ts";
import { CONSTANTS } from "@/lib/constants.ts";
import { useBalances } from "@/context/balances.context.tsx";
import { MicroserviceApi } from "@/api/microservice.ts";
import { ContractCallOptions } from "@stacks/transactions/src/builders.ts";
import { ContractCallRegularOptions } from "@stacks/connect/dist/types/types/transactions";

export default function BridgeSBTCForm() {
  const { stacksAddressInfo, suiAddress, bridgeStepInfo, updateBridgeStepInfo } = useApp();

  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const denominatedAmount = toDenominatedAmount(amount, 8);

    await handleSubmitRaw(denominatedAmount);
  };

  const handleSubmitRaw = async (denominatedAmount: number | bigint) => {
    setIsSubmitting(true);

    const baseCallArguments: ContractCallOptions = {
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
        uintCV(CONSTANTS.CROSS_CHAIN_STX_VALUE), // 1 STX for paying cross chain fee
      ],
      postConditions: [
        Pc.principal(stacksAddressInfo.address).willSendEq(CONSTANTS.CROSS_CHAIN_STX_VALUE).ustx(),
        Pc.principal(stacksAddressInfo.address).willSendEq(denominatedAmount).ft(SBTC_TOKEN_CONTRACT, "sbtc-token"),
      ],
      postConditionMode: PostConditionMode.Deny,
      network: STACKS_NETWORK,
    };

    // If generated wallet, call backend for sponsored transaction
    if (stacksAddressInfo.type === "GENERATED") {
      await handleSubmitGenerated(baseCallArguments);

      return;
    }

    try {
      await openContractCall({
        ...({
          ...baseCallArguments,

          onFinish: (response) => {
            if (!response?.txId) {
              alert("Failed to send Stacks transaction");
              setIsSubmitting(false);

              return;
            }

            updateBridgeStepInfo("SBTC_SENT_PENDING", bridgeStepInfo.btcTxId, response.txId);
          },
          onCancel: () => {
            setIsSubmitting(false);
          },
        } as ContractCallRegularOptions),
      });
    } catch (e) {
      console.error(e);

      setIsSubmitting(false);
    }
  };

  const handleSubmitGenerated = async (baseCallArguments: ContractCallOptions) => {
    try {
      const nonce = await StacksApi.getNextNonce(stacksAddressInfo.address);

      const transaction = await makeContractCall({
        ...baseCallArguments,

        senderKey: stacksAddressInfo.privateKey,
        nonce,
        sponsored: true,
      });

      const sponsoredTxId = await MicroserviceApi.sendSponsoredTransaction(transaction.serialize());

      if (!sponsoredTxId) {
        alert("Failed to submit Stacks transaction. Please try again");
        setIsSubmitting(false);

        return;
      }

      updateBridgeStepInfo("SBTC_SENT_PENDING", bridgeStepInfo.btcTxId, null, sponsoredTxId);
    } catch (e) {
      console.error(e);

      setIsSubmitting(false);
    }
  };

  const [isGeneratedSubmitting, setIsGeneratedSubmitting] = useState(false);
  const { stacksBalances, loading } = useBalances();
  const autoSubmitTimeout = useRef(null);

  // If wallet is of type generated, then submit form automatically with max amount
  useEffect(() => {
    if (!stacksAddressInfo || !suiAddress || !stacksBalances?.sbtcBalance) {
      return;
    }

    // If generated wallet, auto submit transaction & call backend for sponsored transaction
    if (stacksAddressInfo.type !== "GENERATED" || !stacksAddressInfo.privateKey) {
      return;
    }

    setIsGeneratedSubmitting(true);

    // Debounce so code is not executed multiple times
    if (autoSubmitTimeout.current) {
      clearTimeout(autoSubmitTimeout.current);
    }

    autoSubmitTimeout.current = setTimeout(() => {
      handleSubmitRaw(stacksBalances.sbtcBalance);
    }, 300);

    return () => {
      if (autoSubmitTimeout.current) {
        clearTimeout(autoSubmitTimeout.current);
      }
    };
  }, [stacksAddressInfo, suiAddress, stacksBalances]);

  if (!stacksAddressInfo || !suiAddress || (stacksAddressInfo.type === "GENERATED" && !stacksAddressInfo.privateKey)) {
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
    <Card className="bg-slate-50/5 border-slate-700 shadow-xl backdrop-blur-sm text-white relative">
      {!bridgeStepInfo.btcTxId && (
        <button
          className="absolute top-3 left-3 text-slate-300 hover:text-white transition-colors bg-slate-800 rounded-sm cursor-pointer"
          onClick={() => updateBridgeStepInfo(null)}
        >
          <ArrowLeft className="h-5 w-5 inline" /> Bridge Bitcoin
        </button>
      )}
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-2">
          <img src={stacksLogo} alt={"Stacks Logo"} className="h-8 w-8" /> <ArrowRight className="h-5 w-5 mx-1" />
          <img src={suiLogo} alt={"Sui Logo"} className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          Step 2 - Bridge sBTC
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

        {!isGeneratedSubmitting && (
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
                    className="pr-28 text-slate-300"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <span className="pr-2 text-slate-400">sBTC</span>
                    <button
                      type="button"
                      onClick={() => setAmount(formatBalance(stacksBalances?.sbtcBalance, 8))}
                      className="px-2 py-1 mr-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded cursor-pointer"
                    >
                      Max
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="cursor-pointer w-full bg-gradient-to-r from-sky-400 to-sky-700 hover:from-sky-400/90 hover:to-sky-700/90"
          type="submit"
          onClick={handleSubmit}
          disabled={
            isGeneratedSubmitting ||
            isSubmitting ||
            !amount ||
            parseFloat(amount) > parseFloat(formatBalance(stacksBalances?.sbtcBalance, 8))
          }
        >
          {isGeneratedSubmitting || isSubmitting ? (
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
