import { useApp } from "@/context/app.context.tsx";
import { useEffect, useMemo, useState } from "react";
import { StableSwapPool, SuiApi } from "@/api/sui.ts";
import { ENV } from "@/lib/env.ts";
import { CoinMetadata } from "@mysten/sui/client";

export type CoinWithBalance = CoinMetadata & {
  denominatedBalance: number;
  balance: bigint;
  coinType: string;
};

export const useSwap = () => {
  const { suiAddress } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [stableSwapObject, setStableSwapObject] = useState<StableSwapPool>();
  const [btcCoins, setBtcCoins] = useState<{ [coinType: string]: CoinMetadata }>({});
  const [balances, setBalances] = useState<{ [coinType: string]: bigint }>({});

  useEffect(() => {
    // TODO: This can be moved to the microservice
    const getData = async () => {
      setIsLoading(true);

      const result = await SuiApi.getObject(ENV.STABLE_SWAP_POOL_OBJECT);
      setStableSwapObject(result);

      const coinsMetadata = await SuiApi.getCoinsMetadata(result.types);
      setBtcCoins(coinsMetadata);

      setIsLoading(false);
    };

    getData();
  }, []);

  useEffect(() => {
    if (!suiAddress) {
      return;
    }

    const getData = async () => {
      setIsLoading(true);

      const result = await SuiApi.getAddressCoinsBalances(suiAddress, Object.keys(btcCoins));
      setBalances(result);

      setIsLoading(false);
    };

    getData();
  }, [suiAddress, btcCoins]);

  const coins = useMemo<CoinWithBalance[]>(() => {
    if (!btcCoins || !balances) {
      return [];
    }

    return Object.entries(btcCoins).map(([coinType, metadata]) => {
      return {
        ...metadata,
        symbol: metadata.name, // TODO: Remove this in prod
        balance: balances?.[coinType] || 0n,
        denominatedBalance: Number(balances?.[coinType] || 0n) / 10 ** metadata.decimals,
        coinType,
      };
    });
  }, [btcCoins, balances]);

  return {
    isLoading,
    isError,
    coins,
  };
};
