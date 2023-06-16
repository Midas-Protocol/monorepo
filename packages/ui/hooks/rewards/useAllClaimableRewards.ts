import type { SupportedChains } from '@midas-capital/types';
import { useQuery } from '@tanstack/react-query';
import type { BigNumber } from 'ethers';
import { constants } from 'ethers';

import { useMultiMidas } from '@ui/context/MultiMidasContext';

interface AllRewardsType {
  amount: BigNumber;
  chainId: SupportedChains;
  rewardToken: string;
}

export const useAllClaimableRewards = (chainIds: SupportedChains[]) => {
  const { address, getSdk } = useMultiMidas();

  return useQuery(
    ['useAllClaimableRewards', chainIds, address],
    async () => {
      if (chainIds.length > 0 && address) {
        const allRewards: AllRewardsType[] = [];

        await Promise.all(
          chainIds.map(async (chainId) => {
            const sdk = getSdk(chainId);

            if (sdk) {
              const rewards = await sdk.getAllFlywheelClaimableRewards(address);
              rewards.map((reward) => {
                if (reward.amount.gt(constants.Zero)) {
                  allRewards.push({
                    amount: reward.amount,
                    chainId,
                    rewardToken: reward.rewardToken,
                  });
                }
              });
            }
          })
        );

        return allRewards;
      }

      return null;
    },
    {
      cacheTime: Infinity,
      enabled: !!address || chainIds.length > 0,
      staleTime: Infinity,
    }
  );
};
