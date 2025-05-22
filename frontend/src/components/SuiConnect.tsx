import React from "react";
import { ConnectModal, useAutoConnectWallet, useDisconnectWallet } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/app.context";
import { Loader2 } from "lucide-react";
import { formatBalance } from "@/lib/helpers";

import suiLogo from "@/assets/images/sui_logo.svg";
import sbtcLogo from "@/assets/images/sbtc_logo.png";
import { WalletCard } from "@/components/base/WalletCard.tsx";
import { useBalances } from "@/context/balances.context.tsx";

function SuiConnect() {
  const { suiAddress } = useApp();

  const suiAutoConnectionStatus = useAutoConnectWallet();
  const { mutate: disconnectWallet } = useDisconnectWallet();

  const { suiBalances, loading } = useBalances();

  return (
    <WalletCard
      title="Sui Wallet"
      icon={<img src={suiLogo} alt={"Sui Logo"} className="h-6 w-6" />}
      isConnected={!!suiAddress}
      notConnectedElement={
        <ConnectModal
          trigger={
            <Button variant="default" className={"flex w-full bg-black hover:bg-black/80 text-white"}>
              Connect Sui Wallet
              {suiAutoConnectionStatus === "idle" && <Loader2 className="inline-flex h-4 w-4 animate-spin ml-1" />}
            </Button>
          }
        />
      }
      address={suiAddress}
      addressType="SUI"
      balance={formatBalance(suiBalances?.suiBalance, 9)}
      currency="SUI"
      currencyColor="text-sky-400"
      currencyIcon={<img src={suiLogo} alt={"SUI Logo"} className="ml-1 h-4 w-4" />}
      disconnectWallet={disconnectWallet}
      loading={loading}
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="text-gray-500 text-sm">sBTC Balance</div>
          <div className="flex items-center">
            <span className="text-gray-800 text-lg font-medium mr-2">{formatBalance(suiBalances?.sbtcBalance, 8)}</span>
            <span className="text-orange-400">sBTC</span>
            <span className="text-lg">
              <img src={sbtcLogo} alt={"sBTC Logo"} className="ml-1 h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </WalletCard>
  );
}

export default SuiConnect;
