export const CONSTANTS = {
  // SUI_AXELAR_CHAIN: 'sui-2',
  SUI_AXELAR_CHAIN: 'avalanche-fuji', // TODO: Temporary send to Fuji until sui-2 token deployment is working

  CROSS_CHAIN_STX_VALUE: 1_000_000n, // TODO: Update cross chain fee
};

export class Constants {
  static oneSecond(): number {
    return 1;
  }

  static oneMinute(): number {
    return Constants.oneSecond() * 60;
  }

  static oneHour(): number {
    return Constants.oneMinute() * 60;
  }

  static oneDay(): number {
    return Constants.oneHour() * 24;
  }

  static oneWeek(): number {
    return Constants.oneDay() * 7;
  }

  static oneMonth(): number {
    return Constants.oneDay() * 30;
  }
}
