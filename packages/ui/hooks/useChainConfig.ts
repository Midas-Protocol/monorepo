import type { ChainConfig } from '@midas-capital/types';
import { useMemo } from 'react';

import { getChainConfig, getEnabledChains } from '@ui/utils/networkData';

export function useCgId(chainId?: number) {
  return useMemo(() => {
    if (chainId) {
      const chainConfig = getChainConfig(chainId);

      return chainConfig ? chainConfig.specificParams.cgId : '';
    } else {
      return '';
    }
  }, [chainId]);
}

export function useChainConfig(chainId?: number) {
  return useMemo(() => {
    if (chainId) {
      const chainConfig = getChainConfig(chainId);

      return chainConfig;
    }
  }, [chainId]);
}

export function useChainsConfig(chainIds?: number[]) {
  return useMemo(() => {
    if (chainIds) {
      const configs: { [chainId: string]: ChainConfig } = {};

      chainIds.map((chainId) => {
        const chainConfig = getChainConfig(chainId);

        if (chainConfig) {
          configs[chainId.toString()] = chainConfig;
        }
      });

      return configs;
    }
  }, [chainIds]);
}

export function useEnabledChains() {
  return useMemo(() => {
    return getEnabledChains();
  }, []);
}
