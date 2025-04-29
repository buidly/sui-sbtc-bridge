import { LendingPoolProvider } from "./BaseLendingProvider.ts";
import { btcCoinTypes } from "./config.ts";
import { AddressLendingInfo, LendingProtocol } from "@/services/types.ts";
import { getAddressPortfolio } from "navi-sdk/src/libs/CallFunctions";
import { pool } from "navi-sdk/src/address.ts";
import { suiClientMainnet } from '@/api/sui.ts';

class NaviPoolProvider extends LendingPoolProvider {
  constructor() {
    super(LendingProtocol.NAVI);
  }

  async getAddressInfo(address: string): Promise<AddressLendingInfo[]> {
    const result = await getAddressPortfolio(address, false, suiClientMainnet, false, [
      "WBTC",
      "LorenzoBTC",
      "suiBTC",
      "LBTC",
    ]);

    const addressInfo: AddressLendingInfo[] = [];

    for (const [key, value] of result.entries()) {
      const poolItem = pool[key];

      const nameEntry = Object.entries(btcCoinTypes).find(([_, type]) => poolItem.type === type);
      const name = nameEntry?.[0];

      addressInfo.push({
        name,
        coinType: poolItem.type,
        supplyBalance: BigInt(Math.round(value.supplyBalance)),
        underlyingBalance: BigInt(Math.round(value.supplyBalance)),
        protocol: LendingProtocol.NAVI,
      });
    }

    return addressInfo;
  }
}

const naviPoolProvider = new NaviPoolProvider();

export default naviPoolProvider;
