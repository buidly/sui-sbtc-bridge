import { Injectable } from '@nestjs/common';
import { SuiApiHelper } from '@monorepo/common/helpers/sui.api.helper';
import { InMemoryCacheService } from '@monorepo/common/utils/in-memory-cache';
import { CacheInfo } from '@monorepo/common/utils/cache.info';
import { ApiConfigService } from '@monorepo/common/config/api.config.service';

@Injectable()
export class GeneralService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly suiApiHelper: SuiApiHelper,
    private readonly cache: InMemoryCacheService,
  ) {}

  async getSuiBtcCoins() {
    let result = this.cache.get(CacheInfo.SuiBtcCoins().key);

    if (!result) {
      const object = await this.suiApiHelper.getObject(this.apiConfigService.getStableSwapPoolObject());

      if (!object) {
        return {};
      }

      result = await this.suiApiHelper.getCoinsMetadata(object?.types);

      this.cache.set(CacheInfo.SuiBtcCoins().key, result, CacheInfo.SuiBtcCoins().ttl);
    }

    return result;
  }
}
