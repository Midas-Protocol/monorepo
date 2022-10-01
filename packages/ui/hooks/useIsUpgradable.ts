import { useQuery } from '@tanstack/react-query';

import { useMultiMidas } from '@ui/context/MultiMidasContext';

export const useIsUpgradeable = (comptrollerAddress: string) => {
  const { currentSdk, currentChain } = useMultiMidas();

  const { data } = useQuery(
    ['useIsUpgradeable', currentChain?.id || '', comptrollerAddress, currentSdk?.chainId || ''],
    async () => {
      if (currentSdk) {
        const comptroller = currentSdk.createComptroller(comptrollerAddress);

        const isUpgradeable: boolean = await comptroller.callStatic.adminHasRights();

        return isUpgradeable;
      }
    },
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      enabled: !!comptrollerAddress && !!currentChain && !!currentSdk,
    }
  );

  return data;
};
