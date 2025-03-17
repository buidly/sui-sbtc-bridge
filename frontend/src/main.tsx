import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { createNetworkConfig, SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@/context/app.context";

import "@mysten/dapp-kit/dist/index.css";
import { STACKS_NETWORK } from "@/api/stacks.ts";
import { BalancesProvider } from "@/context/balances.context.tsx";

// Sui
const { networkConfig: suiNetworkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
});
const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <QueryClientProvider client={queryClient}>
    <SuiClientProvider
      networks={suiNetworkConfig}
      defaultNetwork={STACKS_NETWORK === "testnet" ? "testnet" : "mainnet"}
    >
      <WalletProvider autoConnect={true}>
        <AppProvider>
          <BalancesProvider>
            <App />
          </BalancesProvider>
        </AppProvider>
      </WalletProvider>
    </SuiClientProvider>
  </QueryClientProvider>,
  // </StrictMode>,
);
