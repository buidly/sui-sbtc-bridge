import React, { useEffect, useState } from "react";
import { connect, disconnect } from "@stacks/connect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/context/app.context";
import { formatTrimmed, formatBalance, getExplorerUrlAddress } from "@/lib/helpers";
import { storageHelper } from "@/lib/storageHelper.ts";
import { randomPrivateKey } from "@stacks/transactions";
import { StacksApi } from "@/api/stacks.ts";
import { Loader2 } from "lucide-react";

import stacksLogo from "@/assets/images/stacks_logo.svg";
import sbtcLogo from "@/assets/images/sbtc_logo.png";

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

  const [stacksBalances, setStacksBalances] = useState(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stacksAddress) {
      const getBalance = async () => {
        setLoading(true);

        const balances = await StacksApi.getAddressBalances(stacksAddress);

        setStacksBalances(balances);
        setLoading(false);
      };

      getBalance();
    }
  }, [stacksAddress]);

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

              <a href={getExplorerUrlAddress("STACKS", stacksAddress)} target={"_blank"} className={"underline"}>
                {formatTrimmed(stacksAddress)}
              </a>
            </p>
            <p className="flex items-center">
              <strong className='mr-1'>Balance:</strong> {formatBalance(stacksBalances?.stxBalance, 6)} STX
              <img src={stacksLogo} alt={"STX Logo"} className="ml-1 h-4 w-4" />
              {loading && <Loader2 className="inline-flex h-4 w-4 animate-spin ml-1" />}
            </p>
            <p className="mb-2 flex items-center">
              <strong className='mr-1'>sBTC Balance:</strong> {formatBalance(stacksBalances?.sbtcBalance, 6)} sBTC
              <img src={sbtcLogo} alt={"sBTC Logo"} className="ml-1 h-4 w-4" />
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
