import { SupportedChains } from '@midas-capital/types';
import { useMemo } from 'react';

import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { MarketData } from '@ui/types/TokensDataMap';
import { ChainSupportedAssets } from '@ui/utils/networkData';

export const useXMintAsset = (asset: MarketData) => {
  const { currentChain } = useMultiMidas();

  return useMemo(() => {
    return ChainSupportedAssets[currentChain.id as SupportedChains].find((a) => {
      return a.symbol === asset.underlyingSymbol;
    });
  }, [currentChain, asset]);
};
