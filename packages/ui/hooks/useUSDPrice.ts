import axios from 'axios';
import { useQuery } from 'react-query';

export function useUSDPrice(chainId: string) {
  return useQuery(
    ['useUSDPrice', chainId],
    async () => {
      const res = await axios.get(`/api/getUsdPrice?chainId=${chainId}`);

      return res.data.usdPrice;
    },
    { cacheTime: Infinity, staleTime: Infinity, enabled: !!chainId }
  );
}
