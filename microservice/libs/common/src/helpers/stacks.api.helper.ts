import { Inject, Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { broadcastTransaction, fetchFeeEstimate, StacksTransactionWire } from '@stacks/transactions';
import { ApiConfigService } from '@monorepo/common/config/api.config.service';
import { ProviderKeys } from '@monorepo/common/utils/provider.enum';

const API_TIMEOUT = 30_000; // 30 seconds

@Injectable()
export class StacksApiHelper {
  private readonly logger: Logger;
  private readonly client: AxiosInstance;

  constructor(
    apiConfigService: ApiConfigService,
    @Inject(ProviderKeys.STACKS_NETWORK) private readonly network: 'testnet' | 'mainnet',
  ) {
    this.client = axios.create({
      baseURL: apiConfigService.getStacksApi(),
      timeout: API_TIMEOUT,
      headers: {
        Accept: 'application/json',
      },
    });

    this.logger = new Logger(StacksApiHelper.name);
  }

  async getNextNonce(address: string): Promise<number> {
    const response = await this.client.get(`/extended/v1/address/${address}/nonces`);
    const data = response.data;

    if (data.detected_missing_nonces.length > 0) {
      return data.detected_missing_nonces[data.detected_missing_nonces.length - 1];
    }

    return data.possible_next_nonce;
  }

  async sendTransaction(transaction: StacksTransactionWire): Promise<string> {
    try {
      const broadcastResponse = await broadcastTransaction({
        transaction,
        network: this.network,
      });
      if (!broadcastResponse.txid) {
        throw new Error(`Could not broadcast tx ${JSON.stringify(broadcastResponse)}`);
      }
      return broadcastResponse.txid;
    } catch (e) {
      this.logger.error('Could not send transaction', e);

      throw e;
    }
  }

  async getTransactionFee(transaction: StacksTransactionWire): Promise<bigint> {
    const result = await fetchFeeEstimate({
      transaction,
      network: this.network,
    });

    if (!result) {
      throw new Error(`Could not get fee for transaction ${transaction.txid()} ${JSON.stringify(result)}`);
    }

    return BigInt(result);
  }
}
