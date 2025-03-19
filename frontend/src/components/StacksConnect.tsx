import React, { useEffect, useState } from "react";
import { showConnect } from "@stacks/connect";
import { Button } from "@/components/ui/button";
import { useApp, userSession } from "@/context/app.context";
import { createDeterministicStacksWallet, formatBalance } from "@/lib/helpers";
import { storageHelper } from "@/lib/storageHelper.ts";
import { WalletCard } from "@/components/base/WalletCard.tsx";
import { useBalances } from "@/context/balances.context.tsx";
import { generateWallet } from "@stacks/wallet-sdk";
import { scrypt } from "scrypt-js";
import * as bip39 from "bip39";

import stacksLogo from "@/assets/images/stacks_logo.svg";
import sbtcLogo from "@/assets/images/sbtc_logo.png";
import { STACKS_NETWORK } from "@/api/stacks.ts";
import { privateKeyToAddress } from "@stacks/transactions";
import { Loader2 } from "lucide-react";

function StacksConnect() {
  const {
    stacksAddressInfo,
    suiAddress,
    processConnectStacksUser,
    processConnectStacksGenerated,
    updateBridgeStepInfo,
  } = useApp();

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
        "Are you sure you want to disconnect this wallet? The wallet can be recovered if you use the same Sui address & password combination!",
      );

      if (!isConfirmed) {
        return;
      }

      processConnectStacksGenerated(null);
    }

    updateBridgeStepInfo(null, null);
    setPassword("");
  };
  const connectGenerateWallet = async (e = null) => {
    if (e) {
      e.preventDefault();
    }

    if (!password || !isValid) {
      return;
    }

    setLoadingGenerate(true);

    try {
      const result = await createDeterministicStacksWallet(suiAddress, password);

      if (!stacksAddressInfo) {
        processConnectStacksGenerated(result.stacksAddress, result.privateKey);

        return;
      }

      // In case we have address info without private key check that the password is correct
      if (stacksAddressInfo.address !== result.stacksAddress) {
        alert("Invalid password!");

        processConnectStacksGenerated(null);
        setPassword("");

        return;
      }

      processConnectStacksGenerated(result.stacksAddress, result.privateKey);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGenerate(false);
    }
  };

  const { stacksBalances, loading } = useBalances();

  const [password, setPassword] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [loadingGenerate, setLoadingGenerate] = useState(false);

  // Password validation function
  useEffect(() => {
    if (!password) {
      setIsValid(true);

      return;
    }

    // Check all requirements at once
    const hasMinLength = password.length >= 8;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    setIsValid(hasMinLength && hasLowercase && hasUppercase && hasNumber && hasSpecial);
  }, [password]);

  const formElement = (
    <>
      <form onSubmit={connectGenerateWallet}>
        <input
          type="password"
          id="temp-wallet-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password for temporary wallet"
          className={`w-full p-4 bg-slate-800 border ${!isValid ? "border-red-500" : "border-slate-700"} rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
        {!isValid && (
          <div className="mt-2 text-sm text-red-500">
            Password must be at least 8 characters with lowercase, uppercase, numbers and special characters.
          </div>
        )}
      </form>

      <Button
        variant="default"
        onClick={connectGenerateWallet}
        className="w-full p-4 mb-0 font-medium rounded-lg"
        disabled={loadingGenerate}
      >
        Get temporary wallet
        {loadingGenerate && <Loader2 className="inline-flex h-4 w-4 animate-spin ml-1" />}
      </Button>
    </>
  );

  return (
    <WalletCard
      title="Connect Stacks Wallet"
      icon={<img src={stacksLogo} alt={"Stacks Logo"} className="h-6 w-6" />}
      isConnected={!!stacksAddressInfo}
      notConnectedElement={
        <>
          <div className="w-full space-y-4">
            {suiAddress && formElement}
            <div className="text-center pt-2">
              <p>
                {!suiAddress && <span className="mt-2 text-sm text-white">Connect a Sui Wallet first or </span>}
                <a
                  onClick={connectUserWallet}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors cursor-pointer"
                >
                  Use an existing wallet
                </a>
              </p>
            </div>
          </div>
        </>
      }
      extraElement={
        stacksAddressInfo?.type === "GENERATED" &&
        !stacksAddressInfo?.privateKey && (
          <>
            <form onSubmit={connectGenerateWallet}>
              <input
                type="password"
                id="temp-wallet-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password for temporary wallet"
                className={`w-full p-4 bg-slate-800 border ${!isValid ? "border-red-500" : "border-slate-700"} rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {!isValid && (
                <div className="mt-2 text-sm text-red-500">
                  Password must be at least 8 characters with lowercase, uppercase, numbers and special characters.
                </div>
              )}
            </form>

            <Button
              variant="default"
              onClick={connectGenerateWallet}
              className="w-full p-4 mb-0 font-medium rounded-lg "
              disabled={loadingGenerate}
            >
              Unlock temporary wallet
              {loadingGenerate && <Loader2 className="inline-flex h-4 w-4 animate-spin ml-1" />}
            </Button>
          </>
        )
      }
      address={stacksAddressInfo?.address}
      addressType="STACKS"
      balance={formatBalance(stacksBalances?.stxBalance, 6)}
      currency="STX"
      currencyColor="text-orange-400"
      currencyIcon={<img src={stacksLogo} alt={"STX Logo"} className="ml-1 h-4 w-4" />}
      disconnectWallet={disconnectWallet}
      loading={loading}
    >
      {/* TODO: Show form for password, even at page reload */}
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
