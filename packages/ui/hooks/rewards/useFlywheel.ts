import { useQuery } from '@tanstack/react-query';

import { useMultiMidas } from '@ui/context/MultiMidasContext';
import type { Flywheel } from '@ui/types/ComponentPropsType';

export const useFlywheel = (flywheelAddress?: string) => {
  const { currentSdk } = useMultiMidas();

  return useQuery(
    ['useFlywheel', currentSdk?.chainId, flywheelAddress],
    async () => {
      if (!flywheelAddress || !currentSdk) return null;

      const flywheel = currentSdk.createMidasFlywheel(flywheelAddress);

      // TODO add function to FlywheelLensRouter to get all info in one call
      const [booster, rewards, markets, owner, rewardToken] = await Promise.all([
        flywheel.callStatic.flywheelBooster(),
        flywheel.callStatic.flywheelRewards(),
        flywheel.callStatic.getAllStrategies(),
        flywheel.callStatic.owner(),
        flywheel.callStatic.rewardToken(),
      ]);

      return {
        address: flywheel.address,
        booster,
        markets,
        owner,
        rewardToken,
        rewards,
      } as Flywheel;
    },
    {
      cacheTime: Infinity,
      enabled: !!flywheelAddress && !!currentSdk,
      initialData: undefined,
      staleTime: Infinity,
    }
  );
};
