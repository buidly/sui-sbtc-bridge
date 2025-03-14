import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BitcoinApi } from "@/api/bitcoin.ts";
import { useApp } from "@/context/app.context.tsx";
import { StacksApi } from "@/api/stacks.ts";
import { SuiApi } from "@/api/sui.ts";

interface BalancesContextType {
  btcBalance: bigint;
  stacksBalances: { stxBalance: bigint; sbtcBalance: bigint };
  suiBalances: { suiBalance: bigint; sbtcBalance: bigint };
  getStacksBalances: () => void;
  getSuiBalances: () => void;
  loading: boolean;
}

const BalancesContext = createContext<BalancesContextType>(undefined as BalancesContextType);

export function BalancesProvider({ children }: { children: ReactNode }) {
  const { btcAddressInfo, stacksAddress, suiAddress } = useApp();

  const [btcBalance, setBtcBalance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!btcAddressInfo) {
      setBtcBalance(0n);
      return;
    }

    const getBtcBalance = async () => {
      setLoading(true);

      const balance = await BitcoinApi.getAddressBalance(btcAddressInfo.address);

      setBtcBalance(balance);
      setLoading(false);
    };

    getBtcBalance();
  }, [btcAddressInfo]);

  const [stacksBalances, setStacksBalances] = useState(undefined);
  const getStacksBalances = async () => {
    if (!stacksAddress) {
      setStacksBalances(undefined);
      return;
    }

    setLoading(true);

    const balances = await StacksApi.getAddressBalances(stacksAddress);

    setStacksBalances(balances);
    setLoading(false);
  };

  useEffect(() => {
    getStacksBalances();
  }, [stacksAddress]);

  const [suiBalances, setSuiBalances] = useState(undefined);
  const getSuiBalances = async () => {
    if (!suiAddress) {
      setSuiBalances(undefined);
      return;
    }

    setLoading(true);

    const balances = await SuiApi.getAddressBalances(suiAddress);

    setSuiBalances(balances);
    setLoading(false);
  };

  useEffect(() => {
    getSuiBalances();
  }, [suiAddress]);

  return (
    <BalancesContext.Provider
      value={{ btcBalance, stacksBalances, suiBalances, getStacksBalances, getSuiBalances, loading }}
    >
      {children}
    </BalancesContext.Provider>
  );
}

export function useBalances() {
  const context = useContext(BalancesContext);

  if (context === undefined) {
    throw new Error("useApp must be used within a AppProvider");
  }

  return context;
}
