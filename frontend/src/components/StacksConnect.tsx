import React, { useEffect, useState } from "react";
import { showConnect } from "@stacks/connect";
import { Button } from "@/components/ui/button";
import { useApp, userSession } from "@/context/app.context";
import { formatBalance } from "@/lib/helpers";
import { storageHelper } from "@/lib/storageHelper.ts";
import { randomPrivateKey } from "@stacks/transactions";
import { StacksApi } from "@/api/stacks.ts";
import { WalletCard } from "@/components/base/WalletCard.tsx";

import stacksLogo from "@/assets/images/stacks_logo.svg";
import sbtcLogo from "@/assets/images/sbtc_logo.png";

function StacksConnect() {
  const { stacksAddress, processConnectStacksUser, processConnectStacksGenerated, updateBridgeStepInfo } = useApp();

  // TODO: Add support for generating user wallet
  const connectUserWallet = async () => {
    showConnect({
      userSession,
      appDetails: {
        name: "Sui sBTC Bridge",
        icon: window.location.origin + "/vite.svg",
      },
      onFinish: () => {
        processConnectStacksUser();
      },
    });
  };
  const disconnectWallet = () => {
    if (storageHelper.getStacksWallet()?.type === "USER" && storageHelper.getBtcWallet()?.type !== "LEATHER") {
      userSession.signUserOut();
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

    updateBridgeStepInfo(null, null);
    setSelectedOption(null);
  };
  const connectGenerateWallet = async () => {
    const privateKey = randomPrivateKey();

    // TODO: Fund wallet win a min STX balance from API
    processConnectStacksGenerated(privateKey);
  };

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
    <WalletCard
      title="Connect Stacks Wallet"
      icon={<img src={stacksLogo} alt={"Stacks Logo"} className="h-6 w-6" />}
      isConnected={!!stacksAddress}
      notConnectedElement={
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
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
                className="flex text-center p-4 bg-red-200 border rounded-lg cursor-pointer hover:bg-red-100 peer-checked:border-blue-500 peer-checked:bg-red-300 transition-all duration-200 peer-checked:border-3"
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
                className="flex text-center p-4 bg-green-200 border rounded-lg cursor-pointer hover:bg-green-100 peer-checked:border-blue-500 peer-checked:bg-green-300 transition-all duration-200  peer-checked:border-3"
              >
                <span>
                  I have a <strong>Stacks</strong> Wallet
                </span>
              </label>
            </div>
          </div>

          {selectedOption === "have-wallet" ? (
            <Button onClick={connectUserWallet} variant="default" className="flex mx-auto">
              Connect Stacks Wallet
            </Button>
          ) : selectedOption === "no-wallet" ? (
            // TODO: Implement wallet generation and funding from a backend
            <Button onClick={connectGenerateWallet} variant="default" className="flex mx-auto">
              Generate Wallet
            </Button>
          ) : undefined}
        </>
      }
      address={stacksAddress}
      addressType="STACKS"
      balance={formatBalance(stacksBalances?.stxBalance, 6)}
      currency="STX"
      currencyColor="text-orange-400"
      currencyIcon={<img src={stacksLogo} alt={"STX Logo"} className="ml-1 h-4 w-4" />}
      disconnectWallet={disconnectWallet}
      loading={loading}
    >
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs text-slate-400 mb-1">sBTC Balance:</div>
          <div className="flex items-center gap-2">
            <span className="text-white text-lg font-medium">{formatBalance(stacksBalances?.sbtcBalance, 8)}</span>
            <span className="text-orange-400">sBTC</span>
          </div>
        </div>

        <div className={`w-8 h-8 flex items-center justify-center`}>
          <span className="text-lg">
            <img src={sbtcLogo} alt={"sBTC Logo"} className="ml-1 h-4 w-4" />
          </span>
        </div>
      </div>
    </WalletCard>
  );
}

export default StacksConnect;
