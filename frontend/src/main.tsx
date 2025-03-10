import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { createNetworkConfig, SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@/context/app.context";

import "@mysten/dapp-kit/dist/index.css";

// Sui
const { networkConfig: suiNetworkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
});
const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  // <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/*TODO: Change Sui network when going to mainnet*/}
      <SuiClientProvider networks={suiNetworkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect={true}>
          <AppProvider>
            <App />
          </AppProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  // </StrictMode>,
);
