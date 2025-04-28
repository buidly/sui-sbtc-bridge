import { useEffect, useState } from "react";
import { AddressLendingInfo, LendingPool } from "@/services/types.ts";
import { AllLendingProviders, LendingProtocol } from "@/services/config.ts";
import { CoinMetadata } from "@mysten/sui/client";
import { SuiApi } from "@/api/sui.ts";
import { useApp } from "@/context/app.context.tsx";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { pool } from "navi-sdk/src/address.ts";
import { depositCoin } from "navi-sdk/src/libs/PTB";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { toast } from "react-toastify";
import { withdrawCoin } from "navi-sdk";

export const useStaking = () => {
  const { suiAddress } = useApp();

  const { mutateAsync: signAndExecuteTransaction, status } = useSignAndExecuteTransaction();

  const [pools, setPools] = useState<LendingPool[]>([]);
  const [allLendingAddressInfo, setAllLendingAddressInfo] = useState<AddressLendingInfo[]>([]);
  const [coinsMetadata, setCoinsMetadata] = useState<{ [coinType: string]: CoinMetadata }>({});
  const [balances, setBalances] = useState<{ [coinType: string]: bigint }>({});
  const [loading, setLoading] = useState(true);

  const fetchBalances = async () => {
    setLoading(true);

    const result = await SuiApi.getAddressCoinsBalances(suiAddress, Object.keys(coinsMetadata));
    setBalances(result);

    setLoading(false);
  };

  const fetchAddressLendingInfo = async () => {
    try {
      setLoading(true);
      const addressLendingInfo = await Promise.all(
        AllLendingProviders.map((provider) => provider.getAddressInfo(suiAddress)),
      );
      setAllLendingAddressInfo(addressLendingInfo.flat());
    } catch (error) {
      console.error("Error fetching pools:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupply = async (lendingPool: LendingPool, denominatedAmount: number) => {
    if (!denominatedAmount) {
      return;
    }

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
    console.log("Staking supply transaction successful:", result);

    toast.success("Supply succeeded!");
  };

  const handleWithdraw = async (
    lendingPool: LendingPool,
    addressLendingInfo: AddressLendingInfo,
    denominatedAmount: number,
  ) => {
    if (!denominatedAmount) {
      return;
    }

    const amount = Math.round(denominatedAmount * 10 ** coinsMetadata[lendingPool.coinType].decimals);

    const tx = new Transaction();
    tx.setSender(suiAddress);

    switch (lendingPool.protocol) {
      case LendingProtocol.NAVI: {
        const poolConfig = Object.values(pool).find((pool) => pool.type === lendingPool.coinType);

        if (!poolConfig) {
          console.error("No pool config...");
          return;
        }

        const [returnedCoin] = await withdrawCoin(tx, poolConfig, amount);

        tx.transferObjects([returnedCoin], suiAddress);

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

    console.log("Staking withdraw transaction successful:", result);

    toast.success("Withdraw succeeded!");
  };

  useEffect(() => {
    if (status === "pending") {
      toast.warning("Waiting for transaction...");
    } else if (status === "success") {
      // Fetch coins with a timeout so rpc reflects changes
      setTimeout(() => {
        fetchBalances();
        fetchAddressLendingInfo();
      }, 250);
    } else if (status === "error") {
      toast.error("Transaction failed...");
    }
  }, [status]);

  useEffect(() => {
    async function fetchPools() {
      try {
        setLoading(true);
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
    fetchAddressLendingInfo();
  }, [suiAddress, coinsMetadata]);

  return { pools, allLendingAddressInfo, loading, coinsMetadata, balances, handleSupply, handleWithdraw };
};
