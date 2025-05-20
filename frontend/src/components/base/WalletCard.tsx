import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { formatTrimmed, getExplorerUrlAddress } from "@/lib/helpers.ts";
import { Loader2, UnplugIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";

export function WalletCard({
  title,
  icon,
  isConnected,
  notConnectedElement,
  address,
  addressType,
  balance,
  currency,
  currencyIcon,
  currencyColor,
  disconnectWallet,
  loading,
  extraElement = undefined,
  children = undefined,
  className = undefined,
}) {
  return (
    <Card className={cn("bg-white/50 rounded-2xl p-4 overflow-hidden shadow-none w-full gap-4", className)}>
      <CardHeader className="p-0 flex flex-row justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center`}>
            <span className="text-lg">{icon}</span>
          </div>
          <CardTitle className="text-lg text-slate-800">{title}</CardTitle>
        </div>
        <Button
          variant="ghost"
          className=" text-slate-500 hover:text-black"
          onClick={disconnectWallet}
        >
          <UnplugIcon />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {!isConnected ? (
          <>{notConnectedElement}</>
        ) : (
          <div className="flex flex-col gap-2">
            <div>
              <a
                href={getExplorerUrlAddress(addressType, address)}
                target={"_blank"}
                className={
                  "flex bg-slate-100 rounded-2xl outline-none px-4 py-2 truncate"
                }
              >
                {formatTrimmed(address, 11)}
              </a>
            </div>

            {extraElement}

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="text-gray-500 text-sm">Balance</div>
                <div className="flex items-center">
                  {loading ? <Loader2 className="inline-flex h-4 w-4 animate-spin mr-2" /> : <span className="text-gray-800 text-lg font-medium mr-2">{balance}</span>}
                  <span className={`${currencyColor}`}>{currency}</span>
                  <span className="text-lg">{currencyIcon}</span>
                </div>
              </div>
            </div>

            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
