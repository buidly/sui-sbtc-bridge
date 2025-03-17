import { Module } from '@nestjs/common';
import { ApiConfigModule } from '@monorepo/common/config/api.config.module';
import { ApiConfigService } from '@monorepo/common/config/api.config.service';
import { ProviderKeys } from '@monorepo/common/utils/provider.enum';

@Module({
  imports: [ApiConfigModule],
  providers: [
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
})
export class TransactionsHelperModule {}
