import type { SdkConfig as ConnextSdkConfig } from '@connext/sdk';
import { create as createConnextSdk } from '@connext/sdk';
import { chainIdToConfig } from '@midas-capital/chains';
import type { SupportedChains } from '@midas-capital/types';
import { useQuery } from '@tanstack/react-query';

import { SUPPORTED_CHAINS_BY_CONNEXT } from '@ui/constants/index';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useEnabledChains } from '@ui/hooks/useChainConfig';

export const UseConnextSdkByChainId = (chainId?: SupportedChains) => {
  const { address } = useMultiMidas();
  const enabledChains = useEnabledChains();

  return useQuery(
    ['UseConnextSdkByChainId', chainId, enabledChains, address],
    async () => {
      if (address && chainId && enabledChains.length > 0) {
        try {
          const network = SUPPORTED_CHAINS_BY_CONNEXT[chainId]?.network;
          const enabledChainsForConnext = enabledChains.filter((_chainId: number) =>
            Object.keys(SUPPORTED_CHAINS_BY_CONNEXT).includes(_chainId.toString())
          );

          if (network && enabledChains.includes(chainId)) {
            const domainConfig: { [domainId: string]: { providers: string[] } } = {};
            const chainConfig = chainIdToConfig[chainId];

            for (const enabledChainId of enabledChainsForConnext) {
              const domainId = SUPPORTED_CHAINS_BY_CONNEXT[enabledChainId].domainId;

              domainConfig[domainId] = {
                providers: chainConfig.specificParams.metadata.rpcUrls.default.http,
              };
            }

            const connextSdkConfig: ConnextSdkConfig = {
              chains: domainConfig,
              network: network as 'mainnet' | 'testnet',
              signerAddress: address,
            };

            const { sdkBase: connextSdk } = await createConnextSdk(connextSdkConfig);

            return connextSdk;
          }

          return null;
        } catch (e) {
          console.warn(`Getting sdk connext sdk from chainId: `, { chainId }, e);

          return null;
        }
      } else {
        return null;
      }
    },
    {
      cacheTime: Infinity,
      enabled: !!chainId && !!address && enabledChains.length > 0,
      staleTime: Infinity,
    }
  );
};
