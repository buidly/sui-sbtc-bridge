import React from "react";
import sbtcLogo from "@/assets/images/sbtc_logo.png";
import { ArrowRight } from "lucide-react";
import suiLogo from "@/assets/images/sui_logo.svg";
import bitcoinLogo from "@/assets/images/bitcoin_logo.svg";

function Navbar() {
  return (
    <div className="flex justify-center items-center mb-8 mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          <em className="text-sky-400">Sui</em>
          <em className="text-orange-400"> sBTC </em>
          <em className="text-amber-500">Bridge</em>
        </h1>
        <div className="flex items-center justify-center mt-4 bg-slate-50/5 rounded-full px-6 py-3 shadow-md">
          <img src={bitcoinLogo} alt="Bitcoin Logo" className="h-8 w-8 mx-1" />
          <ArrowRight className="h-5 w-5 mx-2 text-gray-400" />
          <img src={sbtcLogo} alt="Stacks Logo" className="h-8 w-8 mx-1" />
          <ArrowRight className="h-5 w-5 mx-2 text-gray-400" />
          <img src={suiLogo} alt="Sui Logo" className="h-8 w-8 mx-1" />
        </div>
      </div>
    </div>
  );
}

export default Navbar;
