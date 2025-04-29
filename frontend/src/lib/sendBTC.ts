import { request } from "sats-connect";

export type Payload = {
  recipient: string;
  amountInSats: bigint;
  network?: "sbtcTestnet" | "mainnet";
};

export async function sendBTCLeather({ amountInSats, recipient, network }: Payload) {
  // @ts-ignore
  const response = await window.LeatherProvider.request("sendTransfer", {
    recipients: [
      {
        address: recipient,
        amount: String(amountInSats),
      },
    ],
    network,
  });

  return response.result.txid;
}

export async function sendBTCOther({ amountInSats, recipient }: Payload) {
  const response = await request("sendTransfer", {
    recipients: [
      {
        address: recipient,
        amount: Number(amountInSats),
      },
    ],
  });

  if (response.status === "error") {
    throw new Error(response.error.message);
  }

  return response.result.txid;
}
