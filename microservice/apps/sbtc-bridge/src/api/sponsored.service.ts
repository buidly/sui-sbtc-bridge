import { Inject, Injectable, Logger } from '@nestjs/common';
import { ProviderKeys } from '@monorepo/common/utils/provider.enum';
import {
  addressToString,
  AddressVersion,
  getAddressFromPrivateKey,
  makeSTXTokenTransfer,
  sponsorTransaction,
  StacksTransactionWire,
  StacksWireType,
} from '@stacks/transactions';
import { StacksApiHelper } from '@monorepo/common/helpers/stacks.api.helper';

@Injectable()
export class SponsoredService {
  private readonly logger: Logger;

  private readonly walletSignerAddress: string;

  constructor(
    @Inject(ProviderKeys.STACKS_WALLET_SIGNER) private readonly walletSigner: string,
    @Inject(ProviderKeys.STACKS_NETWORK) private readonly network: 'testnet' | 'mainnet',
    private readonly stacksApi: StacksApiHelper,
  ) {
    this.walletSignerAddress = getAddressFromPrivateKey(walletSigner, network);

    this.logger = new Logger(SponsoredService.name);
  }

  // TODO: Move this to a queue or somewhere for the two transactions to be sent sequentially
  async sendSponsoredTransaction(transaction: StacksTransactionWire) {
    this.logger.debug(`Sending sponsored transaction for base transaction ${transaction.txid()}`);

    const nonce = await this.stacksApi.getNextNonce(this.walletSignerAddress);

    const originalSender = addressToString({
      version: this.network === 'testnet' ? AddressVersion.TestnetSingleSig : AddressVersion.MainnetSingleSig,
      hash160: transaction.auth.spendingCondition.signer,
      type: StacksWireType.Address,
    });

    const stxTransfer = await makeSTXTokenTransfer({
      recipient: originalSender,
      amount: 1_000_000, // Send 1 STX to the user, TODO: Update fee
      senderKey: this.walletSigner,
      nonce,
      network: this.network,
    });

    const stxTransferTransaction = await this.stacksApi.sendTransaction(stxTransfer);

    this.logger.debug(
      `Sending stxTransferTransaction to ${originalSender}, transaction hash ${stxTransferTransaction}`,
    );

    const fee = await this.stacksApi.getTransactionFee(transaction);

    const sponsoredTx = await sponsorTransaction({
      transaction,
      sponsorPrivateKey: this.walletSigner,
      sponsorNonce: nonce + 1,
      fee,
      network: this.network,
    });

    this.logger.debug(`Sending sponsored transaction ${sponsoredTx.txid()}`);

    return await this.stacksApi.sendTransaction(sponsoredTx);
  }
}
