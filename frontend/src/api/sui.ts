import { CoinMetadata, SuiClient } from "@mysten/sui/client";
import { ENV } from "@/lib/env.ts";

export interface StableSwapPool {
  admin_fee: string;
  amp: bigint;
  fee: string;
  lp_supply: string;
  types: string[];
  values: bigint[];
}

export const SUI_NETWORK = ENV.SUI_CLIENT_URL.includes("testnet") ? "testnet" : "mainnet";

export const suiClient = new SuiClient({
  url: ENV.SUI_CLIENT_URL,
});

export const SuiApi = {
  async getAddressSuiSbtcBalances(address: string) {
    try {
      // Get all coin objects owned by the address
      const { data: coins } = await suiClient.getCoins({
        owner: address,
        coinType: "0x2::sui::SUI", // Specify SUI coin type
        limit: 50,
      });

      // Sum up the balances
      const totalSuiBalance = coins.reduce((total, coin) => {
        return total + BigInt(coin.balance);
      }, BigInt(0));

      // Get all coin objects owned by the address
      const { data: coinsSbtc } = await suiClient.getCoins({
        owner: address,
        coinType: ENV.SUI_SBTC_COIN_TYPE,
        limit: 50,
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

  async getAddressCoinsBalances(address: string, coinTypes: string[]) {
    try {
      const result = await Promise.all(
        coinTypes.map(async (coinType) => {
          // Get all coin objects owned by the address
          const { data: coinsSbtc } = await suiClient.getCoins({
            owner: address,
            coinType,
            limit: 50,
          });

          // Sum up the balances
          return coinsSbtc.reduce((total, coin) => {
            return total + BigInt(coin.balance);
          }, BigInt(0));
        }),
      );

      return result.reduce<{ [coinType: string]: bigint }>((acc, balance, index) => {
        acc[coinTypes[index]] = balance;

        return acc;
      }, {});
    } catch (e) {
      console.error(e);

      return undefined;
    }
  },

  async getObject(objectId: string): Promise<StableSwapPool | undefined> {
    try {
      const result = await suiClient.getObject({
        id: objectId,
        options: {
          showContent: true,
        },
      });

      const data = (result?.data?.content as any)?.fields as StableSwapPool;

      // Do type conversions
      if (data?.types) {
        data.types = data.types.map((type) => `0x${type}`);
      }
      if (data?.values) {
        data.values = data.values.map((value) => BigInt(value));
      }
      data.amp = BigInt(data.amp);

      return data;
    } catch (e) {
      console.error(e);

      return undefined;
    }
  },

  // TODO: Move usages of this function in backend
  async getCoinsMetadata(coinTypes: string[]) {
    try {
      const result = await Promise.all(
        coinTypes.map((coinType) =>
          suiClient.getCoinMetadata({
            coinType,
          }),
        ),
      );

      return result.reduce<{ [coinType: string]: CoinMetadata }>((acc, metadata, index) => {
        if (metadata) {
          acc[coinTypes[index]] = metadata;
        }

        return acc;
      }, {});
    } catch (e) {
      console.error(e);

      return {};
    }
  },
};
