import React, { useEffect, useMemo, useState } from "react";
import { ApyDisplay } from "@/pages/staking/ApyDisplay.tsx";
import { AddressLendingInfo, LendingPool } from "@/services/types.ts";
import { CoinMetadata } from "@mysten/sui/client";
import { Button } from "@/components/ui/button.tsx";
import DynamicImage from "@/components/DynamicImage.tsx";
import { getBtcAssetIcon } from "@/services/config.ts";
import { Loader2 } from "lucide-react";
import { toDecimalAmount } from "@/lib/helpers.ts";
import { useApp } from "@/context/app.context.tsx";

export default function ActionModal({
  isOpen,
  onClose,
  lendingPool,
  addressLendingInfo,
  coinMetadata,
  availableBalance,
  handleSupply,
  handleWithdraw,
  loading,
  selectedAction,
}: {
  isOpen: boolean;
  onClose: () => void;
  lendingPool: LendingPool;
  addressLendingInfo: AddressLendingInfo | null;
  coinMetadata: CoinMetadata;
  availableBalance: bigint;
  handleSupply: (lendingPool: LendingPool, amount: number) => Promise<void>;
  handleWithdraw: (lendingPool: LendingPool, denominatedAmount: bigint) => Promise<void>;
  loading: boolean;
  selectedAction: "supply" | "withdraw";
}) {
  const { suiAddress } = useApp();

  const [activeTab, setActiveTab] = useState<"supply" | "withdraw">(selectedAction || "supply");
  const [amount, setAmount] = useState("");

  const denominatedBalance = useMemo(() => {
    if (activeTab === "supply") {
      return toDecimalAmount(availableBalance || 0n, coinMetadata.decimals);
    }

    return Number(
      toDecimalAmount(addressLendingInfo?.underlyingBalance || 0, coinMetadata.decimals).toFixed(coinMetadata.decimals),
    );
  }, [coinMetadata, availableBalance, activeTab, addressLendingInfo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > denominatedBalance) {
      return;
    }

    if (activeTab === "supply") {
      await handleSupply(lendingPool, parseFloat(amount));

      return;
    }

    await handleWithdraw(lendingPool, addressLendingInfo?.supplyBalance || 0n);
  };

  useEffect(() => {
    if (activeTab === "withdraw" && denominatedBalance > 0) {
      setAmount(denominatedBalance.toString());

      return;
    }

    setAmount("");
  }, [activeTab, denominatedBalance]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl w-[480px] overflow-hidden shadow-xl">
        <form onSubmit={handleSubmit}>
          <div className="flex">
            <button
              className={`flex-1 py-4 text-center text-lg font-medium ${
                activeTab === "supply" ? "bg-primary text-white" : "text-gray-500 hover:text-primary"
              }`}
              onClick={() => setActiveTab("supply")}
              type="button"
            >
              SUPPLY
            </button>
            <button
              className={`flex-1 py-4 text-center text-lg font-medium ${
                activeTab === "withdraw" ? "bg-primary text-white" : "text-gray-500 hover:text-primary"
              }`}
              onClick={() => setActiveTab("withdraw")}
              type="button"
            >
              WITHDRAW
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="relative">
              <div className="">
                <div className="bg-white/50 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center mb-2 cursor-pointer">
                    <label className="text-sm text-gray-500">Amount</label>
                  </div>

                  <div className="flex items-center">
                    <div className="relative flex-grow text-gray-800 text-4xl font-bold">
                      <input
                        type="number"
                        placeholder="0.00"
                        step="0.00000001"
                        min="0.00000001"
                        max={denominatedBalance}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-0 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        disabled={activeTab === "withdraw"}
                      />
                    </div>
                    <div className="flex flex-col gap-2 items-end-safe">
                      <div className="w-[150px] bg-white/80 rounded-2xl outline-none shadow-none border-none px-2 py-2 text-lg">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <img
                              src={coinMetadata?.iconUrl || getBtcAssetIcon(lendingPool.name)}
                              alt={lendingPool.name}
                              className="w-7 h-7"
                            />
                            <DynamicImage
                              path={`lending/${lendingPool.protocol}.png`}
                              alt={`${lendingPool.protocol}`}
                              className="absolute bottom-0 -right-0.5 w-3 h-3 bg-gray-700 rounded-4xl"
                            />
                          </div>
                          <span className="font-semibold">{lendingPool.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-gray-500">
                    <div>${(denominatedBalance * lendingPool.price).toFixed(2)}</div>
                    <div className="text-sm flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        Balance: {denominatedBalance} {lendingPool.name}
                        {activeTab === "supply" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs bg-white/80 shadow-none"
                            onClick={() => setAmount(denominatedBalance.toString())}
                          >
                            MAX
                          </Button>
                        )}
                      </div>
                      {/* <span className="text-gray-400">≈ ${(denominatedBalance * lendingPool.price).toFixed(2)}</span> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-gray-600 font-semibold">
              <div className="flex items-start justify-between">
                <div>Market</div>
                <div className="text-primary flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <div className="relative mr-1">
                      <img
                        src={coinMetadata?.iconUrl || getBtcAssetIcon(lendingPool.name)}
                        alt={lendingPool.name}
                        className="w-5 h-5"
                      />
                      <DynamicImage
                        path={`lending/${lendingPool.protocol}.png`}
                        alt={`${lendingPool.protocol}`}
                        className="absolute bottom-0 right-0 translate-y-1/4 w-2 h-2 bg-slate-700 rounded-4xl"
                      />
                    </div>
                    {lendingPool.name}
                  </div>
                  <div className="text-gray-500 text-sm font-normal">${lendingPool.price.toFixed(2)}</div>
                </div>
              </div>
              {activeTab === "supply" && (
                <div className="flex items-center justify-between">
                  <div>Supply APR</div>
                  <div className="text-primary">
                    <ApyDisplay
                      baseApy={lendingPool.baseSupplyApy}
                      rewards={lendingPool.supplyRewards}
                      totalApy={lendingPool.supplyApy}
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="default"
              size="xl"
              className="w-full"
              type="submit"
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > denominatedBalance || loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {!suiAddress ? <>Please connect a wallet</> : activeTab === "supply" ? "Supply" : "Withdraw All"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
