import React, { useEffect, useMemo, useState } from "react";
import { ApyDisplay } from "@/pages/staking/ApyDisplay.tsx";
import { AddressLendingInfo, LendingPool } from "@/services/types.ts";
import { CoinMetadata } from "@mysten/sui/client";
import { Button } from "@/components/ui/button.tsx";
import DynamicImage from "@/components/DynamicImage.tsx";
import { getBtcAssetIcon } from "@/services/config.ts";

export default function ActionModal({
  isOpen,
  onClose,
  lendingPool,
  addressLendingInfo,
  coinMetadata,
  availableBalance,
  handleSupply,
  handleWithdraw,
}: {
  isOpen: boolean;
  onClose: () => void;
  lendingPool: LendingPool;
  addressLendingInfo: AddressLendingInfo | null;
  coinMetadata: CoinMetadata;
  availableBalance: bigint;
  handleSupply: (lendingPool: LendingPool, denominatedAmount: number) => Promise<void>;
  handleWithdraw: (
    lendingPool: LendingPool,
    addressLendingInfo: AddressLendingInfo,
    denominatedAmount: number,
  ) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<"supply" | "withdraw">("supply");
  const [amount, setAmount] = useState("");

  const denominatedBalance = useMemo(() => {
    if (activeTab === "supply") {
      return Number(availableBalance || 0n) / 10 ** coinMetadata.decimals;
    }

    console.log("address lending info", addressLendingInfo);

    // TODO: Handle withdraw
    return ((addressLendingInfo?.supplyBalance || 0) / 10 ** coinMetadata.decimals).toFixed(coinMetadata.decimals);
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

    await handleWithdraw(lendingPool, addressLendingInfo, parseFloat(amount));
  };

  useEffect(() => {
    if (activeTab === "withdraw" && denominatedBalance > 0) {
      setAmount(denominatedBalance.toString())

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
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#0F172A] border border-slate-700 rounded-lg w-[480px] min-h-[320px] overflow-hidden shadow-xl">
        <form onSubmit={handleSubmit}>
          <div className="flex">
            <button
              className={`flex-1 py-4 text-center text-lg font-medium ${
                activeTab === "supply"
                  ? "bg-gradient-to-r from-sky-400 to-sky-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("supply")}
              type="button"
            >
              SUPPLY
            </button>
            <button
              className={`flex-1 py-4 text-center text-lg font-medium ${
                activeTab === "withdraw"
                  ? "bg-gradient-to-r from-sky-400 to-sky-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("withdraw")}
              type="button"
            >
              WITHDRAW
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="relative">
              <div className="text-right mb-2">
                <div className="text-2xl font-mono text-white flex justify-end">
                  <div className="relative mr-1">
                    <img
                      src={coinMetadata?.iconUrl || getBtcAssetIcon(lendingPool.name)}
                      alt={lendingPool.name}
                      className="w-8 h-8"
                    />
                    <DynamicImage
                      path={`lending/${lendingPool.protocol}.png`}
                      alt={`${lendingPool.protocol}`}
                      className="absolute bottom-0 right-0 translate-y-1/4 w-4 h-4 bg-slate-700 rounded-4xl"
                    />
                  </div>
                  {lendingPool.name}
                </div>
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
                    disabled={activeTab === "withdraw"}
                  />
                  {activeTab === "supply" && (
                    <button
                      type="button"
                      onClick={() => setAmount(denominatedBalance.toString())}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs bg-slate-500 hover:bg-slate-400 text-white rounded"
                    >
                      MAX
                    </button>
                  )}
                </div>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-gray-400">
                    Balance: {denominatedBalance} {lendingPool.name}
                  </span>
                  <span className="text-gray-400">≈ ${(denominatedBalance * lendingPool.price).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {activeTab === "supply" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-gray-400">
                  <div>Supply APR</div>
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
              {activeTab === "supply" ? "Supply" : "Withdraw"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
