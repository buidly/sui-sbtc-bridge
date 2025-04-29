import { useMemo, useState } from "react";
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
import { getBtcAssetIcon } from "@/services/config.ts";
import { SUI_NETWORK } from '@/api/sui.ts';

export function Staking() {
  const { suiAddress } = useApp();

  const {
    pools,
    allLendingAddressInfo,
    loading,
    coinsMetadata,
    balances,
    handleSupply,
    handleWithdraw,
    loadingTransaction,
  } = useStaking();

  const [selectedPool, setSelectedPool] = useState<LendingPool | null>(null);
  const selectedAddressLendingInfo = useMemo(() => {
    if (!selectedPool) {
      return null;
    }

    return (
      allLendingAddressInfo.find(
        (info) => info.protocol === selectedPool.protocol && info.name === selectedPool.name,
      ) || null
    );
  }, [pools, allLendingAddressInfo, selectedPool]);

  if (!suiAddress) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="bg-slate-50/5 border border-slate-700 rounded-lg p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-6 text-white">
          Stake BTC Coins {SUI_NETWORK === "testnet" && '(MAINNET ONLY!)'} {loading && <Loader2 className="inline-flex h-5 w-5 animate-spin ml-1" />}
        </h2>

        <table className="w-full text-left text-slate-300">
          <thead>
            <tr className="text-slate-400">
              <th className="py-3">Assets</th>
              <th className="py-3">Wallet Balance</th>
              <th className="py-3">Staked Balance</th>
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
                      src={coinsMetadata?.[pool.coinType]?.iconUrl || getBtcAssetIcon(pool.name)}
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
                  <strong>
                    {formatBalance(balances?.[pool.coinType] || 0n, coinsMetadata?.[pool.coinType]?.decimals)}{" "}
                    {coinsMetadata?.[pool.coinType]?.symbol}
                  </strong>
                </td>
                <td className="py-4">
                  <strong>
                    {formatBalance(
                      allLendingAddressInfo.find((info) => info.protocol === pool.protocol && info.name === pool.name)
                        ?.underlyingBalance || 0n,
                      coinsMetadata?.[pool.coinType]?.decimals,
                    )}{" "}
                    {coinsMetadata?.[pool.coinType]?.symbol}
                  </strong>
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

      {selectedPool && (
        <ActionModal
          isOpen={!!selectedPool}
          onClose={() => setSelectedPool(null)}
          lendingPool={selectedPool}
          addressLendingInfo={selectedAddressLendingInfo}
          coinMetadata={coinsMetadata?.[selectedPool.coinType]}
          availableBalance={balances?.[selectedPool.coinType]}
          handleSupply={handleSupply}
          handleWithdraw={handleWithdraw}
          loading={loadingTransaction}
        />
      )}
    </div>
  );
}
