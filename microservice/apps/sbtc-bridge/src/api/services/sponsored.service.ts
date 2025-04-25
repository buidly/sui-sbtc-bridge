import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ProviderKeys } from '@monorepo/common/utils/provider.enum';
import {
  addressToString,
  AddressVersion,
  ContractCallPayload,
  cvToValue,
  deserializeTransaction,
  PayloadType,
  StacksWireType,
} from '@stacks/transactions';
import { SponsoredTransactionRepository } from '@monorepo/common/database/repository/sponsored-transaction.repository';
import { ApiConfigService } from '@monorepo/common/config/api.config.service';
import { CONSTANTS } from '@monorepo/common/utils/constants';
import { SponsoredTransactionStatus } from '@prisma/client';
import { StacksApiHelper } from '@monorepo/common/helpers/stacks.api.helper';

@Injectable()
export class SponsoredService {
  private readonly logger: Logger;

  constructor(
    @Inject(ProviderKeys.STACKS_NETWORK) private readonly network: 'testnet' | 'mainnet',
    private readonly stacksApi: StacksApiHelper,
    private readonly sponsoredTransactionRepository: SponsoredTransactionRepository,
    private readonly apiConfigService: ApiConfigService,
  ) {
    this.logger = new Logger(SponsoredService.name);
  }

  async saveSponsoredTransaction(rawTransaction: string) {
    const transaction = deserializeTransaction(rawTransaction);

    try {
      transaction.verifyOrigin();
    } catch (e) {
      throw new BadRequestException('Invalid signed transaction');
    }

    if (transaction.payload.payloadType !== PayloadType.ContractCall) {
      throw new BadRequestException('Invalid transaction');
    }

    const contractCall = transaction.payload as ContractCallPayload;

    // Make sure only contract calls to its for sBTC tokens are supported
    if (
      addressToString(contractCall.contractAddress) !== this.apiConfigService.getStacksAxelarContractDeployer() ||
      contractCall.contractName.content !== 'interchain-token-service' ||
      contractCall.functionName.content !== 'interchain-transfer'
    ) {
      throw new BadRequestException('Invalid transaction');
    }

    const args = contractCall.functionArgs;
    const tokenManager = cvToValue(args?.[3]);
    const tokenContract = cvToValue(args?.[4]);
    const itsTokenId = cvToValue(args?.[5]);
    const destinationChain = cvToValue(args?.[6]);
    const destinationAddress = cvToValue(args?.[7]);
    const amount = cvToValue(args?.[8]);
    const metadata = cvToValue(args?.[9]);
    const gasValue = cvToValue(args?.[10]);

    if (
      tokenManager !== this.apiConfigService.getStacksSbtcTokenManager() ||
      tokenContract !== `${this.apiConfigService.getStacksSbtcContractDeployer()}.sbtc-token` ||
      itsTokenId !== this.apiConfigService.getItsSbtcTokenId() ||
      destinationChain !== CONSTANTS.SUI_AXELAR_CHAIN ||
      metadata.data.value !== '0x' ||
      metadata.version.value !== '0' ||
      gasValue !== CONSTANTS.CROSS_CHAIN_STX_VALUE
    ) {
      throw new BadRequestException('Invalid transaction');
    }

    this.logger.debug(`Saving sponsored transaction for base transaction ${transaction.txid()}`);

    const stacksAddress = addressToString({
      version: this.network === 'testnet' ? AddressVersion.TestnetSingleSig : AddressVersion.MainnetSingleSig,
      hash160: transaction.auth.spendingCondition.signer,
      type: StacksWireType.Address,
    });

    const balances = await this.stacksApi.getAddressBalances(stacksAddress);

    if (balances.sbtcBalance < amount) {
      throw new BadRequestException('Invalid sBTC balance');
    }

    return await this.sponsoredTransactionRepository.create({
      stacksAddress,
      suiAddress: destinationAddress,
      sbtcAmount: String(amount),
      status:
        balances.stxBalance < gasValue
          ? SponsoredTransactionStatus.PENDING
          : SponsoredTransactionStatus.PENDING_SPONSORED,
      originalTransaction: Buffer.from(rawTransaction, 'hex'),
      retry: 0,
    });
  }

  async getSponsoredTransaction(id: string) {
    return await this.sponsoredTransactionRepository.get(id);
  }
}
