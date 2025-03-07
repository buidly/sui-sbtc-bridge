import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { AddressPurpose, request, RpcResult } from "sats-connect";
import { getLocalStorage, isConnected, StorageData, request as stacksRequest } from "@stacks/connect";
import { storageHelper } from "@/lib/storageHelper.ts";
import { privateKeyToAddress } from "@stacks/transactions";

interface AppContextType {
  btcAddressInfo: { address: string, publicKey: string } | undefined | null;
  stacksAddress: string | null;
  suiAddress: string | null;
  processConnectBtc: (res?: RpcResult<"wallet_getAccount">) => void;
  processConnectBtcLeather: () => void;
  processConnectStacksUser: (userData?: StorageData | null) => void;
  processConnectStacksGenerated: (privateKey: string) => void;
}

const AppContext = createContext<AppContextType>(undefined as AppContextType);

export function AppProvider({ children }: { children: ReactNode }) {
  const [btcAddressInfo, setBtcAddressInfo] = useState<{ address: string, publicKey: string } | undefined | null>(undefined);
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const { address: suiAddress } = useCurrentAccount() || {};

  const processConnectBtc = (res?: RpcResult<"wallet_getAccount">) => {
    if (!res || res.status === "error") {
      setBtcAddressInfo(null);
      storageHelper.removeBtcWallet();
      return;
    }

    const btcAddresses = res.result.addresses.filter((a) => [AddressPurpose.Payment].includes(a.purpose as any));
    setBtcAddressInfo(btcAddresses[0]);
    storageHelper.setBtcWallet('OTHER');
  };
  const processConnectBtcLeather = async () => {
    const userData = getLocalStorage();

    if (!userData) {
      setBtcAddressInfo(null);
      storageHelper.removeBtcWallet();
      return;
    }

    const accounts = await stacksRequest('getAddresses');

    setBtcAddressInfo(accounts.addresses[0]);
    storageHelper.setBtcWallet('LEATHER');
  };

  const processConnectStacksUser = (userData?: StorageData | null) => {
    if (userData === undefined) {
      userData = getLocalStorage();
    }

    if (!userData) {
      setStacksAddress(null);
      storageHelper.removeStacksWallet();
      return;
    }

    const stacksAddress = userData.addresses.stx[0].address;

    setStacksAddress(stacksAddress);
    storageHelper.setStacksWallet('USER', stacksAddress);
  };
  const processConnectStacksGenerated = (privateKey?: string) => {
    if (!privateKey) {
      setStacksAddress(null);
      storageHelper.removeStacksWallet();
      return;
    }

    const stacksAddress = privateKeyToAddress(privateKey, 'testnet');

    setStacksAddress(stacksAddress); // TODO: Support other networks in the future
    storageHelper.setStacksWallet('GENERATED', stacksAddress, privateKey);
  }

  useEffect(() => {
    const storageBtcWallet = storageHelper.getBtcWallet();
    if (storageBtcWallet?.type !== 'LEATHER') {
      // Handle Btc
      const reconnectBtc = async () => {
        try {
          setBtcAddressInfo(undefined);

          const res = await request("wallet_getAccount", null);

          processConnectBtc(res);
        } catch (e) {
          setBtcAddressInfo(null);
        }
      };
      reconnectBtc();
    }

    const storageStacksWallet = storageHelper.getStacksWallet();
    if (storageStacksWallet?.type === 'GENERATED') {
      processConnectStacksGenerated(storageStacksWallet?.privateKey);
    }

    // Handle Stacks
    if (isConnected()) {
      if (storageStacksWallet?.type === 'USER') {
        processConnectStacksUser();
      }

      if (storageBtcWallet?.type === 'LEATHER') {
        processConnectBtcLeather();
      }
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        btcAddressInfo,
        stacksAddress,
        suiAddress,
        processConnectBtc,
        processConnectBtcLeather,
        processConnectStacksUser,
        processConnectStacksGenerated,
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
