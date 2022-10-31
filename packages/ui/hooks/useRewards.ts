import { FlywheelReward, Reward } from '@midas-capital/types';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { utils } from 'ethers';

import { RewardsResponse } from '../pages/api/rewards';

import { useFusePoolData } from './useFusePoolData';

import { useSdk } from '@ui/hooks/fuse/useSdk';

interface UseRewardsProps {
  chainId: number;
  poolId: string;
}

export interface UseRewardsData {
  [key: string]: Reward[];
}
export function useRewards({ poolId, chainId }: UseRewardsProps) {
  const { data: poolData } = useFusePoolData(poolId, Number(chainId));
  const sdk = useSdk(chainId);

  return useQuery<UseRewardsData>(
    ['useRewards', chainId, poolData?.comptroller],
    async () => {
      if (chainId && sdk && poolData) {
        const allFlywheelRewards = await sdk.getFlywheelMarketRewardsByPoolWithAPR(
          poolData.comptroller
        );

        const rewardsOfMarkets: UseRewardsData = {};
        await Promise.all(
          poolData.assets.map(async (asset) => {
            let pluginRewards: RewardsResponse = [];
            if (asset.plugin) {
              pluginRewards = await axios
                .get(`/api/rewards?chainId=${chainId}&pluginAddress=${asset.plugin}`)
                .then((response) => response.data)
                .catch((error) => {
                  console.error(`Unable to fetch reward for ${asset.plugin}`, error);
                  return [];
                });
            }

            const flywheelRewards = allFlywheelRewards.find(
              (fwRewardsInfo) => fwRewardsInfo.market === asset.cToken
            );
            const allRewards = [...pluginRewards];
            if (flywheelRewards) {
              const flywheelsInPluginResponse = pluginRewards
                .map((pluginReward) =>
                  'flywheel' in pluginReward ? pluginReward.flywheel.toLowerCase() : null
                )
                .filter((f) => !!f) as string[];
              for (const info of flywheelRewards.rewardsInfo) {
                if (
                  !flywheelsInPluginResponse.includes(info.flywheel.toLowerCase()) &&
                  info.formattedAPR
                ) {
                  allRewards.push({
                    flywheel: info.flywheel,
                    updated_at: new Date().toISOString(),
                    apy: parseFloat(utils.formatUnits(info.formattedAPR, 18)),
                    token: info.rewardToken,
                  } as FlywheelReward);
                }
              }
            }
            rewardsOfMarkets[asset.cToken] = allRewards;
          })
        );
        return rewardsOfMarkets;
      }
      return {};
    },
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      enabled: !!poolData,
    }
  );
}