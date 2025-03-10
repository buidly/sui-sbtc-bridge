import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { AddressPurpose, request, RpcResult } from "sats-connect";
import { getLocalStorage, isConnected, StorageData, request as stacksRequest } from "@stacks/connect";
import { storageHelper } from "@/lib/storageHelper.ts";
import { privateKeyToAddress } from "@stacks/transactions";

type BridgeStep =
  | "BTC_SENT_PENDING"
  | "BTC_SENT_MINTING"
  | "BTC_FAILED"
  | "BTC_COMPLETED"
  | "SBTC_SENT"
  | "SBTC_COMPLETED"
  | null;

interface AppContextType {
  btcAddressInfo: { address: string; publicKey: string } | undefined | null;
  stacksAddress: string | null;
  suiAddress: string | null;
  processConnectBtc: (res?: RpcResult<"wallet_getAccount">) => void;
  processConnectBtcLeather: () => void;
  processConnectStacksUser: (userData?: StorageData | null) => void;
  processConnectStacksGenerated: (privateKey: string) => void;
  bridgeStepInfo?: {
    step: BridgeStep;
    btcTxId: string;
  };
  updateBridgeStepInfo: (step?: BridgeStep, btcTxId?: string) => void;
}

const AppContext = createContext<AppContextType>(undefined as AppContextType);

export function AppProvider({ children }: { children: ReactNode }) {
  const [btcAddressInfo, setBtcAddressInfo] = useState<{ address: string; publicKey: string } | undefined | null>(
    undefined,
  );
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
    storageHelper.setBtcWallet("OTHER");
  };
  const processConnectBtcLeather = async () => {
    const userData = getLocalStorage();

    if (!userData) {
      setBtcAddressInfo(null);
      storageHelper.removeBtcWallet();
      return;
    }

    const accounts = await stacksRequest("getAddresses");

    setBtcAddressInfo(accounts.addresses[0]);
    storageHelper.setBtcWallet("LEATHER");
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
    storageHelper.setStacksWallet("USER", stacksAddress);
  };
  const processConnectStacksGenerated = (privateKey?: string) => {
    if (!privateKey) {
      setStacksAddress(null);
      storageHelper.removeStacksWallet();
      return;
    }

    const stacksAddress = privateKeyToAddress(privateKey, "testnet");

    setStacksAddress(stacksAddress); // TODO: Support other networks in the future
    storageHelper.setStacksWallet("GENERATED", stacksAddress, privateKey);
  };

  useEffect(() => {
    const storageBtcWallet = storageHelper.getBtcWallet();
    if (storageBtcWallet?.type !== "LEATHER") {
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
    if (storageStacksWallet?.type === "GENERATED") {
      processConnectStacksGenerated(storageStacksWallet?.privateKey);
    }

    // Handle Stacks
    if (isConnected()) {
      if (storageStacksWallet?.type === "USER") {
        processConnectStacksUser();
      }

      if (storageBtcWallet?.type === "LEATHER") {
        processConnectBtcLeather();
      }
    }
  }, []);

  const [bridgeStepInfo, setBridgeStepInfo] = useState<{ step: BridgeStep; btcTxId: string } | null>(null);

  useEffect(() => {
    // Handle bridge step
    const params = new URLSearchParams(window.location.search);
    const btcTxId = params.get("btcTxId");

    if (btcTxId) {
      setBridgeStepInfo({
        step: "BTC_SENT_PENDING", // TODO: How to handle advanced steps?
        btcTxId,
      });
    }
  }, []);

  const updateBridgeStepInfo = (step?: BridgeStep, btcTxId?: string) => {
    if (!step || !btcTxId) {
      setBridgeStepInfo(null);

      const params = new URLSearchParams(window.location.search);
      params.delete("btcTxId");

      // Update URL without page reload
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({ path: newUrl }, "", newUrl);
    }

    setBridgeStepInfo({
      step,
      btcTxId,
    });

    const params = new URLSearchParams(window.location.search);
    params.set("btcTxId", btcTxId);

    // Update URL without page reload
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

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
        bridgeStepInfo,
        updateBridgeStepInfo,
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
