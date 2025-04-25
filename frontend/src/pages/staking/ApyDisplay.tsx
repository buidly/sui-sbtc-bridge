import { Tooltip } from "@/components/ui/Tooltip.tsx";
import { RewardInfo } from "@/services/types.ts";

export function ApyDisplay({
  baseApy,
  rewards,
  totalApy,
}: {
  baseApy: number;
  rewards: RewardInfo[];
  totalApy: number;
}) {
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
