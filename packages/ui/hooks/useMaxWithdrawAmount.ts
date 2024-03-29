import type { NativePricedFuseAsset } from '@midas-capital/types';
import { useQuery } from '@tanstack/react-query';

import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useSdk } from '@ui/hooks/fuse/useSdk';

export function useMaxWithdrawAmount(asset: NativePricedFuseAsset, chainId: number) {
  const { address } = useMultiMidas();
  const sdk = useSdk(chainId);

  return useQuery(
    ['useMaxWithdrawAmount', asset.cToken, sdk?.chainId, address],
    async () => {
      if (sdk && address) {
        const maxRedeem = await sdk.contracts.FusePoolLensSecondary.callStatic
          .getMaxRedeem(address, asset.cToken, { from: address })
          .catch((e) => {
            console.warn(`Getting max withdraw amount error: `, { asset, chainId }, e);

            return null;
          });

        return maxRedeem;
      } else {
        return null;
      }
    },
    {
      cacheTime: Infinity,
      enabled: !!address && !!asset && !!sdk,
      staleTime: Infinity,
    }
  );
}
