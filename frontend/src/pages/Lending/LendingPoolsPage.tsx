import { Tooltip } from "@/components/ui/Tooltip";
import { useEffect, useState } from "react";
import { LendingPool } from "./LendingMarkets/LendingPools";
import { NaviPoolProvider } from "./LendingMarkets/Navi/NaviPools";
import { ScallopPoolProvider } from "./LendingMarkets/Scallop/ScallopPools";
import { SuilendPoolProvider } from "./LendingMarkets/Suilend/SuilendPools";

export function LendingPoolsPage() {
  const [pools, setPools] = useState<LendingPool[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Lending Markets</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pools.map((pool) => (
          <div
            key={`${pool.protocol}-${pool.coinType}`}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">{pool.name}</h3>
                <span className="text-xs text-gray-500 capitalize">{pool.protocol}</span>
              </div>
              <span className="text-gray-500 text-sm">
                ${pool.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Supply APY</div>
                  <div className="text-lg font-semibold text-green-600">{pool.supplyApy.toFixed(2)}%</div>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Borrow APY</div>
                  <div className="text-lg font-semibold text-red-600">{pool.borrowApy.toFixed(2)}%</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Supply</span>
                  <span className="font-medium">
                    {pool.totalSupply.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Borrow</span>
                  <span className="font-medium">
                    {pool.totalBorrow.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    TVL
                    <Tooltip content="Total Value Locked: The total dollar value of all assets deposited in this lending pool. This metric represents the size and liquidity of the pool.">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4 text-gray-400 hover:text-gray-600"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                        />
                      </svg>
                    </Tooltip>
                  </span>
                  <span className="font-medium">
                    ${pool.tvl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
