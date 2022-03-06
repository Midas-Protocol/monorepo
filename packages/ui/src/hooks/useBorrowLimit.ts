import { USDPricedFuseAsset } from '@midas-capital/sdk';
import { utils } from 'ethers';
import { useMemo } from 'react';

export const useBorrowLimit = (
  assets: USDPricedFuseAsset[],
  options?: { ignoreIsEnabledCheckFor?: string }
): number => {
  return useMemo(() => {
    let _maxBorrow = 0;

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      if (options?.ignoreIsEnabledCheckFor === asset.cToken || asset.membership) {
        _maxBorrow +=
          asset.supplyBalanceUSD *
          parseFloat(utils.formatUnits(asset.collateralFactor, asset.underlyingDecimals));
      }
    }
    return _maxBorrow;
  }, [assets, options?.ignoreIsEnabledCheckFor]);
};
