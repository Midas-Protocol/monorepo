import { NativePricedFuseAsset } from '@midas-capital/types';
import { utils } from 'ethers';
import { useMemo } from 'react';

import { useMidas } from '@ui/context/MidasContext';
import { useUSDPrice } from '@ui/hooks/useUSDPrice';

export const useBorrowLimit = <T extends NativePricedFuseAsset>(
  assets: T[],
  options?: { ignoreIsEnabledCheckFor?: string }
): number => {
  const { currentChain } = useMidas();
  const { data: usdPrice } = useUSDPrice(currentChain.id.toString());
  return useMemo(() => {
    if (!usdPrice) return 0;
    let _maxBorrow = 0;

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      if (options?.ignoreIsEnabledCheckFor === asset.cToken || asset.membership) {
        _maxBorrow +=
          asset.supplyBalanceNative *
          parseFloat(utils.formatUnits(asset.collateralFactor, asset.underlyingDecimals)) *
          usdPrice;
      }
    }
    return _maxBorrow;
  }, [assets, options?.ignoreIsEnabledCheckFor, usdPrice]);
};
