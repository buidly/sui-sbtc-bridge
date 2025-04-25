import { CoinMetadata } from "@mysten/sui/client";
import { useQuery } from "@tanstack/react-query";
import { MicroserviceApi } from "@/api/microservice.ts";

export const useSuiBtcCoins = (): {
  btcCoins: { [coinType: string]: CoinMetadata };
  isLoading?: boolean;
  error?: any;
  refetch?: () => Promise<any>;
} => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["sui-btc-coins"],
    queryFn: () => MicroserviceApi.getSuiBtcCoins(),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  return {
    btcCoins: data || {},
    isLoading,
    error,
  };
};
