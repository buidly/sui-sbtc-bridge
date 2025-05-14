import { Loader2 } from "lucide-react";
import { ROUTES } from "@/lib/routes.ts";
import { useApp } from "@/context/app.context.tsx";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "./ui/navigation-menu";
import { ConnectModal, useAutoConnectWallet, useDisconnectWallet } from "@mysten/dapp-kit";
import { Button } from "./ui/button";
import { formatTrimmed } from "@/lib/helpers";

function Navbar() {
  const { suiAddress } = useApp();
  const suiAutoConnectionStatus = useAutoConnectWallet();
  const isConnected = !!suiAddress;
  const { mutate: disconnectWallet } = useDisconnectWallet();

  return (
    <div className="container mx-auto flex items-center justify-between bg-white/30 backdrop-blur-lg px-8 py-6 rounded-3xl">
      <div className="flex items-center gap-6 min-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            <em className="text-sky-400">tide</em>
            <em className="text-orange-400">flow</em>
          </h1>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink to={ROUTES.home} className={({ isActive }: any) => navigationMenuTriggerStyle({ isActive })}>
                Bridge
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink to={ROUTES.swap} className={({ isActive }) => navigationMenuTriggerStyle({ isActive })}>
                Swap
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink to={ROUTES.staking} className={({ isActive }) => navigationMenuTriggerStyle({ isActive })}>
                Stake
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="flex items-center justify-end gap-6 min-w-md">
        {isConnected ? (
          <Button variant="outline" onClick={() => disconnectWallet()}>
            <img src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${suiAddress}7&flip=false&scale=80&backgroundType=gradientLinear`} alt="Sui Logo" className="w-6 h-6 mr-2 rounded-full" />
            {formatTrimmed(suiAddress, 6)}
          </Button>
        ) : (
          <ConnectModal
            trigger={
              <Button variant="outline" className={"flex mx-auto"}>
                Connect Sui Wallet
                {suiAutoConnectionStatus === "idle" && <Loader2 className="inline-flex h-4 w-4 animate-spin ml-1" />}
              </Button>
            }
          />
        )}


      </div>
    </div>
  );
}

export default Navbar;
