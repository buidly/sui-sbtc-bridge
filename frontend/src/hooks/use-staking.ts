import { useEffect, useState } from "react";
import { LendingPool } from "@/services/types.ts";
import { AllLendingProviders, LendingProtocol } from "@/services/config.ts";
import { CoinMetadata } from "@mysten/sui/client";
import { SuiApi } from "@/api/sui.ts";
import { useApp } from "@/context/app.context.tsx";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { pool } from "navi-sdk/src/address.ts";
import { depositCoin } from "navi-sdk/src/libs/PTB";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { toast } from "react-toastify";

export const useStaking = () => {
  const { suiAddress } = useApp();

  const { mutateAsync: signAndExecuteTransaction, status } = useSignAndExecuteTransaction();

  const [pools, setPools] = useState<LendingPool[]>([]);
  const [coinsMetadata, setCoinsMetadata] = useState<{ [coinType: string]: CoinMetadata }>({});
  const [balances, setBalances] = useState<{ [coinType: string]: bigint }>({});
  const [loading, setLoading] = useState(true);

  const fetchBalances = async () => {
    setLoading(true);

    const result = await SuiApi.getAddressCoinsBalances(suiAddress, Object.keys(coinsMetadata));
    setBalances(result);

    setLoading(false);
  };

  const handleSubmit = async (lendingPool: LendingPool, denominatedAmount: number) => {
    if (!denominatedAmount) {
      return;
    }

    // TODO:
    console.log("Handle submit!");

    const amount = Math.round(denominatedAmount * 10 ** coinsMetadata[lendingPool.coinType].decimals);

    const tx = new Transaction();
    tx.setSender(suiAddress);

    const coin = coinWithBalance({
      type: lendingPool.coinType,
      balance: amount,
    });

    switch (lendingPool.protocol) {
      case LendingProtocol.NAVI: {
        const poolConfig = Object.values(pool).find((pool) => pool.type === lendingPool.coinType);

        if (!poolConfig) {
          console.error("No pool config...");
          return;
        }

        console.log(poolConfig);

        await depositCoin(tx, poolConfig, coin, amount);

        break;
      }
      case LendingProtocol.SCALLOP: {
        break;
      }
      case LendingProtocol.SUILEND: {
        break;
      }
    }

    const result = await signAndExecuteTransaction({
      transaction: tx,
    });

    console.log("Transaction successful:", result);
  };

  useEffect(() => {
    if (status === "pending") {
      toast.warning("Depositing...");
    } else if (status === "success") {
      toast.success("Deposit succeeded!");

      // Fetch coins with a timeout so rpc reflects changes
      setTimeout(() => {
        fetchStableSwap();

        fetchBalances();
      }, 250);
    } else if (status === "error") {
      toast.error("Deposit failed...");
    }
  }, [status]);

  useEffect(() => {
    async function fetchPools() {
      try {
        const poolsArrays = await Promise.all(AllLendingProviders.map((provider) => provider.getPools()));
        const allPools = poolsArrays.flat().sort((poolA, poolB) => {
          if (poolA.coinType < poolB.coinType) {
            return -1; // poolA should come before poolB
          }
          if (poolA.coinType > poolB.coinType) {
            return 1; // poolA should come after poolB
          }
          return 0; // poolA and poolB have the same coinType (order doesn't matter for grouping)
        });

        const coinTypes = allPools.map((pool) => pool.coinType);

        const result = await SuiApi.getCoinsMetadata(coinTypes);
        console.log(result);
        setCoinsMetadata(result);

        setPools(allPools);
      } catch (error) {
        console.error("Error fetching pools:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPools();
  }, []);

  useEffect(() => {
    if (!suiAddress || !Object.keys(coinsMetadata).length) {
      return;
    }

    fetchBalances();
  }, [suiAddress, coinsMetadata]);

  return { pools, loading, coinsMetadata, balances, handleSubmit };
};
