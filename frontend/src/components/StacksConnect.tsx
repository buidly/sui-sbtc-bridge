import React, { useState } from "react";
import { connect, disconnect } from "@stacks/connect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/context/app.context";
import { formatAddress, getExplorerUrl } from "@/lib/helpers";
import stacksLogo from "@/assets/images/stacks_logo.svg";
import { storageHelper } from "@/lib/storageHelper.ts";
import { randomPrivateKey } from "@stacks/transactions";

function StacksConnect() {
  const { stacksAddress, processConnectStacksUser, processConnectStacksGenerated } = useApp();

  // TODO: Add support for generating user wallet
  const connectUserWallet = async () => {
    await connect();

    processConnectStacksUser();
  };
  const disconnectUserWallet = () => {
    if (storageHelper.getStacksWallet()?.type === "USER" && storageHelper.getBtcWallet()?.type !== "LEATHER") {
      disconnect();
    }

    if (storageHelper.getStacksWallet()?.type === "USER") {
      processConnectStacksUser(null);
    } else if (storageHelper.getStacksWallet()?.type === "GENERATED") {
      const isConfirmed = confirm(
        "Are you sure you want to disconnect this wallet? The wallet will be DELETED and CAN NOT be recovered!",
      );

      if (isConfirmed) {
        processConnectStacksGenerated(null);
      }
    }
  };
  const connectGenerateWallet = async () => {
    const privateKey = randomPrivateKey();

    // TODO: Fund wallet win a min STX balance from API
    processConnectStacksGenerated(privateKey);
  };

  // TODO: To send transaction
  // openContractCall()

  const [selectedOption, setSelectedOption] = useState(null);

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className={"flex"}>
          <img src={stacksLogo} alt={"Stacks Logo"} className="mr-1 h-4 w-4" /> Connect Stacks Wallet
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!stacksAddress ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="relative">
                <input
                  type="radio"
                  id="no-wallet"
                  name="walletOption"
                  value="no-wallet"
                  className="absolute opacity-0 w-0 h-0 peer"
                  onChange={(e) => setSelectedOption(e.target.value)}
                />
                <label
                  htmlFor="no-wallet"
                  className="flex text-center p-4 bg-red-50 border rounded-lg cursor-pointer hover:bg-red-100 peer-checked:border-blue-500 peer-checked:bg-red-200 transition-all duration-200"
                >
                  <span>
                    I don't have a <strong>Stacks</strong> Wallet
                  </span>
                </label>
              </div>

              <div className="relative">
                <input
                  type="radio"
                  id="have-wallet"
                  name="walletOption"
                  value="have-wallet"
                  className="absolute opacity-0 w-0 h-0 peer"
                  onChange={(e) => setSelectedOption(e.target.value)}
                />
                <label
                  htmlFor="have-wallet"
                  className="flex text-center p-4 bg-green-50 border rounded-lg cursor-pointer hover:bg-green-100 peer-checked:border-blue-500 peer-checked:bg-green-200 transition-all duration-200"
                >
                  <span>
                    I have a <strong>Stacks</strong> Wallet
                  </span>
                </label>
              </div>
            </div>

            {selectedOption === "have-wallet" ? (
              <Button onClick={connectUserWallet} variant="secondary" className="flex mx-auto">
                Connect Stacks Wallet
              </Button>
            ) : selectedOption === "no-wallet" ? (
              // TODO: Implement wallet generation and funding from a backend
              <Button onClick={connectGenerateWallet} variant="outline" className="flex mx-auto">
                Generate Wallet
              </Button>
            ) : undefined}
          </>
        ) : (
          <div>
            <p className="mb-2">
              <strong>Connected:</strong>
              <br />

              <a href={getExplorerUrl("STACKS", stacksAddress)} target={"_blank"} className={"underline"}>
                {formatAddress(stacksAddress)}
              </a>
            </p>
            <div className="flex gap-2 mt-4">
              <Button onClick={disconnectUserWallet} variant="destructive">
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
