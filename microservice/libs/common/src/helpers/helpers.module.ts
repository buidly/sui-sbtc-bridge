import { Module } from '@nestjs/common';
import { StacksApiHelper } from '@monorepo/common/helpers/stacks.api.helper';
import { ApiConfigModule } from '@monorepo/common/config/api.config.module';
import { ProviderKeys } from '@monorepo/common/utils/provider.enum';
import { ApiConfigService } from '@monorepo/common/config/api.config.service';

@Module({
  imports: [ApiConfigModule],
  providers: [
    StacksApiHelper,
    {
      provide: ProviderKeys.STACKS_NETWORK,
      useFactory: (apiConfigService: ApiConfigService) => {
        return apiConfigService.getStacksApi().includes('testnet') ? 'testnet' : 'mainnet';
      },
      inject: [ApiConfigService],
    },
    {
      provide: ProviderKeys.STACKS_WALLET_SIGNER,
      useFactory: (apiConfigService: ApiConfigService) => {
        return apiConfigService.getStacksWalletPrivateKey();
      },
      inject: [ApiConfigService],
    },
  ],
  exports: [StacksApiHelper, ProviderKeys.STACKS_NETWORK, ProviderKeys.STACKS_WALLET_SIGNER],
})
export class HelpersModule {}
