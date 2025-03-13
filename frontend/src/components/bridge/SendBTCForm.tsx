import React, { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { AlertCircle, Bitcoin, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { useApp } from "@/context/app.context.tsx";
import { StacksApi } from "@/api/stacks.ts";
import { principalCV, serializeCVBytes } from "@stacks/transactions";
import { createDepositAddress, createDepositScript, createReclaimScript } from "@/lib/sbtcHelpers.ts";
import { bytesToHex as uint8ArrayToHexString, hexToBytes as hexToUint8Array } from "@stacks/common";
import { networks } from "bitcoinjs-lib";
import { storageHelper } from "@/lib/storageHelper.ts";
import { sendBTCLeather, sendBTCOther } from "@/lib/sendBTC.ts";
import { useEmilyDeposit } from "@/hooks/use-emily-deposit.ts";

export default function SendBTCForm() {
  const { btcAddressInfo, stacksAddress, updateBridgeStepInfo } = useApp();

  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { notifyEmily } = useEmilyDeposit();

  if (!btcAddressInfo || !stacksAddress) {
    return undefined;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const signersAggregatePubKey = (await StacksApi.getAggregateKey()).slice(2);

      // Combine the version and hash into a single Uint8Array
      const serializedAddress = serializeCVBytes(principalCV(stacksAddress));

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
        networks.regtest, // TODO: Update for mainnet
        reclaimPublicKeys,
        signatureThreshold,
      );

      let txId = "";

      const amountInSats = Number(parseFloat(amount) * 10 ** 8);

      console.log("amountInSats", amountInSats);

      const walletNetwork: "sbtcTestnet" = "sbtcTestnet"; // TODO: Update

      try {
        const params = {
          recipient: p2trAddress,
          amountInSats,
          network: walletNetwork,
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
        if (error instanceof Error) {
          errorMessage = error.message;
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

      alert("Successful Deposit request");

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

  return (
    <Card className="bg-slate-50/5 border-slate-700 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-6">
          <div className="bg-amber-500/20 rounded-full p-4">
            <Bitcoin className="h-10 w-10 text-orange-500" />
          </div>
        </div>

        <CardTitle className="text-2xl font-bold text-center text-white">Step 1 - Bridge Bitcoin</CardTitle>
        <CardDescription className="text-center text-slate-400">Convert BTC tokens to sBTC</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-300">
                Amount
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  step="0.00000001"
                  min="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-12 text-slate-300"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-slate-400 font-medium">BTC</span>
                </div>
              </div>
            </div>

            {/* TODO: Add check for max amount */}

            {parseFloat(amount) < 0.001 && (
              <Alert variant="default" className="bg-amber-50 text-amber-800 border-amber-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Minimum deposit amount is 0.001 BTC</AlertDescription>
              </Alert>
            )}
            {parseFloat(amount) > 0.002 && (
              <Alert variant="default" className="bg-amber-50 text-amber-800 border-amber-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You're about to send a large amount. Please double-check the wallets.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting || !amount || parseFloat(amount) < 0.001}
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
    </Card>
  );
}
