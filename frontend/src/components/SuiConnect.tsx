import React from "react";
import { ConnectModal, useAutoConnectWallet, useDisconnectWallet } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/context/app.context";
import { Loader2 } from "lucide-react";
import { formatAddress, getExplorerUrl } from "@/lib/helpers";
import suiLogo from "@/assets/images/sui_logo.svg";

function SuiConnect() {
  const { suiAddress } = useApp();

  const suiAutoConnectionStatus = useAutoConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();

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
