import { useEffect, useState } from "react";
import { ArrowDown, Loader2, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/context/app.context.tsx";
import { ROUTES } from "@/lib/routes.ts";
import { Navigate } from "react-router-dom";
import { CoinWithBalance, useSwap } from "@/hooks/use-swap.ts";
import { formatBalance, toDenominatedAmount } from "@/lib/helpers.ts";
import { Button } from "@/components/ui/button.tsx";
import { applySlippage, getOutputAmount } from "@/lib/stableswap.ts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import bitcoinLogo from "@/assets/images/bitcoin_logo.svg";

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
      const denominatedInputAmount = toDenominatedAmount(inputAmount, inputCoin.decimals);

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

    const denominatedInputAmount = toDenominatedAmount(inputAmount, inputCoin.decimals);
    const denominatedOutputAmount = toDenominatedAmount(outputAmount, outputCoin.decimals);

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
        <div className="container max-w-xl contain mx-auto bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow flex flex-col gap-6">
          <h2 className="text-3xl font-bold text-slate-700 text-center">
            BTC StableSwap
          </h2>
          {isLoading ? (
            <div className="flex justify-center items-center w-full flex-col gap-2 p-4">
              <Loader2 className="inline-flex h-10 w-10 animate-spin ml-1 text-slate-500" />
              <div className="text-slate-500">Loading</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Input coin selection and amount */}
              <div className="">
                <div className="bg-white/50 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center mb-2 cursor-pointer">
                    <label className="text-sm text-slate-400">From</label>
                  </div>

                  <div className="flex items-center">
                    <div className="relative flex-grow text-slate-800 text-4xl font-bold">
                      <input
                        type="number"
                        placeholder="0.00000000"
                        step="0.00000001"
                        min="0.00000001"
                        max={inputCoin?.denominatedBalance}
                        value={inputAmount}
                        onChange={(e) => setInputAmount(e.target.value)}
                        className="w-full p-0 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-2 items-end-safe">
                      <Select value={inputCoin?.id} onValueChange={(value) => setInputCoin(coins.find((c) => c.id === value))}>
                        <SelectTrigger className="w-[180px] bg-white rounded-2xl outline-none shadow-none border-none px-4 py-6 text-lg">
                          <SelectValue placeholder="Theme" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {coins.map((coin) => (
                            <SelectItem key={coin.id} value={coin.id}>
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <img src={bitcoinLogo} alt={coin.symbol} className="w-7 h-7" />
                                  <span className="absolute bottom-0 -right-1 text-[8px] bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center">
                                    {coin.symbol.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span>{coin.symbol}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <div>
                      $0.0
                    </div>
                    <div className="text-sm flex items-center gap-2">
                      Balance:{" "}
                      {inputCoin && (<>{formatBalance(inputCoin.balance, inputCoin.decimals)} {inputCoin.symbol}</>)}
                      <Button variant="outline" size="sm" className="text-xs bg-slate-100 shadow-none" onClick={() => setInputAmount(inputCoin.denominatedBalance.toString())}>
                        MAX
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Swap direction button */}
              <div className="flex justify-center -my-8 relative z-10">
                <button
                  type="button"
                  onClick={handleSwapCoins}
                  className="bg-primary text-white rounded-full p-2 transform transition-transform hover:rotate-180"
                >
                  <ArrowDown className="h-8 w-8" />
                </button>
              </div>

              {/* Output coin selection and amount */}
              <div className="">
                <div className="bg-slate-200 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center mb-2 cursor-pointer">
                    <label className="text-sm text-slate-400">To</label>
                  </div>

                  <div className="flex items-center">
                    <div className="relative flex-grow text-slate-800 text-4xl font-bold">
                      <input
                        type="text"
                        placeholder="0.00000000"
                        value={outputAmount}
                        readOnly
                        className="w-full p-0 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>

                    <div className="flex flex-col gap-2 items-end-safe">
                      <Select
                        value={outputCoin?.id}
                        onValueChange={(value) => setOutputCoin(coins.find((c) => c.id === value))}
                      >
                        <SelectTrigger className="w-[180px] bg-slate-100 rounded-2xl outline-none shadow-none border-none px-4 py-6 text-lg">
                          <SelectValue placeholder="Theme" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-100">
                          {coins
                            .filter((coin) => coin.id !== inputCoin?.id)
                            .map((coin) => (
                              <SelectItem key={coin.id} value={coin.id}>
                                <div className="flex items-center gap-2">
                                  <div className="relative">
                                    <img src={bitcoinLogo} alt={coin.symbol} className="w-7 h-7" />
                                    <span className="absolute bottom-0 -right-1 text-[8px] bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center">
                                      {coin.symbol.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <span>{coin.symbol}</span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <div>
                      $0.0
                    </div>
                  </div>
                </div>
              </div>

              {/* Exchange rate display */}
              <div className="flex flex-col gap-2 my-4 px-2">
                <div className="flex items-center justify-between">
                  <div className="text-slate-500">Rate</div>
                  <div className="text-black flex items-center gap-1">
                    <RefreshCw
                      className="h-4 w-4 cursor-pointer mr-1"
                      onClick={() => setExchangeRateInversed(!exchangeRateInversed)}
                    />
                    1{" "}
                    {!exchangeRateInversed ? (
                      <>{inputCoin?.symbol} = {exchangeRate} {outputCoin?.symbol}</>
                    ) : (
                      <>{outputCoin?.symbol} = {exchangeRate} {inputCoin?.symbol}</>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-slate-500">Network fee</div>
                  <div className="text-black">~0.0025 SUI</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-slate-500">Estimated completion</div>
                  <div className="text-black">3 seconds</div>
                </div>
              </div>

              {/* Submit button */}
              <Button
                variant="default"
                size="xl"
                className="w-full"
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
            </form>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
