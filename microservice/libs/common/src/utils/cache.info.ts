import { Constants } from './constants';

export class CacheInfo {
  key: string = '';
  ttl: number = Constants.oneSecond() * 6;

  static SuiBtcCoins(): CacheInfo {
    return {
      key: 'suiBtcCoins',
      ttl: Constants.oneDay(),
    };
  }

  static LendingBtcPools(protocol: string): CacheInfo {
    return {
      key: `lendingBtcPools:${protocol}`,
      ttl: Constants.oneMinute() * 10,
    };
  }

  static CoinMetadata(coinType: string): CacheInfo {
    return {
      key: `coinMetadata:${coinType}`,
      ttl: Constants.oneDay(),
    };
  }
}
