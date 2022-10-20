import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useMultiMidas } from '@ui/context/MultiMidasContext';

export function useNativeTokenBalance(ownerAddress?: string) {
  const { currentSdk, currentChain, address: connectedAddress } = useMultiMidas();

  const owner = useMemo(() => {
    return ownerAddress ? ownerAddress : connectedAddress;
  }, [ownerAddress, connectedAddress]);

  return useQuery(
    ['useNativeTokenBalance', currentChain?.id, owner],
    () => {
      if (currentSdk && owner) return currentSdk.provider.getBalance(owner);
    },
    {
      enabled: !!currentChain && !!owner && !!currentSdk,
    }
  );
}
