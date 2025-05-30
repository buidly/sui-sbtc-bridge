import naviPoolProvider from "@/services/NaviPools.ts";
import scallopPoolProvider from "@/services/ScallopPools.ts";
import suilendPoolProvider from "@/services/SuilendPools.ts";

export const btcCoinTypes = {
  WBTC: "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN",
  suiBTC: "0xaafb102dd0902f5055cadecd687fb5b71ca82ef0e0285d90afde828ec58ca96b::btc::BTC",
  LBTC: "0x3e8e9423d80e1774a7ca128fccd8bf5f1f7753be658c5e645929037f7c819040::lbtc::LBTC",
  LorenzoBTC: "0x5f496ed5d9d045c5b788dc1bb85f54100f2ede11e46f6a232c29daada4c5bdb6::coin::COIN",
};

const ICON_MAP: Record<string, string> = {
  WBTC: "wbtc",
  SUIBTC: "suibtc",
  LBTC: "lbtc",
  LORENZOBTC: "stbtc",
};

export function getBtcAssetIcon(assetName: string): string {
  if (!assetName) {
    return "";
  }

  const id = ICON_MAP[assetName.toUpperCase()];
  let extension = ".png";
  if (id === "wbtc") {
    extension = ".svg";
  }
  return `https://app.naviprotocol.io/imgs/token/${id}${extension}`;
}

export const AllLendingProviders = [suilendPoolProvider, naviPoolProvider, scallopPoolProvider];
