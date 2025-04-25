import { useApp } from "@/context/app.context.tsx";
import { useEffect, useMemo, useState } from "react";
import { StableSwapPool, SuiApi } from "@/api/sui.ts";
import { ENV } from "@/lib/env.ts";
import { CoinMetadata } from "@mysten/sui/client";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { toast } from "react-toastify";

export type CoinWithBalance = CoinMetadata & {
  denominatedBalance: number;
  balance: bigint;
  coinType: string;
};

export const useSwap = () => {
  const { suiAddress } = useApp();
  const { mutateAsync: signAndExecuteTransaction, status } = useSignAndExecuteTransaction();

  const [isLoading, setIsLoading] = useState(true);
  const [stableSwapObject, setStableSwapObject] = useState<StableSwapPool>();
  const [btcCoins, setBtcCoins] = useState<{ [coinType: string]: CoinMetadata }>({});
  const [balances, setBalances] = useState<{ [coinType: string]: bigint }>({});

  const fetchStableSwap = async () => {
    const result = await SuiApi.getObject(ENV.STABLE_SWAP_POOL_OBJECT);
    setStableSwapObject(result);

    return result;
  };

  useEffect(() => {
    // TODO: Coins metadata can be moved to microservice
    const getData = async () => {
      setIsLoading(true);

      const result = await fetchStableSwap();

      const coinsMetadata = await SuiApi.getCoinsMetadata(result.types);
      setBtcCoins(coinsMetadata);

      setIsLoading(false);
    };

    getData();
  }, []);

  const fetchBalances = async () => {
    setIsLoading(true);

    const result = await SuiApi.getAddressCoinsBalances(suiAddress, Object.keys(btcCoins));
    setBalances(result);

    setIsLoading(false);
  };

  useEffect(() => {
    if (!suiAddress) {
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
        denominatedBalance: Number(balances?.[coinType] || 0n) / 10 ** metadata.decimals,
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

    const outputCoin = tx.moveCall({
      package: ENV.STABLE_SWAP_PACKAGE_ID,
      module: "stableswap",
      function: "exchange_coin",
      typeArguments: [inputCoinType, outputCoinType],
      arguments: [tx.pure("u64", minOutput), coin, tx.object(ENV.STABLE_SWAP_POOL_OBJECT)],
    });

    tx.transferObjects([outputCoin], suiAddress);

    const result = await signAndExecuteTransaction({
      transaction: tx,
    });

    console.log("Transaction successful:", result);
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
    isLoading,
    coins,
    stableSwapObject,
    doSwap,
  };
};
