import { SuiClient } from "@mysten/sui/client";

const SBTC_TOKEN = "0xdaa725387e5f08fe8a7c936b0b448f8f9c13ac9b41fe3ee159e9cc25e0ef5f63::axlusdc::AXLUSDC"; // TODO: This is not correct token, update after it is available

export const client = new SuiClient({
  url: "https://fullnode.mainnet.sui.io", // TODO: Update for mainnet
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
        coinType: SBTC_TOKEN,
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
