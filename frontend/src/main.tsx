import React, { useEffect, useState } from "react";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { createNetworkConfig, SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@/context/app.context";
import { BalancesProvider } from "@/context/balances.context.tsx";

import "@mysten/dapp-kit/dist/index.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { SUI_NETWORK } from "@/api/sui.ts";
import { ROUTES } from "@/lib/routes.ts";

const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
});
const queryClient = new QueryClient();

function SuiController() {
  const [activeNetwork, setActiveNetwork] = useState(SUI_NETWORK as keyof typeof networkConfig);

  const location = useLocation();

  useEffect(() => {
    if (location.pathname === ROUTES.staking) {
      setActiveNetwork("mainnet");
    } else {
      setActiveNetwork("testnet");
    }
  }, [location.pathname]);

  return (
    <SuiClientProvider
      networks={networkConfig}
      network={activeNetwork}
      onNetworkChange={(network) => {
        setActiveNetwork(network);
      }}
    >
      <WalletProvider autoConnect={true}>
        <AppProvider>
          <BalancesProvider>
            <App />

            <ToastContainer position="bottom-right" autoClose={3_000} />
          </BalancesProvider>
        </AppProvider>
      </WalletProvider>
    </SuiClientProvider>
  );
}

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <SuiController />
    </QueryClientProvider>
  </BrowserRouter>,
  // </StrictMode>,
);
