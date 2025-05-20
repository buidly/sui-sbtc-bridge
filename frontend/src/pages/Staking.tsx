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
  const [selectedAction, setSelectedAction] = useState<"supply" | "withdraw" | null>('supply');
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
      <div className="container max-w-5xl contain mx-auto bg-white/50 backdrop-blur-lg rounded-2xl p-6 shadow flex flex-col gap-6">
        {SUI_NETWORK === "testnet" && (
          <Alert variant="warning" className="opacity-90 bg-white/50 border-none text-[#f7931a]">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle className="font-semibold">Warning</AlertTitle>
            <AlertDescription className="text-gray-600!">
              This is a testnet version of the platform. Please use the mainnet version if you want to stake BTC.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-center">
          <h2 className="text-3xl font-bold text-black text-center">
            Lending
          </h2>
        </div>
        {loading ? (
          <div className="flex justify-center items-center w-full flex-col gap-2 p-6">
            <Loader2 className="inline-flex h-10 w-10 animate-spin ml-1 text-gray-500" />
            <div className="text-gray-500">Loading</div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="bg-white/50 rounded-2xl p-6">
              <h3 className="text-xl text-gray-800">
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
                  <Label htmlFor="advanced" className="text-sm text-gray-500">
                    {isAdvanced ? "Advanced view" : "Simple view"}
                  </Label>
                </Tooltip>
                <Switch id="advanced" checked={isAdvanced} onCheckedChange={() => setIsAdvanced(!isAdvanced)} />
              </div>
              <table className="w-full text-left text-gray-800">
                <thead>
                  <tr className="">
                    <th className="p-3">Assets</th>
                    {isAdvanced && <th className="p-3">Wallet Balance</th>}
                    <th className="p-3">Staked Balance</th>
                    <th className="p-3">APR</th>
                    <th className="p-3">Total Value Locked</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {pools.map((pool) => (
                    <tr key={`${pool.protocol}-${pool.coinType}`} className="border-t border-gray-600/20">
                      <td className="p-3 flex items-center gap-2">
                        <div className="relative">
                          <img
                            src={coinsMetadata?.[pool.coinType]?.iconUrl || getBtcAssetIcon(pool.name)}
                            alt={pool.name}
                            className="w-8 h-8"
                          />
                          <DynamicImage
                            path={`lending/${pool.protocol}.png`}
                            alt={`${pool.protocol}`}
                            className="absolute bottom-0 right-0 translate-y-1/4 w-4 h-4 bg-gray-700 rounded-4xl"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{coinsMetadata?.[pool.coinType]?.symbol}</div>
                          <div className="text-sm text-gray-800">${pool.price.toFixed(2)}</div>
                        </div>
                      </td>
                      {isAdvanced && (
                        <td className="p-3">
                          <strong className="font-semibold">
                            {formatBalance(balances?.[pool.coinType] || 0n, coinsMetadata?.[pool.coinType]?.decimals)}{" "}
                            {coinsMetadata?.[pool.coinType]?.symbol}
                          </strong>
                        </td>
                      )}
                      <td className="p-3">
                        <strong className="font-semibold">
                          {formatBalance(
                            allLendingAddressInfo.find((info) => info.protocol === pool.protocol && info.name === pool.name)
                              ?.underlyingBalance || 0n,
                            coinsMetadata?.[pool.coinType]?.decimals,
                          )}{" "}
                          {coinsMetadata?.[pool.coinType]?.symbol}
                        </strong>
                      </td>
                      <td className="p-3 font-semibold">
                        <ApyDisplay baseApy={pool.baseSupplyApy} rewards={pool.supplyRewards} totalApy={pool.supplyApy} />
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col font-semibold">
                          ${pool.tvl.toLocaleString()}{" "}
                          <small className="font-normal">
                            ({pool.totalSupply.toFixed(2)} {coinsMetadata?.[pool.coinType]?.symbol})
                          </small>
                        </div>
                      </td>
                      <td className="p-3 flex justify-end gap-2">
                        <Button variant="default" className="text-sm" onClick={() => { setSelectedPool(pool); setSelectedAction('supply') }}>
                          Supply
                        </Button>
                        <Button variant="default" className="text-sm bg-black hover:bg-black/80" onClick={() => { setSelectedPool(pool); setSelectedAction('withdraw') }}>
                          Withdraw
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
            onClose={() => { setSelectedPool(null); setSelectedAction('supply') }}
            lendingPool={selectedPool}
            addressLendingInfo={selectedAddressLendingInfo}
            coinMetadata={coinsMetadata?.[selectedPool.coinType]}
            availableBalance={isAdvanced ? balances?.[selectedPool.coinType] : aggregatedBalance}
            handleSupply={handleSupply}
            handleWithdraw={handleWithdraw}
            loading={loadingTransaction}
            selectedAction={selectedAction}
          />
        )}
      </div>
    </>
  );
}
