import { useQuery } from '@tanstack/react-query';

import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useMemo } from 'react';

export function useNativeBalance(ownerAddress?: string) {
  const { currentSdk, currentChain, address: connectedAddress } = useMultiMidas();

  const owner = useMemo(() => {
    return ownerAddress ? ownerAddress : connectedAddress;
  }, [ownerAddress, connectedAddress]);

  return useQuery(
    ['useNativeBalance', currentChain?.id, owner],
    () => {
      if (currentSdk && owner) return currentSdk.provider.getBalance(owner);
    },
    {
      enabled: !!currentChain && !!owner && !!currentSdk,
    }
  );
}
