import { useMemo, useState } from "react";
import { useApp } from "@/context/app.context.tsx";
import { Navigate } from "react-router-dom";
import { ROUTES } from "@/lib/routes.ts";
import { TriangleAlert, Loader2 } from "lucide-react";
import DynamicImage from "@/components/DynamicImage.tsx";
import { ApyDisplay } from "@/pages/staking/ApyDisplay.tsx";
import ActionModal from "@/pages/staking/ActionModal.tsx";
import { LendingPool } from "@/services/types.ts";
import { useStaking } from "@/hooks/use-staking.ts";
import { formatBalance } from "@/lib/helpers.ts";
import { getBtcAssetIcon } from "@/services/config.ts";
import { SUI_NETWORK } from "@/api/sui.ts";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Tooltip } from "@/components/ui/Tooltip.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
    isAdvanced,
    setIsAdvanced,
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

  const aggregatedBalance = useMemo(() => {
    return Object.values(balances).reduce((sum, balance) => {
      sum += balance;

      return sum;
    }, 0n);
  }, [balances]);

  if (!suiAddress) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return (
    <>
      <div className="container max-w-5xl contain mx-auto bg-white/30 backdrop-blur-lg rounded-2xl p-6 shadow flex flex-col gap-6">
        {SUI_NETWORK === "testnet" && (
          <Alert variant="warning">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This is a testnet version of the platform. Please use the mainnet version if you want to stake BTC.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-center">
          <h1 className="text-3xl font-bold text-slate-700">
            Market
          </h1>
        </div>
        {loading ? (
          <div className="flex justify-center items-center w-full flex-col gap-2 p-4">
            <Loader2 className="inline-flex h-10 w-10 animate-spin ml-1 text-slate-500" />
            <div className="text-slate-500">Loading</div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-200 rounded-2xl p-4">
              <h3 className="text-xl text-slate-800">
                <strong>Wallet Balance:</strong> {formatBalance(aggregatedBalance, 8)} BTC
              </h3>
            </div>
            <div>
              <div className="flex items-center space-x-2 align-middle justify-end">
                <Tooltip
                  content={
                    isAdvanced ? (
                      <>Keeps all your different BTC coins separate</>
                    ) : (
                      <>Aggregates all your BTC coins into one</>
                    )
                  }
                >
                  <Label htmlFor="advanced" className="text-sm text-slate-400">
                    {isAdvanced ? "Advanced view" : "Simple view"}
                  </Label>
                </Tooltip>
                <Switch id="advanced" checked={isAdvanced} onCheckedChange={() => setIsAdvanced(!isAdvanced)} />
              </div>
              <table className="w-full text-left text-slate-800">
                <thead>
                  <tr className="">
                    <th className="py-3">Assets</th>
                    {isAdvanced && <th className="py-3">Wallet Balance</th>}
                    <th className="py-3">Staked Balance</th>
                    <th className="py-3">APR</th>
                    <th className="py-3">Total Value Locked</th>
                    <th className="py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {pools.map((pool) => (
                    <tr key={`${pool.protocol}-${pool.coinType}`} className="border-t border-slate-400/50">
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
                          <div className="font-medium text-slate-800">{coinsMetadata?.[pool.coinType]?.symbol}</div>
                          <div className="text-sm text-slate-800">${pool.price.toFixed(2)}</div>
                        </div>
                      </td>
                      {isAdvanced && (
                        <td className="py-4">
                          <strong>
                            {formatBalance(balances?.[pool.coinType] || 0n, coinsMetadata?.[pool.coinType]?.decimals)}{" "}
                            {coinsMetadata?.[pool.coinType]?.symbol}
                          </strong>
                        </td>
                      )}
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
                      <td className="py-4 flex justify-end">
                        <Button
                          variant="default"
                          onClick={() => setSelectedPool(pool)}
                        >
                          Supply
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* OLD UI */}
      <div className="container mx-auto px-4 py-8 space-y-8">

        {selectedPool && (
          <ActionModal
            isOpen={!!selectedPool}
            onClose={() => setSelectedPool(null)}
            lendingPool={selectedPool}
            addressLendingInfo={selectedAddressLendingInfo}
            coinMetadata={coinsMetadata?.[selectedPool.coinType]}
            availableBalance={isAdvanced ? balances?.[selectedPool.coinType] : aggregatedBalance}
            handleSupply={handleSupply}
            handleWithdraw={handleWithdraw}
            loading={loadingTransaction}
          />
        )}
      </div>
    </>
  );
}
