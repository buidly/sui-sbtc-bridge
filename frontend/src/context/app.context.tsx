import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { AddressPurpose, request, RpcResult } from "sats-connect";
import { getLocalStorage, isConnected } from "@stacks/connect";

interface AppContextType {
  btcAddress: string | undefined | null;
  stacksAddress: string | null;
  suiAddress: string | null;
  processConnectBtc: (res) => void;
  processConnectStacks: () => void;
}

const AppContext = createContext<AppContextType>(undefined as AppContextType);

export function AppProvider({ children }: { children: ReactNode }) {
  const [btcAddress, setBtcAddress] = useState<string | undefined | null>(undefined);
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const { address: suiAddress } = useCurrentAccount() || {};

  const processConnectBtc = (res?: RpcResult<"wallet_getAccount">) => {
    if (!res || res.status === "error") {
      setBtcAddress(null);
      return;
    }

    const btcAddresses = res.result.addresses.filter((a) => [AddressPurpose.Payment].includes(a.purpose as any));
    setBtcAddress(btcAddresses[0].address);
  };

  const processConnectStacks = () => {
    const userData = getLocalStorage();

    if (!userData) {
      setStacksAddress(null);
      return;
    }

    const stacksAddress = userData.addresses.stx[0].address;

    setStacksAddress(stacksAddress);
  };

  useEffect(() => {
    // Handle Btc
    const reconnectBtc = async () => {
      try {
        setBtcAddress(undefined);

        const res = await request("wallet_getAccount", null);

        processConnectBtc(res);
      } catch (e) {
        setBtcAddress(null);
      }
    };
    reconnectBtc();

    // Handle Stacks
    if (isConnected()) {
      processConnectStacks();
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        btcAddress,
        stacksAddress,
        suiAddress,
        processConnectBtc,
        processConnectStacks,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);

  if (context === undefined) {
    throw new Error("useApp must be used within a AppProvider");
  }

  return context;
}
