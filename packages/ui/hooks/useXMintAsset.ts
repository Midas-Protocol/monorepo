import { NativePricedFuseAsset, SupportedChains } from '@midas-capital/types';
import { useMemo } from 'react';

import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { ChainSupportedAssets } from '@ui/utils/networkData';

export const useXMintAsset = (asset: NativePricedFuseAsset) => {
  const { currentChain } = useMultiMidas();

  return useMemo(() => {
    if (!currentChain) return null;

    return ChainSupportedAssets[currentChain.id as SupportedChains].find((a) => {
      return a.symbol === (asset.underlyingSymbol === 'ETH' ? 'WETH' : asset.underlyingSymbol);
    });
  }, [currentChain, asset]);
};
