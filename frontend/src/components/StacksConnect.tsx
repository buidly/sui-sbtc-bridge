import { useEffect, useState } from 'react';
import { connect, disconnect, getLocalStorage, isConnected, StorageData } from '@stacks/connect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function StacksConnect() {
  const [userData, setUserData] = useState<StorageData | null>(null);

  useEffect(() => {
    if (isConnected()) {
      setUserData(getLocalStorage());
    }
  }, []);

  const connectWallet = async () => {
    await connect();

    setUserData(getLocalStorage());
  };

  const disconnectWallet = () => {
    disconnect();
    setUserData(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stacks Integration</CardTitle>
      </CardHeader>
      <CardContent>
        {!userData ? (
          <Button
            onClick={connectWallet}
            variant='secondary'
          >
            Connect Stacks Wallet
          </Button>
        ) : (
          <div>
            <p className='mb-2'>
              <strong>Connected:</strong> {userData.addresses.stx[0].address?.substring(0, 10)}...
              {userData.addresses.stx[0].address.substring(userData.addresses.stx[0].address.length - 10)}
            </p>
            <div className='flex gap-2 mt-4'>
              <Button
                onClick={disconnectWallet}
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

export default StacksConnect;
