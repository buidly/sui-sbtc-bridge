import { LendingProtocol } from "./config.ts";
import { AddressLendingInfo, LendingPool } from "@/services/types.ts";

export abstract class LendingPoolProvider {
  protected pools: LendingPool[];

  constructor(readonly protocol: LendingProtocol) {}

  abstract getPools(): Promise<LendingPool[]>;

  abstract getAddressInfo(address: string): Promise<AddressLendingInfo[]>; // TODO: Add return type

  async getPool(id: string): Promise<LendingPool | undefined> {
    const pools = this.pools || await this.getPools();
    return pools.find((pool) => pool.coinType === id);
  }
}
