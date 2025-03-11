import { LendingPoolProvider } from "./BaseLendingProvider";
import { LendingProtocol } from "./LendingPools";
import { NaviPoolProvider } from "./Navi/NaviPools";

export class LendingPoolFactory {
  static createProvider(protocol: LendingProtocol): LendingPoolProvider {
    switch (protocol) {
      case LendingProtocol.NAVI:
        return new NaviPoolProvider();
      case LendingProtocol.SCALLOP:
        throw new Error("Scallop pools not implemented yet");
      case LendingProtocol.SUILEND:
        throw new Error("Suilend pools not implemented yet");
      default:
        throw new Error(`Unsupported protocol: ${protocol}`);
    }
  }
}
