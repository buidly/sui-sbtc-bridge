import { useState } from "react";
import { useApp } from "@/context/app.context.tsx";
import { Navigate } from "react-router-dom";
import { ROUTES } from "@/lib/routes.ts";
import { Loader2 } from "lucide-react";
import DynamicImage from "@/components/DynamicImage.tsx";
import { ApyDisplay } from "@/pages/staking/ApyDisplay.tsx";
import ActionModal from "@/pages/staking/ActionModal.tsx";
import { LendingPool } from "@/services/types.ts";
import { useStaking } from "@/hooks/use-staking.ts";
import { formatBalance } from "@/lib/helpers.ts";

const ICON_MAP: Record<string, string> = {
  WBTC: "wbtc",
  SUIBTC: "suibtc",
  LBTC: "lbtc",
  LORENZOBTC: "stbtc",
};

function getAssetIcon(assetName: string): string {
  if (!assetName) {
    return "";
  }

  const id = ICON_MAP[assetName.toUpperCase()];
  let extension = ".png";
  if (id === "wbtc") {
    extension = ".svg";
  }
  return `https://app.naviprotocol.io/imgs/token/${id}${extension}`;
}

export function Staking() {
  const { suiAddress } = useApp();

  const { pools, loading, coinsMetadata, balances, handleSubmit } = useStaking();

  const [activeTab, setActiveTab] = useState<"supplies" | "borrows">("supplies");
  const [selectedPool, setSelectedPool] = useState<LendingPool | null>(null);

  if (!suiAddress) {
    return <Navigate to={ROUTES.home} replace />;
  }

  if (loading) {
    return <Loader2 className="h-10 w-10 mx-auto animate-spin text-sky-400" />;
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
            <tbody>{/* TODO: Add your supply/borrow items here */}</tbody>
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
                  <div className="relative">
                    <img
                      src={coinsMetadata?.[pool.coinType]?.iconUrl || getAssetIcon(pool.name)}
                      alt={pool.name}
                      className="w-8 h-8"
                    />
                    <DynamicImage
                      path={`lending/${pool.protocol}.png`}
                      alt={`${pool.protocol}`}
                      className="absolute bottom-0 right-0 translate-y-1/4 w-4 h-4 bg-slate-700 rounded-4xl"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-white">{coinsMetadata?.[pool.coinType]?.symbol}</div>
                    <div className="text-sm text-slate-400">${pool.price.toFixed(2)}</div>
                  </div>
                </td>
                <td className="py-4">
                  {formatBalance(balances?.[pool.coinType] || 0n, coinsMetadata?.[pool.coinType]?.decimals)}
                </td>
                <td className="py-4">
                  <ApyDisplay baseApy={pool.baseSupplyApy} rewards={pool.supplyRewards} totalApy={pool.supplyApy} />
                </td>
                <td className="py-4">
                  ${pool.tvl.toLocaleString()}{" "}
                  <small>
                    ({pool.totalSupply.toFixed(2)} {coinsMetadata?.[pool.coinType]?.symbol})
                  </small>
                </td>
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
        <ActionModal
          isOpen={!!selectedPool}
          onClose={() => setSelectedPool(null)}
          lendingPool={selectedPool}
          coinMetadata={coinsMetadata?.[selectedPool.coinType]}
          availableBalance={balances?.[selectedPool.coinType]}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
