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
        principalCV(ENV.STACKS_AXELAR_ITS_CONTRACT_IMPL),
        principalCV(ENV.STACKS_SBTC_TOKEN_MANAGER),
        principalCV(SBTC_TOKEN_CONTRACT),
        bufferFromHex(ENV.ITS_SBTC_TOKEN_ID),
        stringAsciiCV(CONSTANTS.SUI_AXELAR_CHAIN),
        bufferFromHex(suiAddress.slice(2)), // remove 0x prefix
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
      <Card className="bg-white/50 rounded-2xl p-4">
        <CardHeader className="space-y-1 max-w-lg mx-auto">
          <CardTitle className="text-xl font-bold text-center text-gray-600">
            Connect a Stacks and Sui wallet first
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white/50 rounded-2xl p-6 relative">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-2">
          <img src={stacksLogo} alt={"Stacks Logo"} className="h-8 w-8" /> <ArrowRight className="h-5 w-5 mx-1" />
          <img src={suiLogo} alt={"Sui Logo"} className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold text-center text-slate-800">
          Step 2 - Bridge sBTC
          {loading && <Loader2 className="inline-flex h-6 w-6 ml-1 -mt-1 animate-spin text-sky-500" />}
        </CardTitle>
        <CardDescription className="text-center text-slate-300">Send sBTC from Stacks to Sui</CardDescription>
      </CardHeader>
      <CardContent className="p-0 max-w-md mx-auto w-full">
        {!isGeneratedSubmitting && (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-3 text-slate-300">
              <div className="bg-white/50 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center mb-2 cursor-pointer">
                  <label className="text-sm text-gray-500">Amount</label>
                </div>
                <div className="flex items-center">
                  <div className="relative flex-grow text-gray-800 text-4xl font-bold">
                    <input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      step="0.00000001"
                      min="0.001"
                      max={formatBalance(stacksBalances?.sbtcBalance, 8)}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-0 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="w-[150px] bg-white/80 rounded-2xl outline-none shadow-none border-none px-2 py-2 text-lg justify-items-center">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <img src={sbtcLogo} alt={'bitcoin logo'} className="w-7 h-7" />
                        </div>
                        <span className="font-semibold text-gray-800">sBTC</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-gray-500">
                  <div>
                    {/* $0.0 */}
                  </div>
                  <div className="text-sm flex items-center gap-2">
                    Balance:{" "}
                    {formatBalance(stacksBalances?.sbtcBalance, 8)}
                    <Button variant="outline" size="sm" className="text-xs bg-white/80 shadow-none" onClick={() => setAmount(formatBalance(stacksBalances?.sbtcBalance, 8))}>
                      MAX
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </CardContent>
      <CardFooter className="p-0 max-w-md mx-auto w-full flex-col gap-4">
        <Button
          variant="default"
          size="xl"
          className="w-full bg-sky-500"
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
        {!bridgeStepInfo.btcTxId && (
          <div className="max-w-md mx-auto w-full flex justify-center">
            <button
              className="text-gray-500 hover:text-gray-400 cursor-pointer"
              onClick={() => updateBridgeStepInfo(null)}
            >
              <ArrowLeft className="h-5 w-5 -mt-1 inline" /> Bridge Bitcoin
            </button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
