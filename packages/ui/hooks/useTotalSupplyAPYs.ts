import { assetSymbols } from '@midas-capital/types';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useSdk } from '@ui/hooks/fuse/useSdk';
import { useAnkrBNBApr } from '@ui/hooks/useAnkrBNBApr';
import { UseAssetsData } from '@ui/hooks/useAssets';
import { UseRewardsData } from '@ui/hooks/useRewards';
import { MarketData } from '@ui/types/TokensDataMap';
import { getBlockTimePerMinuteByChainId } from '@ui/utils/networkData';

export const useTotalSupplyAPYs = (
  assets: MarketData[],
  chainId?: number,
  allRewards?: UseRewardsData,
  assetInfos?: UseAssetsData
) => {
  const sdk = useSdk(chainId);
  const isEnabled = useMemo(() => {
    return !!assets.find((asset) => asset.underlyingSymbol === assetSymbols.ankrBNB);
  }, [assets]);

  const { data: ankrBNBApr } = useAnkrBNBApr(isEnabled, chainId);

  return useQuery(
    [
      'useTotalSupplyAPYs',
      assets.sort((a, b) => a.cToken.localeCompare(b.cToken)).toString(),
      sdk?.chainId,
      allRewards?.toString(),
      assetInfos?.toString(),
      ankrBNBApr,
    ],
    async () => {
      if (!sdk || !assets || !chainId) return null;

      const result: { [market: string]: number } = {};

      for (const asset of assets) {
        let marketTotalAPY =
          sdk.ratePerBlockToAPY(asset.supplyRatePerBlock, getBlockTimePerMinuteByChainId(chainId)) /
          100;

        if (asset.underlyingSymbol === assetSymbols.ankrBNB && ankrBNBApr) {
          marketTotalAPY += Number(ankrBNBApr) / 100;
        }

        if (allRewards && allRewards[asset.cToken]) {
          marketTotalAPY += allRewards[asset.cToken].reduce(
            (acc, cur) => (cur.apy ? acc + cur.apy : acc),
            0
          );
        }

        if (assetInfos && assetInfos[asset.underlyingToken.toLowerCase()]) {
          assetInfos[asset.underlyingToken.toLowerCase()].map((reward) => {
            if (reward.apy) marketTotalAPY += reward.apy;
          });
        }

        result[asset.cToken] = marketTotalAPY;
      }

      return result;
    },
    { cacheTime: Infinity, staleTime: Infinity, enabled: !!sdk && !!assets && !!chainId }
  );
};
