import { useQuery } from '@tanstack/react-query';

import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { getCTokenContract } from '@ui/utils/contracts';
import { useMemo } from 'react';

export function useTokenBalance(tokenAddress: string, ownerAddress?: string) {
  const { currentSdk, currentChain, address: connectedAddress } = useMultiMidas();
  const owner = useMemo(() => {
    return ownerAddress ? ownerAddress : connectedAddress;
  }, [ownerAddress, connectedAddress]);

  return useQuery(
    ['useTokenBalance', currentChain?.id, tokenAddress, owner],
    () => {
      if (currentSdk && owner)
        return getCTokenContract(tokenAddress, currentSdk).callStatic.balanceOf(owner);
    },
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      enabled: !!currentChain && !!currentSdk && !!tokenAddress && !!owner,
    }
  );
}
