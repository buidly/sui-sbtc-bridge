import { LendingPool, LendingPools, LendingProtocol } from "./LendingPools";

export abstract class LendingPoolProvider implements LendingPools {
  pools: LendingPool[] = [];
  protected protocol: LendingProtocol;

  constructor(protocol: LendingProtocol) {
    this.protocol = protocol;
  }

  abstract fetchAllPools(): Promise<void>;
  abstract getPool(id: string): LendingPool | undefined;
}
