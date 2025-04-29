import { AddressLendingInfo, LendingProtocol } from "@/services/types.ts";

export abstract class LendingPoolProvider {
  constructor(readonly protocol: LendingProtocol) {}

  abstract getAddressInfo(address: string): Promise<AddressLendingInfo[]>;
}
