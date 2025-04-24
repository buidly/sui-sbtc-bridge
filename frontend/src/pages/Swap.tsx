import React, { useState, useEffect, useMemo } from "react";
import { ArrowDown, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/app.context.tsx";
import { ROUTES } from "@/lib/routes.ts";
import { Navigate } from "react-router-dom";
import { CoinWithBalance, useSwap } from "@/hooks/use-swap.ts";
import { formatBalance } from "@/lib/helpers.ts";
import { Button } from "@/components/ui/button.tsx";

export default function Swap() {
  const { suiAddress } = useApp();
  const { isLoading, coins } = useSwap();

  const [inputCoin, setInputCoin] = useState<CoinWithBalance | undefined>();
  const [outputCoin, setOutputCoin] = useState<CoinWithBalance | undefined>();

  useEffect(() => {
    setInputCoin(coins[0]);
    setOutputCoin(coins[1]);
  }, [coins]);

  // Exchange rates between coins (simplified for demo)
  const exchangeRates = {
    "btc-sbtc": 0.98, // 1 BTC = 0.98 sBTC (due to fees)
    "btc-suibtc": 0.97, // 1 BTC = 0.97 suiBTC
    "btc-sui": 23500, // 1 BTC = 23500 SUI
    "sbtc-btc": 1.01, // 1 sBTC = 1.01 BTC
    "sbtc-suibtc": 0.99, // 1 sBTC = 0.99 suiBTC
    "sbtc-sui": 24000, // 1 sBTC = 24000 SUI
    "suibtc-btc": 1.02, // 1 suiBTC = 1.02 BTC
    "suibtc-sbtc": 1.01, // 1 suiBTC = 1.01 sBTC
    "suibtc-sui": 24500, // 1 suiBTC = 24500 SUI
    "sui-btc": 0.000042, // 1 SUI = 0.000042 BTC
    "sui-sbtc": 0.000041, // 1 SUI = 0.000041 sBTC
    "sui-suibtc": 0.00004, // 1 SUI = 0.000040 suiBTC
  };

  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate exchange rate between selected coins
  const getExchangeRate = () => {
    if (!inputCoin || !outputCoin) {
      return 1;
    }

    const key = `${inputCoin.id}-${outputCoin.id}`;
    return exchangeRates[key] || 1;
  };

  // Update output amount when input amount or coins change
  useEffect(() => {
    if (inputCoin === outputCoin) {
      setOutputCoin(coins.filter(coin => coin.id !== inputCoin.id)[0]);
    }

    if (inputAmount && !isNaN(parseFloat(inputAmount))) {
      const rate = getExchangeRate();
      setOutputAmount((parseFloat(inputAmount) * rate).toFixed(8));
    } else {
      setOutputAmount("");
    }
  }, [inputAmount, inputCoin, outputCoin]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !inputCoin ||
      !outputCoin ||
      !inputAmount ||
      parseFloat(inputAmount) <= 0 ||
      parseFloat(inputAmount) > inputCoin.denominatedBalance
    ) {
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      // Reset form in a real app
      setInputAmount("");
      setOutputAmount("");
    }, 2000);
  };

  // Swap input and output coins
  const handleSwapCoins = () => {
    const tempCoin = inputCoin;
    setInputCoin(outputCoin);
    setOutputCoin(tempCoin);
  };

  if (!suiAddress) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="swap"
        initial={{ opacity: 0, x: 0 }}
        animate={{ opacity: 1, x: 0, width: "auto" }}
        exit={{ opacity: 0, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <div className="bg-slate-800 border border-slate-700 shadow-xl backdrop-blur-sm text-white relative rounded-lg w-full max-w-md p-6">
              <h2 className="text-2xl font-bold text-center mb-6">
                Swap BTC Coins {isLoading && <Loader2 className="inline-flex h-4 w-4 animate-spin ml-1" />}
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Input coin selection and amount */}
                <div className="mb-4">
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm text-slate-400">From</label>
                      <span className="text-sm text-slate-400">
                        Balance:{" "}
                        {inputCoin && (
                          <>
                            {formatBalance(inputCoin.balance, inputCoin.decimals)} {inputCoin.symbol}
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <div className="relative flex-grow">
                        <input
                          type="number"
                          placeholder="0.00000000"
                          step="0.00000001"
                          min="0.00000001"
                          max={inputCoin?.denominatedBalance}
                          value={inputAmount}
                          onChange={(e) => setInputAmount(e.target.value)}
                          className="w-full p-3 bg-slate-600 border border-slate-500 rounded-lg text-white"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setInputAmount(inputCoin.denominatedBalance.toString())}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs bg-slate-500 hover:bg-slate-400 text-white rounded"
                        >
                          MAX
                        </button>
                      </div>

                      <select
                        value={inputCoin?.id}
                        onChange={(e) => setInputCoin(coins.find((c) => c.id === e.target.value))}
                        className="bg-slate-600 border border-slate-500 rounded-lg p-3 min-w-24"
                      >
                        {coins.map((coin) => (
                          <option key={coin.id} value={coin.id}>
                            {coin.symbol}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Swap direction button */}
                <div className="flex justify-center -my-6 relative z-10">
                  <button
                    type="button"
                    onClick={handleSwapCoins}
                    className="bg-sky-600 hover:bg-sky-700 rounded-full p-2 transform transition-transform hover:rotate-180"
                  >
                    <ArrowDown className="h-5 w-5" />
                  </button>
                </div>

                {/* Output coin selection and amount */}
                <div className="mb-1 mt-4">
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm text-slate-400">To</label>
                      <span className="text-sm text-slate-400">
                        Balance:{" "}
                        {outputCoin && (
                          <>
                            {formatBalance(outputCoin.balance, outputCoin.decimals)} {outputCoin.symbol}
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="0.00000000"
                        value={outputAmount}
                        readOnly
                        className="w-full p-3 bg-slate-600 border border-slate-500 rounded-lg text-white cursor-not-allowed"
                      />

                      <select
                        value={outputCoin?.id}
                        onChange={(e) => setOutputCoin(coins.find((c) => c.id === e.target.value))}
                        className="bg-slate-600 border border-slate-500 rounded-lg p-3 min-w-24"
                      >
                        {coins
                          .filter((coin) => coin.id !== inputCoin?.id)
                          .map((coin) => (
                            <option key={coin.id} value={coin.id}>
                              {coin.symbol}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Exchange rate display */}
                <div className="text-center text-sm text-slate-400 mb-3 flex items-center justify-center">
                  <span>
                    Rate: 1 {inputCoin?.symbol} = {getExchangeRate()} {outputCoin?.symbol}
                  </span>
                  <RefreshCw className="h-3 w-3 ml-2" />
                </div>

                {/* Submit button */}
                <Button
                  className="w-full p-3 bg-gradient-to-r from-sky-500 to-sky-700 hover:from-sky-600 hover:to-sky-800 text-white font-medium rounded-lg"
                  type="submit"
                  disabled={
                    !inputCoin ||
                    !outputCoin ||
                    isSubmitting ||
                    !inputAmount ||
                    parseFloat(inputAmount) <= 0 ||
                    parseFloat(inputAmount) > inputCoin.denominatedBalance
                  }
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing Swap...
                    </div>
                  ) : (
                    `Swap ${inputCoin?.symbol} to ${outputCoin?.symbol}`
                  )}
                </Button>

                <div className="mt-2 text-center text-xs text-slate-400">
                  Network fee: ~0.005 SUI • Estimated completion: 30 seconds
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
