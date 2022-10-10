import { useMemo } from 'react';

import { useMultiMidas } from '@ui/context/MultiMidasContext';

export const useSdk = (chainId?: number) => {
  const { getSdk } = useMultiMidas();

  return useMemo(() => {
    if (chainId) {
      return getSdk(chainId);
    }
  }, [chainId, getSdk]);
};
