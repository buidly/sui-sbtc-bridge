import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { AlertCircle, ArrowRight, Bitcoin, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { useApp } from "@/context/app.context.tsx";
import { STACKS_NETWORK, StacksApi } from "@/api/stacks.ts";
import { principalCV, serializeCVBytes } from "@stacks/transactions";
import { createDepositAddress, createDepositScript, createReclaimScript } from "@/lib/sbtcHelpers.ts";
import { bytesToHex as uint8ArrayToHexString, hexToBytes as hexToUint8Array } from "@stacks/common";
import { networks } from "bitcoinjs-lib";
import { storageHelper } from "@/lib/storageHelper.ts";
import { Payload, sendBTCLeather, sendBTCOther } from '@/lib/sendBTC.ts';
import { useEmilyDeposit } from "@/hooks/use-emily-deposit.ts";
import { formatBalance, toDecimalAmount, toDenominatedAmount } from "@/lib/helpers.ts";
import bitcoinLogo from "@/assets/images/bitcoin_logo.svg";
import { useBalances } from "@/context/balances.context.tsx";

export default function SendBTCForm() {
  const { btcAddressInfo, stacksAddressInfo, suiAddress, updateBridgeStepInfo } = useApp();
  const { stacksBalances } = useBalances();

  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { notifyEmily } = useEmilyDeposit();

  const { btcBalance, loading } = useBalances();
  const denominatedBtcBalance = useMemo(() => {
    if (!btcBalance) {
      return 0;
    }

    return toDecimalAmount(btcBalance, 8);
  }, [btcBalance]);

  if (
    !btcAddressInfo ||
    !stacksAddressInfo ||
    (stacksAddressInfo.type === "GENERATED" && !stacksAddressInfo.privateKey)
  ) {
    return undefined;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const signersAggregatePubKey = (await StacksApi.getAggregateKey()).slice(2);

      // Combine the version and hash into a single Uint8Array
      const serializedAddress = serializeCVBytes(principalCV(stacksAddressInfo.address));

      // get the publicKey from the user payment address
      // user cannot continue if they're not connected
      let reclaimPublicKeys = [btcAddressInfo.publicKey]; // TODO: In theory the platform could reclaim here if we want to support optimistic deposit flow?
      let signatureThreshold = 1;

      // Parse lockTime from env variable
      const lockTime = "18";
      const parsedLockTime = parseInt(lockTime || "144");

      // Create the reclaim script and convert to Buffer
      const reclaimScript = Buffer.from(createReclaimScript(parsedLockTime, reclaimPublicKeys, signatureThreshold));

      const reclaimScriptHex = uint8ArrayToHexString(reclaimScript);

      const signerUint8Array = hexToUint8Array(signersAggregatePubKey!);

      const maxFee = 80000; // TODO: Check if it is fine

      const depositScript = Buffer.from(createDepositScript(signerUint8Array, maxFee, serializedAddress));
      // convert buffer to hex
      const depositScriptHexPreHash = uint8ArrayToHexString(depositScript);
      const p2trAddress = createDepositAddress(
        serializedAddress,
        signersAggregatePubKey!,
        maxFee,
        parsedLockTime,
        STACKS_NETWORK === "testnet" ? networks.regtest : networks.bitcoin,
        reclaimPublicKeys,
        signatureThreshold,
      );

      let txId = "";

      const amountInSats = toDenominatedAmount(amount, 8);

      console.log("amountInSats", amountInSats);

      try {
        const params = {
          recipient: p2trAddress,
          amountInSats,
          network: (STACKS_NETWORK === "testnet" ? "sbtcTestnet" : "mainnet") as Payload['network'],
        };
        console.log({
          preSendParams: {
            bitcoinTxid: txId,
            bitcoinTxOutputIndex: 0,
            reclaimScript: reclaimScriptHex,
            depositScript: depositScriptHexPreHash,
          },
        });

        switch (storageHelper.getBtcWallet()?.type) {
          case "LEATHER":
            txId = await sendBTCLeather(params);
            break;
          default:
            txId = await sendBTCOther(params);
            break;
        }
      } catch (error) {
        let errorMessage = error;
        console.warn(error);
        if (error?.error?.message) {
          errorMessage = error.error.message;
        }
        alert(`Issue with Transaction ${errorMessage}`);

        return;
      }

      const emilyReqPayload = {
        bitcoinTxid: txId,
        bitcoinTxOutputIndex: 0,
        reclaimScript: reclaimScriptHex,
        depositScript: depositScriptHexPreHash,
      };

      // make emily post request
      const response = await notifyEmily(emilyReqPayload);

      if (!response.ok) {
        alert("Issue with Request to Emily");

        throw new Error("Error with the request");
      }

      updateBridgeStepInfo("BTC_SENT_PENDING", txId);
    } catch (error) {
      console.error(error);
      let errorMessage = error;
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(`Error while depositing funds: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const bridgeSBTC = () => {
    // In case of generated wallet, transaction will go through automatically with ALL the user's balance when we switch steps
    if (stacksAddressInfo?.type === "GENERATED") {
      if (!confirm("Are you sure you want to bridge ALL your sBTC?")) {
        return;
      }
    }

    updateBridgeStepInfo("BTC_COMPLETED");
  };

  return (
    <Card className="bg-white/50 rounded-2xl p-6 relative">
      {stacksAddressInfo && suiAddress && stacksBalances?.sbtcBalance > 0 && (
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-400 cursor-pointer"
          onClick={() => bridgeSBTC()}
        >
          Bridge sBTC <ArrowRight className="h-5 w-5 inline" />
        </button>
      )}
      <CardHeader className="space-y-1">
        <div className="flex justify-center">
          <div className="bg-amber-500/20 rounded-full p-4">
            <Bitcoin className="h-10 w-10 text-orange-500" />
          </div>
        </div>

        <CardTitle className="text-2xl font-bold text-center text-slate-800">
          Step 1 - Bridge Bitcoin
          {loading && <Loader2 className="inline-flex h-6 w-6 ml-2 animate-spin text-gray-400" />}
        </CardTitle>
        <CardDescription className="text-center text-gray-500">Convert BTC tokens to sBTC</CardDescription>
      </CardHeader>
      <CardContent className="p-0 max-w-md mx-auto w-full">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-3">
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
                    max={String(denominatedBtcBalance)}
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
                        <img src={bitcoinLogo} alt={'bitcoin logo'} className="w-7 h-7" />
                      </div>
                      <span className="font-semibold">BTC</span>
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
                  {denominatedBtcBalance}
                  {/* {inputCoin && (<>{formatBalance(inputCoin.balance, inputCoin.decimals)} {inputCoin.symbol}</>)} */}
                  <Button variant="outline" size="sm" className="text-xs bg-white/80 shadow-none" onClick={() => setAmount(String(denominatedBtcBalance))}>
                    MAX
                  </Button>
                </div>
              </div>
            </div>

            {parseFloat(amount) < 0.001 && (
              <Alert variant="default" className="bg-white/50 text-[#f7931a] border-[#f7931a]">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-gray-600">Minimum deposit amount is 0.001 BTC</AlertDescription>
              </Alert>
            )}
            {parseFloat(amount) > denominatedBtcBalance && (
              <Alert variant="default" className="bg-white/50 text-[#f7931a] border-[#f7931a]">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-gray-600">You don't have enough BTC in your wallet</AlertDescription>
              </Alert>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="p-0 max-w-md mx-auto w-full">
        <Button
          variant="default"
          size="xl"
          className="w-full"
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting || !amount || parseFloat(amount) < 0.001 || parseFloat(amount) > denominatedBtcBalance}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              Send <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          )}
        </Button>
      </CardFooter>
    </Card >
  );
}
