import { SuiClient } from "@mysten/sui/client";
import { ENV } from "@/lib/env.ts";

export const client = new SuiClient({
  url: ENV.SUI_CLIENT_URL,
});

export const SuiApi = {
  async getAddressBalances(address: string) {
    try {
      // Get all coin objects owned by the address
      const { data: coins } = await client.getCoins({
        owner: address,
        coinType: "0x2::sui::SUI", // Specify SUI coin type
      });

      // Sum up the balances
      const totalSuiBalance = coins.reduce((total, coin) => {
        return total + BigInt(coin.balance);
      }, BigInt(0));

      // Get all coin objects owned by the address
      const { data: coinsSbtc } = await client.getCoins({
        owner: address,
        coinType: ENV.SUI_SBTC_COIN_TYPE,
      });

      // Sum up the balances
      const totalSbtcBalance = coinsSbtc.reduce((total, coin) => {
        return total + BigInt(coin.balance);
      }, BigInt(0));

      return {
        suiBalance: totalSuiBalance,
        sbtcBalance: totalSbtcBalance,
      };
    } catch (e) {
      console.error(e);

      return undefined;
    }
  },
};
