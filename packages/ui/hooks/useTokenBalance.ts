import { MidasSdk } from '@midas-capital/sdk';
import { useQuery } from '@tanstack/react-query';

import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { BigNumber } from 'ethers';
import { useMemo } from 'react';

export const fetchTokenBalance = async (
  tokenAddress: string,
  sdk: MidasSdk,
  ownerAddress?: string
): Promise<BigNumber> => {
  if (!ownerAddress) return BigNumber.from(0);
  return sdk.getCTokenInstance(tokenAddress).balanceOf(ownerAddress);
};

export function useTokenBalance(tokenAddress: string, ownerAddress?: string) {
  const { currentSdk, currentChain, address: connectedAddress } = useMultiMidas();
  const owner = useMemo(() => {
    return ownerAddress ? ownerAddress : connectedAddress;
  }, [ownerAddress, connectedAddress]);

  return useQuery(
    ['useTokenBalance', currentChain?.id, tokenAddress, owner],
    () => {
      if (currentSdk && owner) return fetchTokenBalance(tokenAddress, currentSdk, owner);
    },
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      enabled: !!currentChain && !!currentSdk && !!tokenAddress && !!owner,
    }
  );
}
