import axios from "axios";
import { ENV } from "@/lib/env.ts";

const client = axios.create({
  baseURL: ENV.MICROSERVICE_URL,
  timeout: 30_000,
});

export const MicroserviceApi = {
  async sendSponsoredTransaction(rawTransaction: string): Promise<string | null> {
    try {
      const result = await client.post(`/sponsored-transactions/send`, {
        rawTransaction
      });

      return result.data?.txHash;
    } catch (e) {
      return null;
    }
  },
};
