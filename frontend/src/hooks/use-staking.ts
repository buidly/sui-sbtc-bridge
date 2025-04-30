import { useEffect, useState } from "react";
import { AddressLendingInfo, LendingPool, LendingProtocol } from "@/services/types.ts";
import { AllLendingProviders } from "@/services/config.ts";
import { CoinMetadata } from "@mysten/sui/client";
import { SuiApi } from "@/api/sui.ts";
import { useApp } from "@/context/app.context.tsx";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { pool } from "navi-sdk/src/address.ts";
import { depositCoin } from "navi-sdk/src/libs/PTB";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { toast } from "react-toastify";
import { withdrawCoin } from "navi-sdk";
import scallopPoolProvider from "@/services/ScallopPools.ts";
import suilendPoolProvider from "@/services/SuilendPools.ts";
import { toDenominatedAmount } from "@/lib/helpers.ts";
import { MicroserviceApi } from "@/api/microservice.ts";
import naviPoolProvider from '@/services/NaviPools.ts';

export const useStaking = () => {
  const { suiAddress } = useApp();

  const { mutateAsync: signAndExecuteTransaction, status } = useSignAndExecuteTransaction();

  const [pools, setPools] = useState<LendingPool[]>([]);
  const [allLendingAddressInfo, setAllLendingAddressInfo] = useState<AddressLendingInfo[]>([]);
  const [coinsMetadata, setCoinsMetadata] = useState<{ [coinType: string]: CoinMetadata }>({});
  const [balances, setBalances] = useState<{ [coinType: string]: bigint }>({});
  const [loading, setLoading] = useState(true);
  const [loadingTransaction, setLoadingTransaction] = useState(false);

  const fetchBalances = async () => {
    setLoadingTransaction(true);

    const result = await SuiApi.getAddressCoinsBalances(suiAddress, Object.keys(coinsMetadata), true);
    setBalances(result);

    setLoadingTransaction(false);
  };

  const fetchAddressLendingInfo = async () => {
    setLoadingTransaction(true);

    try {
      const addressLendingInfo = await Promise.all(
        AllLendingProviders.map((provider) => provider.getAddressInfo(suiAddress)),
      );
      setAllLendingAddressInfo(addressLendingInfo.flat());
    } catch (error) {
      console.error("Error fetching pools:", error);
    } finally {
      setLoadingTransaction(false);
    }
  };

  const handleSupply = async (lendingPool: LendingPool, amount: number) => {
    if (!amount) {
      return;
    }

    setLoadingTransaction(true);

    const denominatedAmount = toDenominatedAmount(amount, coinsMetadata[lendingPool.coinType].decimals);

    let tx: Transaction;
    switch (lendingPool.protocol) {
      case LendingProtocol.NAVI: {
        const poolConfig = Object.values(pool).find((pool) => pool.type === lendingPool.coinType);

        if (!poolConfig) {
          console.error("No pool config...");
          return;
        }

        tx = new Transaction();
        tx.setSender(suiAddress);

        const coin = coinWithBalance({
          type: lendingPool.coinType,
          balance: denominatedAmount,
        });

        await depositCoin(tx, poolConfig, coin, Number(denominatedAmount));

        break;
      }
      case LendingProtocol.SCALLOP: {
        tx = await scallopPoolProvider.supplyTx(lendingPool.coinType, suiAddress, denominatedAmount);

        break;
      }
      case LendingProtocol.SUILEND: {
        tx = await suilendPoolProvider.supplyTx(lendingPool.coinType, suiAddress, denominatedAmount);

        break;
      }
    }

    setLoadingTransaction(false);

    if (!tx) {
      return;
    }

    const result = await signAndExecuteTransaction({
      // @ts-ignore
      transaction: tx,
    });
    console.log("Staking supply transaction successful:", result);

    toast.success("Supply succeeded!");
  };

  const handleWithdraw = async (lendingPool: LendingPool, denominatedAmount: bigint) => {
    if (!denominatedAmount) {
      return;
    }

    setLoadingTransaction(true);

    let tx: Transaction;
    switch (lendingPool.protocol) {
      case LendingProtocol.NAVI: {
        const poolConfig = Object.values(pool).find((pool) => pool.type === lendingPool.coinType);

        if (!poolConfig) {
          console.error("No pool config...");
          return;
        }

        tx = new Transaction();
        tx.setSender(suiAddress);

        const [returnedCoin] = await withdrawCoin(tx, poolConfig, Number(denominatedAmount));

        tx.transferObjects([returnedCoin], suiAddress);

        break;
      }
      case LendingProtocol.SCALLOP: {
        tx = await scallopPoolProvider.withdrawTx(lendingPool.coinType, suiAddress, denominatedAmount);

        break;
      }
      case LendingProtocol.SUILEND: {
        tx = await suilendPoolProvider.withdrawTx(lendingPool.coinType, suiAddress, denominatedAmount);

        break;
      }
    }

    setLoadingTransaction(false);

    if (!tx) {
      return;
    }

    const result = await signAndExecuteTransaction({
      // @ts-ignore
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
      }, 300);
    } else if (status === "error") {
      toast.error("Transaction failed...");
    }
  }, [status]);

  useEffect(() => {
    async function fetchPools() {
      try {
        setLoading(true);

        const naviPools = await naviPoolProvider.getPools();
        const { pools: apiPools, coinsMetadata } = await MicroserviceApi.getLendingBtcPools();

        const pools = [...naviPools, ...apiPools].sort((poolA, poolB) => {
          if (poolA.coinType < poolB.coinType) {
            return -1; // poolA should come before poolB
          }
          if (poolA.coinType > poolB.coinType) {
            return 1; // poolA should come after poolB
          }
          return 0; // poolA and poolB have the same coinType (order doesn't matter for grouping)
        });

        setCoinsMetadata(coinsMetadata);
        setPools(pools);
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

  return {
    pools,
    allLendingAddressInfo,
    loading,
    coinsMetadata,
    balances,
    handleSupply,
    handleWithdraw,
    loadingTransaction: loadingTransaction || status === "pending",
  };
};
