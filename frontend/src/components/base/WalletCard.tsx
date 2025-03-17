import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { formatTrimmed, getExplorerUrlAddress } from "@/lib/helpers.ts";
import { Loader2 } from "lucide-react";

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
  children = undefined,
}) {
  return (
    <Card className="bg-slate-50/5 border-slate-700 shadow-lg overflow-hidden backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center`}>
            <span className="text-lg">{icon}</span>
          </div>
          <CardTitle className="text-lg text-white">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <>{notConnectedElement}</>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-400 mb-1">Connected:</div>
              <a
                href={getExplorerUrlAddress(addressType, address)}
                target={"_blank"}
                className={
                  "flex bg-slate-800 rounded-md px-3 py-2 text-sm text-slate-300 border border-slate-700 truncate"
                }
              >
                {formatTrimmed(address, 16)}
              </a>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs text-slate-400 mb-1">Balance:</div>
                <div className="flex items-center gap-2">
                  <span className="text-white text-lg font-medium">{balance}</span>
                  {loading && <Loader2 className="inline-flex h-4 w-4 animate-spin ml-1" />}
                  <span className={`${currencyColor}`}>{currency}</span>
                </div>
              </div>

              <div className={`w-8 h-8 flex items-center justify-center`}>
                <span className="text-lg">{currencyIcon}</span>
              </div>
            </div>

            {children}

            <Button
              variant="destructive"
              className="w-full mt-2 bg-red-600 hover:bg-red-700"
              onClick={disconnectWallet}
            >
              Disconnect
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
