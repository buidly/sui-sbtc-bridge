import { useEffect, useState } from "react";
import { ArrowDown, Loader2, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/context/app.context.tsx";
import { ROUTES } from "@/lib/routes.ts";
import { Navigate } from "react-router-dom";
import { CoinWithBalance, useSwap } from "@/hooks/use-swap.ts";
import { formatBalance } from "@/lib/helpers.ts";
import { Button } from "@/components/ui/button.tsx";
import { applySlippage, getOutputAmount } from "@/lib/stableswap.ts";

export default function Swap() {
  const { suiAddress } = useApp();
  const { isLoading, coins, stableSwapObject, doSwap } = useSwap();

  const [inputCoin, setInputCoin] = useState<CoinWithBalance | undefined>();
  const [outputCoin, setOutputCoin] = useState<CoinWithBalance | undefined>();

  useEffect(() => {
    setInputCoin(coins[0]);
    setOutputCoin(coins[1]);
  }, [coins]);

  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [exchangeRateInversed, setExchangeRateInversed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update output amount when input amount or coins change
  useEffect(() => {
    if (inputCoin === outputCoin) {
      setOutputCoin(coins.filter((coin) => coin.id !== inputCoin?.id)[0]);
      setOutputAmount("");

      return;
    }

    if (parseFloat(inputAmount) > inputCoin.denominatedBalance) {
      setInputAmount(inputCoin.denominatedBalance.toString());
      return;
    }

    if (inputAmount && !isNaN(parseFloat(inputAmount))) {
      const denominatedInputAmount = BigInt(Math.round(parseFloat(inputAmount) * 10 ** inputCoin.decimals));

      try {
        let outputAmount = getOutputAmount(
          inputCoin.coinType,
          outputCoin.coinType,
          denominatedInputAmount,
          stableSwapObject,
        );

        outputAmount = applySlippage(outputAmount);

        setOutputAmount(formatBalance(outputAmount, outputCoin.decimals));

        return;
      } catch (e) {
        console.error(e);
      }
    }

    setOutputAmount("");
  }, [inputAmount, inputCoin, outputCoin]);

  // Calculate exchange rate
  useEffect(() => {
    if (!inputAmount || !outputAmount) {
      setExchangeRate("-");
      return;
    }

    if (!exchangeRateInversed) {
      setExchangeRate((Number.parseFloat(outputAmount) / Number.parseFloat(inputAmount)).toFixed(8));
    } else {
      setExchangeRate((Number.parseFloat(inputAmount) / Number.parseFloat(outputAmount)).toFixed(8));
    }
  }, [inputAmount, outputAmount, exchangeRateInversed]);

  // Handle form submission
  const handleSubmit = async (e) => {
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

    const denominatedInputAmount = BigInt(Math.round(parseFloat(inputAmount) * 10 ** inputCoin.decimals));
    const denominatedOutputAmount = BigInt(Math.round(parseFloat(outputAmount) * 10 ** outputCoin.decimals));

    try {
      await doSwap(inputCoin.coinType, outputCoin.coinType, denominatedInputAmount, denominatedOutputAmount);

      setInputAmount("");
      setOutputAmount("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
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
                  <RefreshCw
                    className="h-3 w-3 mr-1 mt-1 cursor-pointer"
                    onClick={() => setExchangeRateInversed(!exchangeRateInversed)}
                  />
                  <span>
                    Rate: 1{" "}
                    {!exchangeRateInversed ? (
                      <>
                        {inputCoin?.symbol} = {exchangeRate} {outputCoin?.symbol}
                      </>
                    ) : (
                      <>
                        {outputCoin?.symbol} = {exchangeRate} {inputCoin?.symbol}
                      </>
                    )}
                  </span>
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
                  Network fee: ~0.0025 SUI • Estimated completion: 3 seconds
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
