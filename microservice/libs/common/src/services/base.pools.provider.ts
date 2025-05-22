import { LendingPool, LendingProtocol } from '@monorepo/common/services/types';

export abstract class BasePoolsProvider {
  constructor(public readonly protocol: LendingProtocol) {}

  abstract getPools(): Promise<LendingPool[]>;
}
