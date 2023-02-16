import { chainIdToConfig } from '@midas-capital/chains';
import { SupportedChains } from '@midas-capital/types';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { COINGECKO_API, DEFI_LLAMA_API } from '@ui/constants/index';
import { getSupportedChainIds } from '@ui/utils/networkData';

interface Price {
  value: number;
  symbol: string;
}

export function useAllUsdPrices() {
  const chainIds = getSupportedChainIds();

  return useQuery(
    ['useAllUsdPrices', ...chainIds.sort()],
    async () => {
      const prices: Record<string, Price> = {};

      await Promise.all(
        chainIds.map(async (id) => {
          const config = chainIdToConfig[id];
          if (config) {
            const _cgId = config.specificParams.cgId;
            try {
              const { data } = await axios.get(`${COINGECKO_API}${_cgId}`);

              if (data[_cgId] && data[_cgId].usd) {
                prices[id.toString()] = { value: data[_cgId].usd, symbol: '$' };
              }
            } catch (e) {
              const { data } = await axios.get(`${DEFI_LLAMA_API}coingecko:${_cgId}`);

              if (data.coins[`coingecko:${_cgId}`] && data.coins[`coingecko:${_cgId}`].price) {
                prices[id.toString()] = {
                  value: data.coins[`coingecko:${_cgId}`].price,
                  symbol: '$',
                };
              }
            }

            if (!prices[id.toString()]) {
              if (config.chainId === chainIdToConfig[SupportedChains.neon_devnet].chainId) {
                prices[id.toString()] = {
                  value: 0.05,
                  symbol: config.specificParams.metadata.nativeCurrency.symbol,
                };
              } else {
                prices[id.toString()] = {
                  value: 1,
                  symbol: config.specificParams.metadata.nativeCurrency.symbol,
                };
              }
            }
          }
        })
      );

      return prices;
    },
    { cacheTime: Infinity, staleTime: Infinity, enabled: !!chainIds && chainIds.length > 0 }
  );
}