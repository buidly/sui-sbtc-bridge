import React, { useEffect, useState } from "react";
import { ConnectModal, useAutoConnectWallet, useDisconnectWallet } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/context/app.context";
import { Loader2 } from "lucide-react";
import { formatAddress, formatBalance, getExplorerUrl } from "@/lib/helpers";
import { SuiApi } from "@/api/sui.ts";

import suiLogo from "@/assets/images/sui_logo.svg";
import sbtcLogo from "@/assets/images/sbtc_logo.png";

function SuiConnect() {
  const { suiAddress } = useApp();

  const suiAutoConnectionStatus = useAutoConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();

  const [suiBalances, setSuiBalances] = useState(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (suiAddress) {
      const getBalance = async () => {
        setLoading(true);

        const balances = await SuiApi.getAddressBalances(suiAddress);

        setSuiBalances(balances);
        setLoading(false);
      };

      getBalance();
    }
  }, [suiAddress]);

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className={"flex"}>
          <img src={suiLogo} alt={"Sui Logo"} className="mr-1 h-4 w-4" /> Connect Sui Wallet
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!suiAddress ? (
          <ConnectModal
            trigger={
              <Button variant="outline" className={"flex mx-auto"}>
                Connect Sui Wallet
                {suiAutoConnectionStatus === "idle" && <Loader2 className="inline-flex h-4 w-4 animate-spin ml-1" />}
              </Button>
            }
          />
        ) : (
          <div>
            <p className="mb-2">
              <strong>Connected:</strong> <br />
              <a href={getExplorerUrl("SUI", suiAddress)} target={"_blank"} className={"underline"}>
                {formatAddress(suiAddress)}
              </a>
            </p>
            <p className="flex items-center">
              <strong className="mr-1">Balance:</strong> {formatBalance(suiBalances?.suiBalance, 9)} SUI
              <img src={suiLogo} alt={"SUI Logo"} className="ml-1 h-4 w-4" />
              {loading && <Loader2 className="inline-flex h-4 w-4 animate-spin ml-1" />}
            </p>
            <p className="mb-2 flex items-center">
              <strong className="mr-1">sBTC Balance:</strong> {formatBalance(suiBalances?.sbtcBalance, 6)} sBTC
              <img src={sbtcLogo} alt={"sBTC Logo"} className="ml-1 h-4 w-4" />
            </p>
            <div className="flex gap-2 mt-4">
              <Button onClick={disconnect} variant="destructive">
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SuiConnect;
