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
}
