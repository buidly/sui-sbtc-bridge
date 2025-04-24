import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiConfigService {
  constructor(private readonly configService: ConfigService) {}

  getStacksApi(): string {
    const stacksApi = this.configService.get<string>('STACKS_API');
    if (!stacksApi) {
      throw new Error('No Stacks API present');
    }

    return stacksApi;
  }

  getStacksSbtcContractDeployer(): string {
    const value = this.configService.get<string>('STACKS_SBTC_CONTRACT_DEPLOYER');
    if (!value) {
      throw new Error('No Stacks sBTC Contract Deployer present');
    }

    return value;
  }

  getStacksSbtcTokenManager(): string {
    const value = this.configService.get<string>('STACKS_SBTC_TOKEN_MANAGER');
    if (!value) {
      throw new Error('No Stacks sBTC Token Manager present');
    }

    return value;
  }

  getStacksAxelarContractDeployer(): string {
    const value = this.configService.get<string>('STACKS_AXELAR_CONTRACT_DEPLOYER');
    if (!value) {
      throw new Error('No Stacks Axelar Contract Deployer present');
    }

    return value;
  }

  getItsSbtcTokenId(): string {
    const value = this.configService.get<string>('ITS_SBTC_TOKEN_ID');
    if (!value) {
      throw new Error('No ITS sBTC Token Id present');
    }

    return value;
  }

  getStacksWalletPrivateKey(): string {
    const privateKey = this.configService.get<string>('STACKS_WALLET_PRIVATE_KEY');
    if (!privateKey) {
      throw new Error('No Stacks Wallet Private Key present');
    }

    return privateKey;
  }
}
