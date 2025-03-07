import { ConnectModal, useAutoConnectWallet, useDisconnectWallet } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/context/app.context";
import { Loader2 } from "lucide-react";
import { formatAddress } from "@/lib/helpers";

function SuiConnect() {
  const { suiAddress } = useApp();

  const suiAutoConnectionStatus = useAutoConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle>Sui Integration</CardTitle>
      </CardHeader>
      <CardContent>
        {!suiAddress ? (
          <ConnectModal
            trigger={
              <Button variant="outline">
                Connect Sui Wallet
                {suiAutoConnectionStatus === "idle" && <Loader2 className="inline-flex h-4 w-4 animate-spin ml-1" />}
              </Button>
            }
          />
        ) : (
          <div>
            <p className="mb-2">
              <strong>Connected:</strong>
              <p>{formatAddress(suiAddress)}</p>
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
