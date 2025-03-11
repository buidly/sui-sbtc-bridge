import { LendingPool, LendingProtocol } from "./LendingPools";

export abstract class LendingPoolProvider {
  constructor(readonly protocol: LendingProtocol) {}

  abstract getPools(): Promise<LendingPool[]>;
  abstract getPool(id: string): Promise<LendingPool | undefined>;
}
