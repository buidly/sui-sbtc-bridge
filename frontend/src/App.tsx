import "./App.css";
import Navbar from "./components/Navbar";
import { LendingPoolsPage } from "@/pages/Lending";
import { Route, Routes } from "react-router-dom";
import Bridge from "@/pages/Bridge.tsx";
import { ROUTES } from "@/lib/routes.ts";
import Swap from "@/pages/Swap.tsx";
import { useAutoConnectWallet } from "@mysten/dapp-kit";
import { Loader2 } from "lucide-react";

function App() {
  const suiAutoConnectionStatus = useAutoConnectWallet();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <Navbar />

        {suiAutoConnectionStatus === "idle" ? (
          <Loader2 className="h-10 w-10 mx-auto animate-spin" />
        ) : (
          <Routes>
            <Route path={ROUTES.home} element={<Bridge />} />
            <Route path={ROUTES.swap} element={<Swap />} />
            <Route path={ROUTES.staking} element={<LendingPoolsPage />} />
          </Routes>
        )}
      </div>
    </div>
  );
}

export default App;
