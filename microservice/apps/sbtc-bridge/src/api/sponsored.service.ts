import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ProviderKeys } from '@monorepo/common/utils/provider.enum';
import {
  addressToString,
  AddressVersion,
  deserializeTransaction,
  getAddressFromPrivateKey,
  makeSTXTokenTransfer,
  sponsorTransaction,
  StacksTransactionWire,
  StacksWireType,
} from '@stacks/transactions';
import { StacksApiHelper } from '@monorepo/common/helpers/stacks.api.helper';
import { SponsoredTransactionRepository } from '@monorepo/common/database/repository/sponsored-transaction.repository';
import { SponsoredTransactionStatus } from '@prisma/client';

@Injectable()
export class SponsoredService {
  private readonly logger: Logger;

  private readonly walletSignerAddress: string;

  constructor(
    @Inject(ProviderKeys.STACKS_WALLET_SIGNER) private readonly walletSigner: string,
    @Inject(ProviderKeys.STACKS_NETWORK) private readonly network: 'testnet' | 'mainnet',
    private readonly stacksApi: StacksApiHelper,
    private readonly sponsoredTransactionRepository: SponsoredTransactionRepository,
  ) {
    this.walletSignerAddress = getAddressFromPrivateKey(walletSigner, network);

    this.logger = new Logger(SponsoredService.name);
  }

  // TODO: Get transaction and test that we support it (sender has 0 STX, is for ITS only for sBTC towards Sui etc)
  async saveSponsoredTransaction(rawTransaction: string) {
    const transaction = deserializeTransaction(rawTransaction);

    try {
      transaction.verifyOrigin();
    } catch (e) {
      throw new BadRequestException('Invalid signed transaction');
    }

    this.logger.debug(`Saving sponsored transaction for base transaction ${transaction.txid()}`);

    const stacksAddress = addressToString({
      version: this.network === 'testnet' ? AddressVersion.TestnetSingleSig : AddressVersion.MainnetSingleSig,
      hash160: transaction.auth.spendingCondition.signer,
      type: StacksWireType.Address,
    });

    // TODO: Parse transaction to get all details
    // TODO: Check if wallet has required STX amount, if yes then don't send STX fund transaction etc
    const sponsoredTransactionId = await this.sponsoredTransactionRepository.create({
      stacksAddress,
      suiAddress: 'TBD',
      sbtcAmount: '1000',
      status: SponsoredTransactionStatus.PENDING,
      originalTransaction: Buffer.from(rawTransaction, 'hex'),
      retry: 0,
    });

    return sponsoredTransactionId;
  }

  async getSponsoredTransaction(id: string) {
    return await this.sponsoredTransactionRepository.get(id);
  }
}
