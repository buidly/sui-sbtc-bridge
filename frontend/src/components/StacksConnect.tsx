import { connect, disconnect } from "@stacks/connect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/context/app.context";
import { formatAddress } from "@/lib/helpers";

function StacksConnect() {
  const { stacksAddress, processConnectStacks } = useApp();

  const connectWallet = async () => {
    await connect();

    processConnectStacks();
  };

  const disconnectWallet = () => {
    disconnect();

    processConnectStacks();
  };

  // TODO: To send transaction
  // openContractCall()

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle>Stacks Integration</CardTitle>
      </CardHeader>
      <CardContent>
        {!stacksAddress ? (
          <Button onClick={connectWallet} variant="secondary">
            Connect Stacks Wallet
          </Button>
        ) : (
          <div>
            <p className="mb-2">
              <strong>Connected:</strong>

              <p>{formatAddress(stacksAddress)}</p>
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

export default StacksConnect;
