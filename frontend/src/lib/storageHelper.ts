const BTC_WALLET_KEY = "btc-wallet";
const STACKS_WALLET_KEY = "stacks-wallet";

export const storageHelper = {
  setBtcWallet(type: 'LEATHER' | 'OTHER') {
    const expirationTime = 24 * 60 * 60 * 1000; // 1 day

    localStorage.setItem(
      BTC_WALLET_KEY,
      JSON.stringify({
        type,
        timestamp: Date.now(),
        expirationTime,
      }),
    );
  },
  getBtcWallet(): { type: 'LEATHER' | 'OTHER' } | undefined {
    const storedData = localStorage.getItem(BTC_WALLET_KEY);
    if (!storedData) {
      return undefined;
    }

    const { timestamp, expirationTime, ...rest } = JSON.parse(storedData);
    if (Date.now() > timestamp + expirationTime) {
      localStorage.removeItem(BTC_WALLET_KEY);

      return undefined;
    }

    return rest;
  },
  removeBtcWallet() {
    localStorage.removeItem(BTC_WALLET_KEY);
  },

  setStacksWallet(type: 'GENERATED' | 'USER', address: string, privateKey?: string) {
    let expirationTime = 24 * 60 * 60 * 1000; // 1 day

    localStorage.setItem(
      STACKS_WALLET_KEY,
      JSON.stringify({
        type,
        address,
        privateKey,
        timestamp: Date.now(),
        expirationTime,
      }),
    );
  },
  getStacksWallet(): { type: 'GENERATED' | 'USER'; address: string; privateKey?: string } | undefined {
    const storedData = localStorage.getItem(STACKS_WALLET_KEY);
    if (!storedData) {
      return undefined;
    }

    const { timestamp, expirationTime, ...rest } = JSON.parse(storedData);
    // Generated wallet does not expire
    if (rest?.type !== 'GENERATED' || Date.now() > timestamp + expirationTime) {
      localStorage.removeItem(STACKS_WALLET_KEY);

      return undefined;
    }

    return rest;
  },
  removeStacksWallet() {
    localStorage.removeItem(STACKS_WALLET_KEY);
  }
};
