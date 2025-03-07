import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Wallet, { AddressPurpose } from "sats-connect";
import { useApp } from "@/context/app.context";
import { Loader2 } from "lucide-react";
import { formatAddress, formatBalance, getExplorerUrl } from "@/lib/helpers";
import leatherLogo from "@/assets/images/leather_logo.svg";
import bitcoinLogo from "@/assets/images/bitcoin_logo.svg";
import { connect, disconnect } from "@stacks/connect";
import { storageHelper } from "@/lib/storageHelper.ts";
import { BitcoinApi } from "@/api/bitcoin.ts";

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

  const [btcBalance, setBtcBalance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (btcAddress) {
      const getBalance = async () => {
        setLoading(true);

        const balance = await BitcoinApi.getAddressBalance(btcAddress);

        setBtcBalance(balance);
        setLoading(false);
      };

      getBalance();
    }
  }, [btcAddress]);

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
              <a href={getExplorerUrl("BITCOIN", btcAddress)} target={"_blank"} className={"underline"}>
                {formatAddress(btcAddress)}
              </a>
            </p>
            <p className="mb-2 flex items-center">
              <strong className='mr-1'>Balance:</strong> {formatBalance(btcBalance, 8)} BTC
              <img src={bitcoinLogo} alt={"Bitcoin Logo"} className="ml-1 h-4 w-4" />
              {loading && <Loader2 className="inline-flex h-4 w-4 animate-spin ml-1" />}
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
