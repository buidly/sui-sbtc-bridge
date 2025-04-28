import { STACKS_NETWORK } from "@/api/stacks.ts";
import { scrypt } from "scrypt-js";
import * as bip39 from "bip39";
import { generateWallet } from "@stacks/wallet-sdk";
import { privateKeyToAddress } from "@stacks/transactions";

export const formatTrimmed = (address: string, size: number = 10) => {
  if (!address) {
    return "";
  }

  if (address.length <= size) {
    return address;
  }

  return address.slice(0, size) + "..." + address.slice(-size);
};

export const getExplorerUrlAddress = (type: "BITCOIN" | "STACKS" | "SUI", address: string) => {
  if (STACKS_NETWORK === "testnet") {
    switch (type) {
      case "BITCOIN":
        return `https://beta.sbtc-mempool.tech/api/proxy/address/${address}`;
      case "STACKS":
        return `https://explorer.hiro.so/address/${address}?chain=testnet`;
      case "SUI":
        return `https://testnet.suivision.xyz/address/${address}`;
    }
  }

  switch (type) {
    case "BITCOIN":
      return `https://blockstream.info/address/${address}`;
    case "STACKS":
      return `https://explorer.hiro.so/address/${address}`;
    case "SUI":
      return `https://suivision.xyz/address/${address}`;
  }
};

export const getExplorerUrlTransaction = (type: "BITCOIN" | "STACKS" | "SUI", transaction: string) => {
  if (STACKS_NETWORK === "testnet") {
    switch (type) {
      case "BITCOIN":
        return `https://beta.sbtc-mempool.tech/api/proxy/tx/${transaction}`;
      case "STACKS":
        return `https://explorer.hiro.so/txid/${transaction}?chain=testnet`;
      case "SUI":
        return `https://testnet.suivision.xyz/tx/${transaction}`;
    }
  }

  switch (type) {
    case "BITCOIN":
      return `https://blockstream.info/tx/${transaction}`;
    case "STACKS":
      return `https://explorer.hiro.so/txid/${transaction}`;
    case "SUI":
      return `https://suivision.xyz/tx/${transaction}`;
  }
};

export const formatBalance = (balance: bigint, decimals: number) => {
  if (!balance) {
    return "0";
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

export async function createDeterministicStacksWallet(knownString: string, password: string) {
  // 1. Derive 256-bit entropy using scrypt
  const salt = Buffer.from(knownString, "utf-8");
  const entropy = await scrypt(
    Buffer.from(password, "utf-8"),
    salt,
    16384,
    8,
    1,
    32, // N, r, p, dkLen
  );

  // 2. Generate BIP39 mnemonic from entropy
  const mnemonic = bip39.entropyToMnemonic(Buffer.from(entropy));

  // 3. Create Stacks wallet with derived seed
  const wallet = await generateWallet({
    secretKey: mnemonic,
    password: password,
  });

  const privateKey = wallet.accounts[0].stxPrivateKey;

  return {
    mnemonic: mnemonic,
    privateKey,
    stacksAddress: privateKeyToAddress(privateKey, STACKS_NETWORK),
  };
}

export function toDenominatedAmount(inputAmount: string | number, decimals: number): bigint {
  return Math.round(parseFloat(inputAmount.toString()) * 10 ** decimals);
}

export function toDecimalAmount(inputAmount: bigint | number, decimals: number): number {
  return Number(inputAmount) / 10 ** decimals;
}
