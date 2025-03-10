export const formatTrimmed = (address: string, size: number = 10) => {
  if (!address) {
    return '';
  }

  return address.slice(0, size) + "..." + address.slice(-size);
};

export const getExplorerUrlAddress = (type: "BITCOIN" | "STACKS" | "SUI", address: string) => {
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

export const getExplorerUrlTransaction = (type: "BITCOIN" | "STACKS" | "SUI", transaction: string) => {
  // TODO: Add support for mainnet
  switch (type) {
    case "BITCOIN":
      return `https://beta.sbtc-mempool.tech/api/proxy/tx/${transaction}`;
    case "STACKS":
      return `https://explorer.hiro.so/txid/${transaction}?chain=testnet`;
    case "SUI":
      return `https://testnet.suivision.xyz/tx/${transaction}`;
  }
};

export const formatBalance = (balance: bigint, decimals: number) => {
  if (!balance) {
    return '0';
  }

  // Convert the bigint to a string
  const balanceString = balance.toString();

  // If the balance is 0, return "0"
  if (balanceString === "0") {
    return "0";
  }

  // If the balance string length is less than or equal to the number of decimals,
  // we need to pad it with leading zeros
  const paddedBalance = balanceString.padStart(decimals + 1, "0");

  // Insert the decimal point at the right position
  const integerPart = paddedBalance.slice(0, paddedBalance.length - decimals) || "0";
  const fractionalPart = paddedBalance.slice(paddedBalance.length - decimals);

  // Remove trailing zeros from the fractional part
  const trimmedFractionalPart = fractionalPart.replace(/0+$/, "");

  // Construct the formatted balance
  if (trimmedFractionalPart.length > 0) {
    return `${integerPart}.${trimmedFractionalPart}`;
  } else {
    return integerPart;
  }
};
