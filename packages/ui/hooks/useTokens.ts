import type { TokenData } from '@ui/types/ComponentPropsType';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { tokenListUrls } from '@ui/utils/networkData';

export function useTokens(chainId?: number) {
  return useQuery<TokenData[]>(
    ['useTokensDataAPI', chainId],
    async () => {
      return axios
        .get(tokenListUrls[chainId || 0])
        .then((response) =>
          response.data.tokens
            .filter((t: any) => t.chainId === chainId)
            .map((t: any) => ({
              address: t.address,
              color: t.symbol,
              decimals: t.decimals,
              extraData: null,
              logoURL: t.logoURI,
              name: t.name,
              overlayTextColor: '',
              symbol: t.symbol,
            }))
        )
        .catch((error) => {
          console.error(`Unable to fetch tokens of chain \`${chainId}\``, error);
          return [];
        });
    },
    {
      cacheTime: Infinity,
      staleTime: Infinity,
    }
  );
}
