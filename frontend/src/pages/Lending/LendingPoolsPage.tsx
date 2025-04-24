import { Tooltip } from "@/components/ui/Tooltip";
import React, { useEffect, useState } from "react";
import { LendingPool } from "./LendingMarkets/LendingPools";
import { NaviPoolProvider } from "./LendingMarkets/Navi/NaviPools";
import { ScallopPoolProvider } from "./LendingMarkets/Scallop/ScallopPools";
import { SuilendPoolProvider } from "./LendingMarkets/Suilend/SuilendPools";
import { RewardInfo } from "./LendingMarkets/LendingPools";
import { useApp } from "@/context/app.context.tsx";
import { Navigate } from "react-router-dom";
import { ROUTES } from "@/lib/routes.ts";
import { Loader2 } from "lucide-react";

const ICON_MAP: Record<string, string> = {
  WBTC: "wbtc",
  SUIBTC: "suibtc",
  LBTC: "lbtc",
  LORENZOBTC: "stbtc",
};

function getAssetIcon(assetName: string): string {
  const id = ICON_MAP[assetName.toUpperCase()];
  let extension = ".png";
  if (id === "wbtc") {
    extension = ".svg";
  }
  return `https://app.naviprotocol.io/imgs/token/${id}${extension}`;
}

function ApyDisplay({ baseApy, rewards, totalApy }: { baseApy: number; rewards: RewardInfo[]; totalApy: number }) {
  const tooltipContent = (
    <div className="px-3 py-2 space-y-1 bg-[#0F172A] text-white rounded">
      <div className="flex flex-col">
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400">Base APR</span>
            <span className="text-white">{Math.abs(baseApy).toFixed(2)}%</span>
          </div>
          {rewards.map((reward) => (
            <div key={reward.symbol} className="flex items-center justify-between gap-4">
              <span className="text-gray-400 flex items-center gap-2">{reward.symbol} Rewards</span>
              <span className="text-white">{Math.abs(reward.apy).toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-1">
      <span>{Math.abs(totalApy).toFixed(3)}%</span>
      {rewards.length > 0 && (
        <Tooltip content={tooltipContent}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
        </Tooltip>
      )}
    </div>
  );
}

function ActionModal({ isOpen, onClose, asset }: { isOpen: boolean; onClose: () => void; asset: LendingPool }) {
  const [activeTab, setActiveTab] = useState<"deposit" | "borrow">("deposit");
  const [amount, setAmount] = useState("");

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
              activeTab === "borrow"
                ? "bg-gradient-to-r from-sky-400 to-sky-700 text-white"
                : "text-slate-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("borrow")}
          >
            BORROW
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="relative">
            <div className="text-right mb-2">
              <div className="text-2xl font-mono text-white">{asset.name}</div>
              <div className="text-gray-400">${asset.price.toFixed(2)}</div>
            </div>
            <div className="relative rounded-lg bg-gray-800/50 p-4">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-2xl text-white outline-none placeholder:text-gray-600 pr-20"
                />
                <button className="absolute right-0 px-3 py-1 text-sm rounded bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600">
                  MAX
                </button>
              </div>
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-gray-400">Balance: 0.00 {asset.name}</span>
                <span className="text-gray-400">≈ $0.00</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-gray-400">
              <div>Price</div>
              <div>$1.00</div>
            </div>

            <div className="flex items-center justify-between text-gray-400">
              <div>{activeTab === "deposit" ? "Deposit APR" : "Borrow APR"}</div>
              <div>
                <ApyDisplay
                  baseApy={activeTab === "deposit" ? asset.baseSupplyApy : asset.baseBorrowApy}
                  rewards={activeTab === "deposit" ? asset.supplyRewards : asset.borrowRewards}
                  totalApy={activeTab === "deposit" ? asset.supplyApy : asset.borrowApy}
                />
              </div>
            </div>
          </div>

          <button
            className={`w-full py-4 rounded-lg text-white font-medium ${
              amount
                ? "bg-gradient-to-r from-sky-400 to-sky-700 hover:from-sky-400/90 hover:to-sky-700/90"
                : "bg-slate-800 text-slate-400 cursor-not-allowed"
            }`}
            disabled={!amount}
          >
            {activeTab === "deposit" ? "Deposit" : "Borrow"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LendingPoolsPage() {
  const { suiAddress } = useApp();

  const [pools, setPools] = useState<LendingPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"supplies" | "borrows">("supplies");
  const [selectedPool, setSelectedPool] = useState<LendingPool | null>(null);

  useEffect(() => {
    async function fetchPools() {
      try {
        const providers = [new NaviPoolProvider(), new ScallopPoolProvider(), new SuilendPoolProvider()];
        const poolsArrays = await Promise.all(providers.map((provider) => provider.getPools()));
        const allPools = poolsArrays.flat();
        setPools(allPools);
      } catch (error) {
        console.error("Error fetching pools:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPools();
  }, []);

  if (!suiAddress) {
    return <Navigate to={ROUTES.home} replace />;
  }

  if (loading) {
    return (
      <Loader2 className="h-10 w-10 mx-auto animate-spin text-sky-500" />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Your Supplies/Borrows Section */}
      <div className="bg-slate-50/5 border border-slate-700 rounded-lg shadow-xl backdrop-blur-sm">
        <div className="flex border-b border-slate-700">
          <div className="flex-1 relative">
            <button
              onClick={() => setActiveTab("supplies")}
              className={`w-full py-4 text-center text-lg font-medium transition-colors ${
                activeTab === "supplies" ? "text-sky-400" : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Your Supplies
            </button>
            {activeTab === "supplies" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400" />}
          </div>
          <div className="flex-1 relative">
            <button
              onClick={() => setActiveTab("borrows")}
              className={`w-full py-4 text-center text-lg font-medium transition-colors ${
                activeTab === "borrows" ? "text-sky-400" : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Your Borrows
            </button>
            {activeTab === "borrows" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400" />}
          </div>
        </div>

        <div className="p-6">
          <table className="w-full text-left text-slate-300">
            <thead>
              <tr className="text-slate-400">
                <th className="py-3">Assets</th>
                <th className="py-3">Balance</th>
                <th className="py-3">APR</th>
                <th className="py-3">Max LTV</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>{/* Add your supply/borrow items here */}</tbody>
          </table>
        </div>
      </div>

      {/* Assets to Supply Section */}
      <div className="bg-slate-50/5 border border-slate-700 rounded-lg p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-white mb-4">Assets To Supply</h2>

        {/* Assets Table */}
        <table className="w-full text-left text-slate-300">
          <thead>
            <tr className="text-slate-400">
              <th className="py-3">Assets</th>
              <th className="py-3">Wallet Balance</th>
              <th className="py-3">APR</th>
              <th className="py-3">Total Value Locked</th>
              <th className="py-3"></th>
            </tr>
          </thead>
          <tbody>
            {pools.map((pool) => (
              <tr key={`${pool.protocol}-${pool.coinType}`} className="border-t border-slate-700">
                <td className="py-4 flex items-center gap-2">
                  <img src={getAssetIcon(pool.name)} alt={pool.name} className="w-8 h-8" />
                  <div>
                    <div className="font-medium text-white">{pool.name}</div>
                    <div className="text-sm text-slate-400">${pool.price.toFixed(2)}</div>
                  </div>
                </td>
                <td className="py-4">{pool.totalSupply.toFixed(2)}</td>
                <td className="py-4">
                  <ApyDisplay baseApy={pool.baseSupplyApy} rewards={pool.supplyRewards} totalApy={pool.supplyApy} />
                </td>
                <td className="py-4">${pool.tvl.toLocaleString()}</td>
                <td className="py-4">
                  <button
                    onClick={() => setSelectedPool(pool)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-400 to-sky-700 hover:from-sky-400/90 hover:to-sky-700/90 text-white"
                  >
                    Supply
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Modal */}
      {selectedPool && (
        <ActionModal isOpen={!!selectedPool} onClose={() => setSelectedPool(null)} asset={selectedPool} />
      )}
    </div>
  );
}
