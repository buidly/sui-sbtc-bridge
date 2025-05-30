import { useApp } from "@/context/app.context.tsx";
import { useEffect, useMemo, useState } from "react";
import { StableSwapPool, SuiApi } from "@/api/sui.ts";
import { ENV } from "@/lib/env.ts";
import { CoinMetadata } from "@mysten/sui/client";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { toast } from "react-toastify";
import { useSuiBtcCoins } from "@/hooks/api/use-sui-btc-coins.ts";
import { toDecimalAmount } from "@/lib/helpers.ts";
import { stableSwapTransaction } from "@/lib/stableswap.ts";

export type CoinWithBalance = CoinMetadata & {
  denominatedBalance: number;
  balance: bigint;
  coinType: string;
};

export const useSwap = () => {
  const { suiAddress } = useApp();
  const { mutateAsync: signAndExecuteTransaction, status } = useSignAndExecuteTransaction();

  const { btcCoins, isLoading: isLoadingBtcCoins } = useSuiBtcCoins();

  const [isLoading, setIsLoading] = useState(true);
  const [stableSwapObject, setStableSwapObject] = useState<StableSwapPool>();
  const [balances, setBalances] = useState<{ [coinType: string]: bigint }>({});

  const fetchStableSwap = async () => {
    setIsLoading(true);

    const result = await SuiApi.getStableSwapPool(ENV.STABLE_SWAP_POOL_OBJECT);
    setStableSwapObject(result);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchStableSwap();
  }, []);

  const fetchBalances = async () => {
    setIsLoading(true);

    const result = await SuiApi.getAddressCoinsBalances(suiAddress, Object.keys(btcCoins));
    setBalances(result);

    setIsLoading(false);
  };

  useEffect(() => {
    if (!suiAddress || !Object.keys(btcCoins).length) {
      return;
    }

    fetchBalances();
  }, [suiAddress, btcCoins]);

  const coins = useMemo<CoinWithBalance[]>(() => {
    if (!btcCoins || !balances) {
      return [];
    }

    return Object.entries(btcCoins).map(([coinType, metadata], index) => {
      return {
        ...metadata,
        symbol:
          Object.values(btcCoins).findIndex((coin) => coin.symbol === metadata.symbol) !== index
            ? metadata.name
            : metadata.symbol, // Don't display duplicate symbols, use names instead
        balance: balances?.[coinType] || 0n,
        denominatedBalance: toDecimalAmount(balances?.[coinType] || 0n, metadata.decimals),
        coinType,
      };
    });
  }, [btcCoins, balances]);

  const doSwap = async (inputCoinType: string, outputCoinType: string, inputAmount: bigint, minOutput: bigint) => {
    const tx = new Transaction();
    tx.setSender(suiAddress);

    const coin = coinWithBalance({
      type: inputCoinType,
      balance: inputAmount,
    });

    const outputCoin = stableSwapTransaction(tx, inputCoinType, outputCoinType, minOutput, coin);

    tx.transferObjects([outputCoin], suiAddress);

    const result = await signAndExecuteTransaction({
      // @ts-ignore
      transaction: tx,
    });

    console.log("Swap transaction successful:", result);
  };

  useEffect(() => {
    if (status === "pending") {
      toast.warning("Swapping...");
    } else if (status === "success") {
      toast.success("Swap succeeded!");

      // Fetch coins with a timeout so rpc reflects changes
      setTimeout(() => {
        fetchStableSwap();

        fetchBalances();
      }, 250);
    } else if (status === "error") {
      toast.error("Swap failed...");
    }
  }, [status]);

  return {
    isLoading: isLoading || isLoadingBtcCoins,
    coins,
    stableSwapObject,
    doSwap,
  };
};
