import { ConnectModal, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function SuiConnect() {
  const currentAccount = useCurrentAccount() || {};
  const { mutate: disconnect } = useDisconnectWallet();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sui Integration</CardTitle>
      </CardHeader>
      <CardContent>
        {!currentAccount.address ? (
          <ConnectModal
            trigger={
              <Button variant='outline'>
                Connect Sui Wallet
              </Button>
            }
          />
        ) : (
          <div>
            <p className='mb-2'>
              <strong>Connected:</strong> {currentAccount?.address?.substring(0, 10)}...
              {currentAccount?.address?.substring(currentAccount?.address?.length - 10)}
            </p>
            <div className='flex gap-2 mt-4'>
              <Button
                onClick={disconnect}
                variant='destructive'
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SuiConnect;
