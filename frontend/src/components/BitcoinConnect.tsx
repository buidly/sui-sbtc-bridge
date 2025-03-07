import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Wallet, { AddressPurpose } from "sats-connect";
import { useApp } from "@/context/app.context";
import { Loader2 } from "lucide-react";
import { formatAddress } from "@/lib/helpers";

function BitcoinConnect() {
  const { btcAddress, processConnectBtc } = useApp();

  const connectWallet = async () => {
    const res = await Wallet.request("wallet_connect", {
      message: "Cool app wants to know your addresses!",
      addresses: [AddressPurpose.Payment],
    });

    processConnectBtc(res);
  };

  const disconnectWallet = async () => {
    await Wallet.disconnect();
    processConnectBtc(null);
  };

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle>Connect Bitcoin Wallet</CardTitle>
      </CardHeader>
      <CardContent>
        {!btcAddress ? (
          <Button onClick={connectWallet} variant="default">
            Connect Bitcoin Wallet
            {btcAddress === undefined && <Loader2 className="inline-flex h-4 w-4 animate-spin ml-1" />}
          </Button>
        ) : (
          <div>
            <p className="mb-2">
              <strong>Connected:</strong>
              <p>{formatAddress(btcAddress)}</p>
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
