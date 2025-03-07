import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Wallet, { AddressPurpose } from "sats-connect";
import { useApp } from "@/context/app.context";
import { Loader2 } from "lucide-react";
import { formatAddress, getExplorerUrl } from "@/lib/helpers";
import leatherLogo from "@/assets/images/leather_logo.svg";
import bitcoinLogo from "@/assets/images/bitcoin_logo.svg";
import { connect, disconnect } from "@stacks/connect";
import { storageHelper } from "@/lib/storageHelper.ts";

function BitcoinConnect() {
  const { btcAddress, processConnectBtc, processConnectBtcLeather } = useApp();

  const connectWalletLeather = async () => {
    await connect();

    processConnectBtcLeather();
  };
  const connectWalletOther = async () => {
    const res = await Wallet.request("wallet_connect", {
      message: "Cool app wants to know your addresses!",
      addresses: [AddressPurpose.Payment],
    });

    processConnectBtc(res);
  };

  const disconnectWallet = async () => {
    if (storageHelper.getBtcWallet()?.type === "LEATHER" && storageHelper.getStacksWallet()?.type !== "USER") {
      disconnect();
    }

    if (storageHelper.getBtcWallet()?.type === "OTHER") {
      await Wallet.disconnect();
    }

    processConnectBtc(null);
  };

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className={"flex"}>
          <img src={bitcoinLogo} alt={"Bitcoin Logo"} className="mr-1 h-4 w-4" /> Connect Bitcoin Wallet
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!btcAddress ? (
          <div className={"flex flex-col gap-2 w-50 mx-auto"}>
            <Button onClick={connectWalletLeather} variant="default">
              <img src={leatherLogo} alt={"Leather Logo"} className="mr-1 h-4 w-4" /> Connect Leather
              {btcAddress === undefined && <Loader2 className="inline-flex h-4 w-4 animate-spin ml-1" />}
            </Button>
            <Button onClick={connectWalletOther} variant="default">
              Other Wallet (Mainnet only)
              {btcAddress === undefined && <Loader2 className="inline-flex h-4 w-4 animate-spin ml-1" />}
            </Button>
          </div>
        ) : (
          <div>
            <p className="mb-2">
              <strong>Connected:</strong>
              <br />
              <a href={getExplorerUrl("BITCOIN", btcAddress)} target={"_blank"} className={'underline'}>
                {formatAddress(btcAddress)}
              </a>
            </p>
            <div className="flex gap-2 mt-4">
              <Button onClick={disconnectWallet} variant="destructive">
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BitcoinConnect;
