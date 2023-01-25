import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export type usePoolInfoData = {
  markets: {
    [marketAddress: string]: {
      name?: string;
    };
  };
};
export function usePoolInfo(chainId?: string, comptrollerAddress?: string) {
  return useQuery<usePoolInfoData>(
    ['usePoolInfo', chainId, comptrollerAddress],
    async () => {
      if (chainId && comptrollerAddress) {
        return axios
          .get(`/api/chain/${chainId}/comptroller/${comptrollerAddress}`)
          .then((response) => response.data)
          .catch((error) => {
            console.error(
              `Unable to fetch info of comptroller \`${comptrollerAddress}\` of chain \`${chainId}\``,
              error
            );

            return {};
          });
      } else {
        return null;
      }
    },
    {
      cacheTime: Infinity,
      staleTime: Infinity,
    }
  );
}
