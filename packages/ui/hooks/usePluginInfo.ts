import { useQuery } from '@tanstack/react-query';

import { useSdk } from '@ui/hooks/fuse/useSdk';

export const usePluginInfo = (poolChainId: number, pluginAddress?: string) => {
  const { data: sdk } = useSdk(poolChainId);

  return useQuery(
    ['usePluginInfo', pluginAddress, sdk?.chainId],
    () => {
      if (sdk) {
        return pluginAddress && sdk.deployedPlugins[pluginAddress]
          ? sdk.deployedPlugins[pluginAddress]
          : {
              name: `Unnamed (${pluginAddress})`,
              market: '',
              apyDocsUrl: '',
              strategyDocsUrl: '',
            };
      }
    },
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      enabled: !!pluginAddress && !!sdk,
    }
  );
};
