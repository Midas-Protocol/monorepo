import type { SupportedChains } from '@midas-capital/types';
import { useQuery } from '@tanstack/react-query';

import { SUPPORTED_CHAINS_BY_CONNEXT } from '@ui/constants/index';
import { UseConnextSdkByChainId } from '@ui/hooks/fuse/UseConnextSdkByChainId';

export const useConnextEstimatedFees = (
  originChain?: SupportedChains,
  destinationChain?: SupportedChains
) => {
  const { data: connextSdk } = UseConnextSdkByChainId(originChain);

  return useQuery(
    ['useConnextEstimatedFees', originChain, destinationChain, connextSdk?.config],
    async () => {
      if (originChain && destinationChain && connextSdk) {
        try {
          const origin = SUPPORTED_CHAINS_BY_CONNEXT[originChain].domainId;
          const destination = SUPPORTED_CHAINS_BY_CONNEXT[destinationChain].domainId;

          // Calculate relayer fee
          const estimateRelayerFeeParams = {
            destinationDomain: destination,
            isHighPriority: true,
            originDomain: origin,
          };

          const fee = await connextSdk.estimateRelayerFee(estimateRelayerFeeParams);

          return fee;
        } catch (e) {
          console.warn(
            `Getting connext estimated gas error: `,
            { connextConfig: connextSdk.config, destinationChain, originChain },
            e
          );

          return null;
        }
      } else {
        return null;
      }
    },
    {
      cacheTime: Infinity,
      enabled: !!originChain && !!destinationChain && !!connextSdk,
      staleTime: Infinity,
    }
  );
};
