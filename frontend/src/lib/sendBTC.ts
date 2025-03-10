import { request } from "sats-connect";

type Payload = {
  recipient: string;
  amountInSats: number;
  network?: "sbtcTestnet"; // TODO:
};

export async function sendBTCLeather({ amountInSats, recipient, network }: Payload) {
  const response = await window.LeatherProvider.request("sendTransfer", {
    recipients: [
      {
        address: recipient,
        amount: String(amountInSats),
      },
    ],
    network,
  });

  return response.txid.replace(/"|'/g, "");
}

export async function sendBTCOther({ amountInSats, recipient }: Payload) {
  const response = await request("sendTransfer", {
    recipients: [
      {
        address: recipient,
        amount: amountInSats,
      },
    ],
  });

  if (response.status === "error") {
    throw new Error(response.error.message);
  }

  return result.txid;
}
