import { AddressLendingInfo, LendingPool, LendingProtocol } from "@/services/types.ts";

export abstract class LendingPoolProvider {
  protected pools: LendingPool[];

  constructor(readonly protocol: LendingProtocol) {}

  abstract getPools(): Promise<LendingPool[]>;

  abstract getAddressInfo(address: string): Promise<AddressLendingInfo[]>;
}
