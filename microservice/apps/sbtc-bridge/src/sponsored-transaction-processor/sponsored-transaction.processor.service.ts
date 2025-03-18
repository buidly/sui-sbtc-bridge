import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { StacksNetwork } from '@stacks/network';
import {
  deserializeTransaction,
  getAddressFromPrivateKey,
  makeSTXTokenTransfer,
  sponsorTransaction,
  StacksTransactionWire,
} from '@stacks/transactions';
import { SponsoredTransactionRepository } from '@monorepo/common/database/repository/sponsored-transaction.repository';
import { ProviderKeys } from '@monorepo/common/utils/provider.enum';
import { Locker } from '@monorepo/common/utils/locker';
import { SponsoredTransaction, SponsoredTransactionStatus } from '@prisma/client';
import { StacksApiHelper } from '@monorepo/common/helpers/stacks.api.helper';
import { CONSTANTS } from '@monorepo/common/utils/constants';

const MAX_NUMBER_OF_RETRIES: number = 3;

@Injectable()
export class SponsoredTransactionProcessorService {
  private readonly logger: Logger;

  private readonly walletSignerAddress: string;

  constructor(
    private readonly sponsoredTransactionRepository: SponsoredTransactionRepository,
    @Inject(ProviderKeys.STACKS_WALLET_SIGNER) private readonly walletSigner: string,
    @Inject(ProviderKeys.STACKS_NETWORK) private readonly network: StacksNetwork,
    private readonly stacksApi: StacksApiHelper,
  ) {
    this.walletSignerAddress = getAddressFromPrivateKey(walletSigner, network);

    this.logger = new Logger(SponsoredTransactionProcessorService.name);
  }

  @Cron('0/10 * * * * *')
  async processPendingSponsoredTransactions() {
    await Locker.lock('processPendingSponsoredTransactions', async () => {
      this.logger.debug('Running processPendingSponsoredTransactions cron');

      // Always start processing from beginning (page 0) since the query will skip recently updated entries
      let entries;
      while ((entries = await this.sponsoredTransactionRepository.findPending(0))?.length) {
        let nonce = await this.stacksApi.getNextNonce(this.walletSignerAddress);

        this.logger.log(`Found ${entries.length} SponsoredTransaction to execute`);

        const transactionsToSend: StacksTransactionWire[] = [];
        const entriesToUpdate: SponsoredTransaction[] = [];
        for (const sponsoredTransaction of entries) {
          if (sponsoredTransaction.retry === MAX_NUMBER_OF_RETRIES) {
            this.handleSponsoredTransactionFailed(sponsoredTransaction);

            entriesToUpdate.push(sponsoredTransaction);

            continue;
          }

          this.logger.debug(
            `Trying to handle SponsoredTransaction ${sponsoredTransaction.id} from ${sponsoredTransaction.stacksAddress} to ${sponsoredTransaction.suiAddress}`,
          );

          try {
            const { transaction, incrementRetry } = await this.buildTransaction(sponsoredTransaction, nonce);

            if (incrementRetry) {
              sponsoredTransaction.retry += 1;
            }

            entriesToUpdate.push(sponsoredTransaction);

            if (!transaction) {
              continue;
            }

            nonce++;

            transactionsToSend.push(transaction);
          } catch (e) {
            this.logger.error(`Could not build and sign transaction for ${sponsoredTransaction.id}`, e);

            throw e;
          }
        }

        await this.stacksApi.sendTransactions(transactionsToSend);

        if (entriesToUpdate.length) {
          await this.sponsoredTransactionRepository.updateManyPartial(entriesToUpdate);
        }
      }
    });
  }

