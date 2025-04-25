import React, { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { createNetworkConfig, SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@/context/app.context";
import { STACKS_NETWORK } from "@/api/stacks.ts";
import { BalancesProvider } from "@/context/balances.context.tsx";

import "@mysten/dapp-kit/dist/index.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

const { networkConfig: suiNetworkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
});
const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={suiNetworkConfig}
        defaultNetwork={STACKS_NETWORK === "testnet" ? "testnet" : "mainnet"}
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
    </QueryClientProvider>
    ,
  </BrowserRouter>,
  // </StrictMode>,
);
