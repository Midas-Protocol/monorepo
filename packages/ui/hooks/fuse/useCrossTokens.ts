/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupportedChains } from '@midas-capital/types';
import { useQueries } from '@tanstack/react-query';
import axios from 'axios';
import { useMemo } from 'react';

import type { Err, TokenData, TokensPerChainStatus } from '@ui/types/ComponentPropsType';
import { tokenListUrls } from '@ui/utils/networkData';

export const useCrossTokens = (chainIds: SupportedChains[]) => {
  const tokensQueries = useQueries({
    queries: chainIds.map((chainId) => {
      return {
        cacheTime: Infinity,
        enabled: !!chainId,
        queryFn: async () => {
          if (chainIds.length > 0) {
            try {
              const { data } = await axios.get(tokenListUrls[chainId.toString()]);

              const tokens: Partial<TokenData>[] = [];

              if (data && data.tokens) {
                data.tokens
                  .filter((t: any) => t.chainId === chainId)
                  .sort((a: any, b: any) => a.address.localeCompare(b.address))
                  .map((t: any) => {
                    tokens.push({
                      address: t.address,
                      color: t.symbol,
                      decimals: t.decimals,
                      extraData: undefined,
                      logoURL: t.logoURI,
                      name: t.name,
                      overlayTextColor: '',
                      symbol: t.symbol,
                    });
                  });
              }

              return tokens;
            } catch (e) {
              console.error(`Unable to fetch tokens of chain \`${chainId}\``, error);

              return [];
            }
          } else {
            return [];
          }
        },
        queryKey: ['useCrossTokens', chainId],
        staleTime: Infinity,
      };
    }),
  });

  const [allTokens, tokensPerChain, isLoading, error] = useMemo(() => {
    const _tokensPerChain: TokensPerChainStatus = {};
    const allTokens: Partial<TokenData>[] = [];

    let isLoading = false;
    let isError = false;
    let error: Err | undefined;

    tokensQueries.map((query, index) => {
      isLoading = isLoading || query.isLoading;
      isError = isError || query.isError;
      error = isError ? (query.error as Err) : undefined;
      const _chainId = chainIds[index];
      _tokensPerChain[_chainId.toString()] = {
        data: query.data,
        error: query.error as Err | undefined,
        isLoading: query.isLoading,
      };

      if (query.data) {
        allTokens.push(...query.data.sort((a: any, b: any) => a.address.localeCompare(b.address)));
      }
    });

    return [allTokens, _tokensPerChain, isLoading, error];
  }, [tokensQueries, chainIds]);

  return { allTokens, error, isLoading, tokensPerChain };
};
