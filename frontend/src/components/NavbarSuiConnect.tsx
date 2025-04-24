import React from "react";
import { useApp } from "@/context/app.context";
import { formatBalance, formatTrimmed } from "@/lib/helpers";
import { useBalances } from "@/context/balances.context.tsx";
import suiLogo from "@/assets/images/sui_logo.svg";

function NavbarSuiConnect() {
  const { suiAddress } = useApp();
  const { suiBalances } = useBalances();

  if (!suiAddress) return null;

  return (
    <div className="flex items-center bg-slate-50/5 border border-slate-700 rounded-full px-4 py-2 shadow-lg backdrop-blur-sm">
      <span className="text-slate-300 text-sm mr-2">{formatTrimmed(suiAddress, 8)}</span>
      <div className="flex items-center">
        <span className="text-white text-sm font-medium">{formatBalance(suiBalances?.suiBalance, 9)}</span>
        <img src={suiLogo} alt={"SUI Logo"} className="ml-1 h-4 w-4" />
      </div>
      {/*<div className="flex items-center">*/}
      {/*  <span className="text-white text-sm font-medium">{formatBalance(suiBalances?.sbtcBalance, 8)}</span>*/}
      {/*  <img src={sbtcLogo} alt="sBTC Logo" className="ml-1 h-4 w-4" />*/}
      {/*</div>*/}
    </div>
  );
}

export default NavbarSuiConnect;
