import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Wallet, { AddressPurpose } from "sats-connect";
import { useApp, userSession } from "@/context/app.context";
import { Loader2 } from "lucide-react";
import { formatTrimmed, formatBalance, getExplorerUrlAddress } from "@/lib/helpers";
import leatherLogo from "@/assets/images/leather_logo.svg";
import bitcoinLogo from "@/assets/images/bitcoin_logo.svg";
import { storageHelper } from "@/lib/storageHelper.ts";
import { BitcoinApi } from "@/api/bitcoin.ts";
import { showConnect } from "@stacks/connect";

function BitcoinConnect() {
  const { btcAddressInfo, processConnectBtc, processConnectBtcLeather } = useApp();

  const connectWalletLeather = async () => {
    showConnect({
      userSession,
      appDetails: {
        name: 'Sui sBTC Bridge',
        icon: window.location.origin + '/vite.svg',
      },
      onFinish: () => {
        processConnectBtcLeather();
      }
    });
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
      userSession.signUserOut();
    }

    if (storageHelper.getBtcWallet()?.type === "OTHER") {
      await Wallet.disconnect();
    }

    processConnectBtc(null);
  };

  const [btcBalance, setBtcBalance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (btcAddressInfo) {
      const getBalance = async () => {
        setLoading(true);

        const balance = await BitcoinApi.getAddressBalance(btcAddressInfo.address);

        setBtcBalance(balance);
        setLoading(false);
      };

      getBalance();
    }
  }, [btcAddressInfo]);

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className={"flex"}>
          <img src={bitcoinLogo} alt={"Bitcoin Logo"} className="mr-1 h-4 w-4" /> Connect Bitcoin Wallet
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!btcAddressInfo ? (
          <div className={"flex flex-col gap-2 w-50 mx-auto"}>
            <Button onClick={connectWalletLeather} variant="default">
              <img src={leatherLogo} alt={"Leather Logo"} className="mr-1 h-4 w-4" /> Connect Leather
            </Button>
            <Button onClick={connectWalletOther} variant="default">
              Other Wallet (Mainnet only)
            </Button>
          </div>
        ) : (
          <div>
            <p className="mb-2">
              <strong>Connected:</strong>
              <br />
              <a href={getExplorerUrlAddress("BITCOIN", btcAddressInfo.address)} target={"_blank"} className={"underline"}>
                {formatTrimmed(btcAddressInfo.address)}
              </a>
            </p>
            <p className="mb-2 flex items-center">
              <strong className="mr-1">Balance:</strong> {formatBalance(btcBalance, 8)} BTC
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
