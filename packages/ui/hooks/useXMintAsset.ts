import { NativePricedFuseAsset, SupportedChains } from '@midas-capital/types';
import { useMemo } from 'react';

import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { ChainSupportedAssets } from '@ui/utils/networkData';

export const useXMintAsset = (asset: NativePricedFuseAsset) => {
  const { currentChain } = useMultiMidas();

  return useMemo(() => {
    return !currentChain
      ? null
      : ChainSupportedAssets[currentChain.id as SupportedChains].find((a) => {
          return a.symbol === asset.underlyingSymbol;
        });
  }, [currentChain, asset]);
};
