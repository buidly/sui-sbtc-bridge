import { useEffect, useState } from "react";
import { AddressLendingInfo, LendingPool, LendingProtocol } from "@/services/types.ts";
import { AllLendingProviders } from "@/services/config.ts";
import { CoinMetadata } from "@mysten/sui/client";
import { SuiApi } from "@/api/sui.ts";
import { useApp } from "@/context/app.context.tsx";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { pool } from "navi-sdk/src/address.ts";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { toast } from "react-toastify";
import { depositCoin, withdrawCoin } from 'navi-sdk';
import scallopPoolProvider from "@/services/ScallopPools.ts";
import suilendPoolProvider from "@/services/SuilendPools.ts";
import { toDenominatedAmount } from "@/lib/helpers.ts";
import { MicroserviceApi } from "@/api/microservice.ts";
import { ENV } from "@/lib/env.ts";
import { applySlippage, getOutputAmount, stableSwapTransaction } from "@/lib/stableswap.ts";

export const useStaking = () => {
  const { suiAddress } = useApp();

  const { mutateAsync: signAndExecuteTransaction, status } = useSignAndExecuteTransaction();

  const [pools, setPools] = useState<LendingPool[]>([]);
  const [allLendingAddressInfo, setAllLendingAddressInfo] = useState<AddressLendingInfo[]>([]);
  const [coinsMetadata, setCoinsMetadata] = useState<{ [coinType: string]: CoinMetadata }>({});
  const [balances, setBalances] = useState<{ [coinType: string]: bigint }>({});
  const [loading, setLoading] = useState(true);
  const [loadingTransaction, setLoadingTransaction] = useState(false);
  // TODO: Simple mode does not yet work on mainnet since we have no contract there, re-test after contract is created
  const [isAdvanced, setIsAdvanced] = useState(false);

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

    let tx: Transaction = new Transaction();
    tx.setSender(suiAddress);

    let inputCoin: any = null;

    const outputCoinType = lendingPool.coinType;
    const balance = balances[outputCoinType];

    if (balance > 0n) {
      inputCoin = coinWithBalance({
        type: outputCoinType,
        balance: balance >= denominatedAmount ? denominatedAmount : balance,
      });
    }

    // If we don't have enough balance of current BTC coin, do required swaps
    if (!isAdvanced && balance < denominatedAmount) {
      const stableSwapObject = await SuiApi.getStableSwapPool(ENV.STABLE_SWAP_POOL_OBJECT);

      const neededCoins: { type: string; balance: bigint; outputAmount: bigint }[] = [];
      let neededBalance = denominatedAmount - balance;

      // Go through BTC coins in descending order and swap the minimum that is needed
      for (let [coinType, value] of Object.entries(balances).sort(([, value1], [, value2]) =>
        value1 > value2 ? -1 : 1,
      )) {
        if (coinType === lendingPool.coinType) {
          continue;
        }

        if (neededBalance <= 0n) {
          break;
        }

        const tempAmount = value < neededBalance ? value : neededBalance;

        // Calculate the amount the swap gives us, but consider input amount as the one we want
        let outputAmount = getOutputAmount(coinType, outputCoinType, tempAmount, stableSwapObject);
        outputAmount = applySlippage(outputAmount, 50n); // Apply 0.5% slippage since pool contents change with each swap

        neededBalance -= tempAmount;
        neededCoins.push({
          type: coinType,
          balance: tempAmount,
          outputAmount,
        });
      }

      if (neededBalance != 0n) {
        throw new Error("Not enough BTC balance");
      }

      // Do how many swaps are required
      const swapOutputCoins = [];
      for (const coin of neededCoins) {
        const tempCoin = coinWithBalance(coin);

        const outputCoin = stableSwapTransaction(tx, coin.type, outputCoinType, coin.outputAmount, tempCoin);

        swapOutputCoins.push(outputCoin);
      }

      const coinsToMerge = [...swapOutputCoins.slice(1)];
      if (inputCoin) {
        coinsToMerge.push(inputCoin);
      }

      if (coinsToMerge.length > 0) {
        tx.mergeCoins(swapOutputCoins[0], coinsToMerge);
      }

      inputCoin = swapOutputCoins[0];
    }

    if (!inputCoin) {
      throw new Error('Not enough balance');
    }

    switch (lendingPool.protocol) {
      case LendingProtocol.NAVI: {
        const poolConfig = Object.values(pool).find((pool) => pool.type === lendingPool.coinType);

        if (!poolConfig) {
          console.error("No pool config...");
          return;
        }

        await depositCoin(tx, poolConfig, inputCoin, Number(denominatedAmount));

        break;
      }
      case LendingProtocol.SCALLOP: {
        tx = await scallopPoolProvider.supplyTx(tx, inputCoin, lendingPool.coinType, suiAddress);

        break;
      }
      case LendingProtocol.SUILEND: {
        tx = await suilendPoolProvider.supplyTx(tx, inputCoin, lendingPool.coinType, suiAddress);

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

        const { pools, coinsMetadata } = await MicroserviceApi.getLendingBtcPools();

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
    isAdvanced,
    setIsAdvanced,
  };
};