  private async buildTransaction(
    sponsoredTransaction: SponsoredTransaction,
    nonce: number,
  ): Promise<{
    transaction: StacksTransactionWire | null;
    incrementRetry: boolean;
  }> {
    // 1st send STX transaction
    // Transaction can be skipped if user balance is enough to pay for cross chain fee
    if (
      (sponsoredTransaction.status === SponsoredTransactionStatus.PENDING ||
        sponsoredTransaction.status === SponsoredTransactionStatus.PENDING_STX) &&
      !sponsoredTransaction.stxTransactionHash
    ) {
      this.logger.debug(
        `Sending STX to ${sponsoredTransaction.stacksAddress} for sponsored transaction ${sponsoredTransaction.id}`,
      );

      const stxTransfer = await makeSTXTokenTransfer({
        recipient: sponsoredTransaction.stacksAddress,
        amount: CONSTANTS.CROSS_CHAIN_STX_VALUE, // Send 1 STX to the user
        senderKey: this.walletSigner,
        nonce,
        network: this.network,
      });

      sponsoredTransaction.status = SponsoredTransactionStatus.PENDING_STX;
      sponsoredTransaction.stxTransactionHash = stxTransfer.txid();

      return {
        transaction: stxTransfer,
        incrementRetry: false,
      };
    }

    // 2nd check if STX transaction is successful
    if (
      sponsoredTransaction.status === SponsoredTransactionStatus.PENDING_STX &&
      sponsoredTransaction.stxTransactionHash
    ) {
      const status = await this.getTransactionStatus(sponsoredTransaction.stxTransactionHash);

      if (status !== 'success') {
        const isFailed = status === 'failed';

        if (isFailed) {
          // In case of error, retry transaction
          sponsoredTransaction.stxTransactionHash = null;
        }

        return {
          transaction: null,
          incrementRetry: isFailed,
        };
      }

      // Move on to next step
    }

    // 3rd step send sponsored transaction
    if (!sponsoredTransaction.sponsoredTransactionHash) {
      this.logger.debug(`Sending sponsored transaction ${sponsoredTransaction.id} for ${sponsoredTransaction.id}`);

      const originalTransaction = deserializeTransaction(sponsoredTransaction.originalTransaction);

      const fee = await this.stacksApi.getTransactionFee(originalTransaction);

      const transaction = await sponsorTransaction({
        transaction: originalTransaction,
        sponsorPrivateKey: this.walletSigner,
        sponsorNonce: nonce,
        fee,
        network: this.network,
      });

      sponsoredTransaction.status = SponsoredTransactionStatus.PENDING_SPONSORED;
      sponsoredTransaction.sponsoredTransactionHash = transaction.txid();

      return {
        transaction,
        incrementRetry: false,
      };
    }

    // 4th step check sponsored transaction
    if (
      sponsoredTransaction.status === SponsoredTransactionStatus.PENDING_SPONSORED &&
      sponsoredTransaction.sponsoredTransactionHash
    ) {
      const status = await this.getTransactionStatus(sponsoredTransaction.sponsoredTransactionHash);

      if (status !== 'success') {
        const isFailed = status === 'failed';

        if (isFailed) {
          // In case of error, retry transaction
          sponsoredTransaction.sponsoredTransactionHash = null;
        }

        return {
          transaction: null,
          incrementRetry: isFailed,
        };
      }

      this.logger.debug(
        `Successfully sent seponsored transaction ${sponsoredTransaction.id} for ${sponsoredTransaction.stacksAddress}`,
      );

      sponsoredTransaction.status = SponsoredTransactionStatus.SUCCESS;
    }

    return {
      transaction: null,
      incrementRetry: false,
    };
  }

  private async getTransactionStatus(txHash: string): Promise<'pending' | 'success' | 'failed'> {
    const transaction = await this.stacksApi.getTransaction(txHash);

    // @ts-ignore
    if (transaction.tx_status === 'pending') {
      return 'pending';
    }

    if (transaction.tx_status === 'success') {
      return 'success';
    }

    return 'failed';
  }

  private handleSponsoredTransactionFailed(sponsoredTransaction: SponsoredTransaction) {
    this.logger.error(
      `Could not execute SponsoredTransaction ${sponsoredTransaction.id} from ${sponsoredTransaction.stacksAddress} to ${sponsoredTransaction.suiAddress}`,
    );

    sponsoredTransaction.status = SponsoredTransactionStatus.FAILED;
  }
}
