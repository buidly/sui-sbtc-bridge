export const formatAddress = (address: string, size: number = 10) => {
  return address.slice(0, size) + "..." + address.slice(-size);
};

export const getExplorerUrl = (type: "BITCOIN" | "STACKS" | "SUI", address: string) => {
  // TODO: Add support for mainnet
  switch (type) {
    case "BITCOIN":
      return `https://beta.sbtc-mempool.tech/api/proxy/address/${address}`;
    case "STACKS":
      return `https://explorer.hiro.so/address/${address}?chain=testnet`;
    case "SUI":
      return `https://testnet.suivision.xyz/address/${address}`;
  }
};
