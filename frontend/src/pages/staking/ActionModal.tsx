import React, { useEffect, useMemo, useState } from "react";
import { ApyDisplay } from "@/pages/staking/ApyDisplay.tsx";
import { LendingPool } from "@/services/types.ts";
import { CoinMetadata } from "@mysten/sui/client";
import { Button } from "@/components/ui/button.tsx";

export default function ActionModal({
  isOpen,
  onClose,
  lendingPool,
  coinMetadata,
  availableBalance,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  lendingPool: LendingPool;
  coinMetadata: CoinMetadata;
  availableBalance: bigint;
  onSubmit: (lendingPool: LendingPool, denominatedAmount: number) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");

  const denominatedBalance = useMemo(() => {
    if (activeTab === "deposit") {
      return Number(availableBalance || 0n) / 10 ** coinMetadata.decimals;
    }

    // TODO: Handle withdraw
    return 0;
  }, [coinMetadata, availableBalance, activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > denominatedBalance) {
      return;
    }

    await onSubmit(lendingPool, parseFloat(amount));
  };

  useEffect(() => {
    setAmount("");
  }, [activeTab]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#0F172A] border border-slate-700 rounded-lg w-[480px] min-h-[320px] overflow-hidden shadow-xl">
        <form onSubmit={handleSubmit}>
          <div className="flex">
            <button
              className={`flex-1 py-4 text-center text-lg font-medium ${
                activeTab === "deposit"
                  ? "bg-gradient-to-r from-sky-400 to-sky-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("deposit")}
            >
              DEPOSIT
            </button>
            <button
              className={`flex-1 py-4 text-center text-lg font-medium ${
                activeTab === "withdraw"
                  ? "bg-gradient-to-r from-sky-400 to-sky-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("withdraw")}
            >
              WITHDRAW
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="relative">
              <div className="text-right mb-2">
                <div className="text-2xl font-mono text-white">{lendingPool.name}</div>
                <div className="text-gray-400">${lendingPool.price.toFixed(2)}</div>
              </div>
              <div className="relative rounded-lg bg-gray-800/50 p-4">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    step="0.00000001"
                    min="0.00000001"
                    max={denominatedBalance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent text-2xl text-white outline-none placeholder:text-gray-600 pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(denominatedBalance.toString())}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs bg-slate-500 hover:bg-slate-400 text-white rounded"
                  >
                    MAX
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-gray-400">
                    Balance: {denominatedBalance} {lendingPool.name}
                  </span>
                  <span className="text-gray-400">≈ ${(denominatedBalance * lendingPool.price).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {activeTab === "deposit" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-gray-400">
                  <div>Deposit APR</div>
                  <div>
                    <ApyDisplay
                      baseApy={lendingPool.baseSupplyApy}
                      rewards={lendingPool.supplyRewards}
                      totalApy={lendingPool.supplyApy}
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              className="w-full p-5 bg-gradient-to-r from-sky-500 to-sky-700 hover:from-sky-600 hover:to-sky-800 text-white font-medium rounded-lg"
              type="submit"
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > denominatedBalance}
            >
              {activeTab === "deposit" ? "Deposit" : "Withdraw"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
