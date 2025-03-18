import { Inject, Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { broadcastTransaction, fetchFeeEstimate, StacksTransactionWire } from '@stacks/transactions';
import { ApiConfigService } from '@monorepo/common/config/api.config.service';
import { ProviderKeys } from '@monorepo/common/utils/provider.enum';
import { Transaction } from '@stacks/blockchain-api-client';

const API_TIMEOUT = 30_000; // 30 seconds

@Injectable()
export class StacksApiHelper {
  private readonly client: AxiosInstance;
  private readonly logger: Logger;

  private readonly sbtcToken: string;

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

    this.sbtcToken = `${apiConfigService.getStacksSbtcContractDeployer()}.sbtc-token::sbtc-token`;
  }

  async getNextNonce(address: string): Promise<number> {
    const response = await this.client.get(`/extended/v1/address/${address}/nonces`);
    const data = response.data;

    if (data.detected_missing_nonces.length > 0) {
      return data.detected_missing_nonces[data.detected_missing_nonces.length - 1];
    }

    return data.possible_next_nonce;
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

  async getTransaction(txHash: string): Promise<Transaction> {
    const response = await this.client.get(`/extended/v1/tx/${txHash}`);

    return response.data as Transaction;
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

  async sendTransactions(transactions: StacksTransactionWire[]) {
    if (!transactions.length) {
      return [];
    }

    const hashes: string[] = [];

    for (const tx of transactions) {
      try {
        const hash = await this.sendTransaction(tx);
        hashes.push(hash);
        this.logger.log(`Transaction ${tx.txid()} sent successfully`);
      } catch (e) {
        this.logger.error(`Transaction ${tx.txid()} could not be sent`, e);

        throw e;
      }
    }

    this.logger.log(`Sent ${hashes.length}/${transactions.length} transactions successfully`);

    return hashes;
  }

  async getAddressBalances(address: string) {
    try {
      const result = await this.client.get(`/extended/v1/address/${address}/balances`);

      return {
        stxBalance: BigInt(result.data?.stx?.balance || 0),
        sbtcBalance: BigInt(result.data?.fungible_tokens?.[this.sbtcToken]?.balance || 0),
      };
    } catch {
      return {
        stxBalance: 0n,
        sbtcBalance: 0n,
      };
    }
  }
}
