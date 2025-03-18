import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { AddressPurpose, request, RpcResult } from "sats-connect";
import { AppConfig, UserData, UserSession } from "@stacks/connect";
import { storageHelper } from "@/lib/storageHelper.ts";
import { privateKeyToAddress } from "@stacks/transactions";
import { STACKS_NETWORK } from "@/api/stacks.ts";

type BridgeStep =
  | "BTC_SENT_PENDING"
  | "BTC_SENT_MINTING"
  | "BTC_FAILED"
  | "BTC_COMPLETED"
  | "SBTC_SENT_PENDING"
  | "SBTC_SENT_BRIDGING"
  | "SBTC_COMPLETED"
  | null;

interface AppContextType {
  btcAddressInfo: { address: string; publicKey: string } | null;
  stacksAddressInfo: { address: string; privateKey?: string } | null;
  suiAddress: string | null;
  processConnectBtc: (res?: RpcResult<"wallet_getAccount">) => void;
  processConnectBtcLeather: () => void;
  processConnectStacksUser: (userData?: UserData | null) => void;
  processConnectStacksGenerated: (stacksAddress?: string, privateKey?: string) => void;
  bridgeStepInfo?: {
    step: BridgeStep;
    btcTxId: string;
    stacksTxId?: string;
  };
  updateBridgeStepInfo: (step?: BridgeStep, btcTxId?: string, stacksTxId?: string) => void;
}

const appConfig = new AppConfig(["store_write", "publish_data"]);
export const userSession = new UserSession({ appConfig });

const AppContext = createContext<AppContextType>(undefined as AppContextType);

export function AppProvider({ children }: { children: ReactNode }) {
  const [btcAddressInfo, setBtcAddressInfo] = useState<{ address: string; publicKey: string } | null>(null);
  const [stacksAddressInfo, setStacksAddressInfo] = useState<{ address: string; privateKey?: string } | null>(null);
  const suiWallet = useCurrentAccount();
  const suiAddress = useMemo(() => suiWallet?.address, [suiWallet]);

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
    const userData = userSession.loadUserData();

    if (!userData) {
      setBtcAddressInfo(null);
      storageHelper.removeBtcWallet();
      return;
    }

    const btcAddress = userData.profile.btcAddress["p2wpkh"][STACKS_NETWORK === "testnet" ? "regtest" : "mainnet"];

    setBtcAddressInfo({
      address: btcAddress,
      publicKey: (STACKS_NETWORK === "testnet" ? userData.profile.btcPublicKeyTestnet : userData.profile.btcPublicKey)[
        "p2wpkh"
      ],
    });
    storageHelper.setBtcWallet("LEATHER");
  };

  const processConnectStacksUser = (userData?: UserData | null) => {
    if (userData === undefined) {
      userData = userSession.loadUserData();
    }

    if (!userData) {
      setStacksAddressInfo(null);
      storageHelper.removeStacksWallet();
      return;
    }

    const stacksAddress = userData.profile.stxAddress[STACKS_NETWORK];

    setStacksAddressInfo({ address: stacksAddress });
    storageHelper.setStacksWallet("USER", stacksAddress);
  };
  const processConnectStacksGenerated = (stacksAddress?: string, privateKey?: string) => {
    if (!stacksAddress) {
      setStacksAddressInfo(null);
      storageHelper.removeStacksWallet();
      return;
    }

    // const stacksAddress = privateKeyToAddress(privateKey, STACKS_NETWORK);

    setStacksAddressInfo({ address: stacksAddress, privateKey });
    storageHelper.setStacksWallet("GENERATED", stacksAddress);
  };

  useEffect(() => {
    const storageBtcWallet = storageHelper.getBtcWallet();
    if (storageBtcWallet?.type !== "LEATHER") {
      // Handle Btc
      const reconnectBtc = async () => {
        try {
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
      processConnectStacksGenerated(storageStacksWallet.address, null);
    }

    // Handle Stacks
    if (userSession.isUserSignedIn()) {
      if (storageStacksWallet?.type === "USER") {
        processConnectStacksUser();
      }

      if (storageBtcWallet?.type === "LEATHER") {
        processConnectBtcLeather();
      }
    }
  }, []);

  const [bridgeStepInfo, setBridgeStepInfo] = useState<{
    step: BridgeStep;
    btcTxId: string;
    stacksTxId?: string;
  } | null>(null);

  useEffect(() => {
    // Handle bridge step
    const params = new URLSearchParams(window.location.search);
    const btcTxId = params.get("btcTxId");

    if (btcTxId) {
      // Handle BTC transaction status
      if (!params.has("stacksTxId")) {
        setBridgeStepInfo({
          step: "BTC_SENT_PENDING",
          btcTxId,
        });

        return;
      }

      // Handle sBTC bridge transaction status
      setBridgeStepInfo({
        step: "SBTC_SENT_PENDING",
        btcTxId,
        stacksTxId: params.get("stacksTxId"),
      });
    }
  }, []);

  const updateBridgeStepInfo = (step?: BridgeStep, btcTxId?: string, stacksTxId?: string) => {
    if (!step || !btcTxId) {
      setBridgeStepInfo(null);

      const params = new URLSearchParams(window.location.search);
      params.delete("btcTxId");
      params.delete("stacksTxId");

      // Update URL without page reload
      const newUrl = `${window.location.pathname}${params.size !== 0 ? "?" + params.toString() : ""}`;
      window.history.pushState({ path: newUrl }, "", newUrl);

      return;
    }

    setBridgeStepInfo({
      step,
      btcTxId,
      stacksTxId,
    });

    const params = new URLSearchParams(window.location.search);
    params.set("btcTxId", btcTxId);

    if (stacksTxId) {
      params.set("stacksTxId", stacksTxId);
    }

    // Update URL without page reload
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  return (
    <AppContext.Provider
      value={{
        btcAddressInfo,
        stacksAddressInfo,
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
