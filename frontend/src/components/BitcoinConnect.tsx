import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import Wallet, { AddressPurpose, request } from 'sats-connect';

function BitcoinConnect() {
  const [btcAddress, setBtcAddress] = useState<string | null>(null);

  const processConnect = (res) => {
    if (res.status === 'error') {
      console.error('Error connecting to wallet, details in terminal.');
      console.error(res);
      return;
    }
    const btcAddresses = res.result.addresses.filter((a) =>
      [AddressPurpose.Payment].includes(a.purpose),
    );
    setBtcAddress(btcAddresses[0].address);
  }

  useEffect(() => {
    const reconnect = async () => {
      const res = await request('wallet_getAccount', null);

      processConnect(res);
    };

    reconnect();
  }, []);

  const connectWallet = async () => {
    const res = await Wallet.request('wallet_connect', {
      message: 'Cool app wants to know your addresses!',
      addresses: [AddressPurpose.Payment],
    });

    processConnect(res);
  };

  const disconnectWallet = async () => {
    await Wallet.disconnect();
    setBtcAddress(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bitcoin Integration</CardTitle>
      </CardHeader>
      <CardContent>
        {!btcAddress ? (
          <Button
            onClick={connectWallet}
            variant='default'
          >
            Connect Bitcoin Wallet
          </Button>
        ) : (
          <div>
              <p className='mb-2'>
                <strong>Connected:</strong> {btcAddress?.substring(0, 10)}...
                {btcAddress.substring(btcAddress.length - 10)}
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

export default BitcoinConnect;
