import "./App.css";
import Navbar from "./components/Navbar";
import { Route, Routes } from "react-router-dom";
import Bridge from "@/pages/Bridge.tsx";
import { ROUTES } from "@/lib/routes.ts";
import Swap from "@/pages/Swap.tsx";
import { useAutoConnectWallet } from "@mysten/dapp-kit";
import { Loader2 } from "lucide-react";
import { Staking } from "@/pages/Staking.tsx";

function App() {
  const suiAutoConnectionStatus = useAutoConnectWallet();

  return (
    <div className="min-h-screen p-6 flex flex-col gap-10 bg-[url(/bg_orange_2.jpg)] bg-cover bg-center bg-fixed bg-no-repeat">
      <Navbar />
      <div>
        {suiAutoConnectionStatus === "idle" ? (
          <Loader2 className="h-10 w-10 mx-auto animate-spin text-sky-400" />
        ) : (
          <Routes>
            <Route path={ROUTES.home} element={<Bridge />} />
            <Route path={ROUTES.swap} element={<Swap />} />
            <Route path={ROUTES.staking} element={<Staking />} />
          </Routes>
        )}
      </div>
    </div>
  );
}

export default App;
