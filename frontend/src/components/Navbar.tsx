import React from "react";
import { Badge } from "@/components/ui/badge.tsx";

function Navbar() {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold text-sky-400">
        <a href="/">Sui sBTC Bridge</a>
      </h1>
      <Badge variant="outline" className="bg-slate-700 text-cyan-100 border-slate-600 px-4 py-1 text-sm">
        TBD
      </Badge>
    </div>
  );
}

export default Navbar;
