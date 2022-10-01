import { useQuery } from '@tanstack/react-query';

import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useExtraPoolInfo } from '@ui/hooks/fuse/useExtraPoolInfo';

export const useIsEditableAdmin = (comptrollerAddress?: string, poolChainId?: number) => {
  const { data: poolInfo } = useExtraPoolInfo(comptrollerAddress, poolChainId);
  const { currentChain } = useMultiMidas();

  const { data } = useQuery(
    [
      'useIsEditableAdmin',
      comptrollerAddress || '',
      poolInfo?.isPowerfulAdmin || '',
      currentChain?.id || '',
      poolChainId || '',
    ],
    async () => {
      if (
        comptrollerAddress &&
        poolInfo?.isPowerfulAdmin &&
        currentChain &&
        currentChain.id === poolChainId
      ) {
        return true;
      }
    },
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      enabled:
        !!comptrollerAddress && !!poolInfo?.isPowerfulAdmin && !!currentChain?.id && !!poolChainId,
    }
  );

  return data;
};
