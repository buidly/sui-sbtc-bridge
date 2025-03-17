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
      title="Connect Sui Wallet"
      icon={<img src={suiLogo} alt={"Sui Logo"} className="h-6 w-6" />}
      isConnected={!!suiAddress}
      notConnectedElement={
        <ConnectModal
          trigger={
            <Button variant="outline" className={"flex mx-auto"}>
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
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs text-slate-400 mb-1">sBTC Balance:</div>
          <div className="flex items-center gap-2">
            <span className="text-white text-lg font-medium">{formatBalance(suiBalances?.sbtcBalance, 8)}</span>
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

export default SuiConnect;
