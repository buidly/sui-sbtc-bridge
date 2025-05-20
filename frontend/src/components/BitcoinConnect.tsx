import React from "react";
import { Button } from "@/components/ui/button";
import Wallet, { AddressPurpose } from "sats-connect";
import { useApp, userSession } from "@/context/app.context";
import { formatBalance } from "@/lib/helpers";
import leatherLogo from "@/assets/images/leather_logo.svg";
import bitcoinLogo from "@/assets/images/bitcoin_logo.svg";
import { storageHelper } from "@/lib/storageHelper.ts";
import { showConnect } from "@stacks/connect";
import { WalletCard } from "@/components/base/WalletCard.tsx";
import { useBalances } from "@/context/balances.context.tsx";

function BitcoinConnect() {
  const { btcAddressInfo, processConnectBtc, processConnectBtcLeather } = useApp();

  const connectWalletLeather = async () => {
    showConnect({
      userSession,
      appDetails: {
        name: "Sui sBTC Bridge",
        icon: window.location.origin + "/vite.svg",
      },
      onFinish: () => {
        processConnectBtcLeather();
      },
    });
  };
  const connectWalletOther = async () => {
    const res = await Wallet.request("wallet_connect", {
      message: "Cool app wants to know your addresses!",
      addresses: [AddressPurpose.Payment],
    });

    processConnectBtc(res);
  };

  const disconnectWallet = async () => {
    if (storageHelper.getBtcWallet()?.type === "LEATHER" && storageHelper.getStacksWallet()?.type !== "USER") {
      userSession.signUserOut();
    }

    if (storageHelper.getBtcWallet()?.type === "OTHER") {
      await Wallet.disconnect();
    }

    processConnectBtc(null);
  };

  const { btcBalance, loading } = useBalances();

  return (
    <WalletCard
      title="Bitcoin Wallet"
      icon={<img src={bitcoinLogo} alt={"Bitcoin Logo"} className="h-6 w-6" />}
      isConnected={!!btcAddressInfo}
      notConnectedElement={
        <div className={"flex flex-col gap-2 mb-0 w-full"}>
          <Button onClick={connectWalletLeather} variant="default" className="bg-black hover:bg-black/80">
            <img src={leatherLogo} alt={"Leather Logo"} className="mr-1 h-4 w-4" /> Connect Leather
          </Button>
          {/* <Button onClick={connectWalletOther} variant="default">
            Other Wallet (Mainnet only)
          </Button> */}
        </div>
      }
      address={btcAddressInfo?.address}
      addressType="BITCOIN"
      balance={formatBalance(btcBalance, 8)}
      currency="BTC"
      currencyColor="text-amber-500"
      currencyIcon={<img src={bitcoinLogo} alt={"Bitcoin Logo"} className="ml-1 h-4 w-4" />}
      disconnectWallet={disconnectWallet}
      loading={loading}
    />
  );
}

export default BitcoinConnect;
