import type { FlywheelRewardsInfoForVault, SupportedChains } from '@midas-capital/types';
import { useQuery } from '@tanstack/react-query';

import { useMultiMidas } from '@ui/context/MultiMidasContext';

export const useClaimableRewardsForVaults = (chainIds: SupportedChains[]) => {
  const { address, getSdk } = useMultiMidas();

  return useQuery<FlywheelRewardsInfoForVault[] | null | undefined>(
    ['useClaimableRewardsForVaults', address],
    async () => {
      const res: FlywheelRewardsInfoForVault[] = [];

      await Promise.all(
        chainIds.map(async (chainId) => {
          const sdk = getSdk(Number(chainId));

          if (sdk && address) {
            const rewardsOfChain = await sdk.getClaimableRewardsForVaults(address).catch((e) => {
              console.warn(`Getting claimable rewards for vaults error: `, { chainId }, e);

              return [] as FlywheelRewardsInfoForVault[];
            });

            res.push(...rewardsOfChain);
          }
        })
      );

      return res;
    },
    {
      cacheTime: Infinity,
      enabled: !!address,
      staleTime: Infinity,
    }
  );
};
