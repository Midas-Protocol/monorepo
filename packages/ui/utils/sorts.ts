import { FusePoolData, SupportedAsset } from '@midas-capital/types';

import { MarketData, PoolData } from '@ui/types/TokensDataMap';

export const sortAssets = (assets: MarketData[]) => {
  return assets.sort((a, b) => {
    return a.underlyingSymbol.localeCompare(b.underlyingSymbol);
  });
};

export const sortTopBorrowedAssets = (assets: MarketData[]) => {
  return [...assets].sort((a, b) => {
    return b.totalBorrowFiat - a.totalBorrowFiat;
  });
};

export const sortTopSuppliedAssets = (assets: MarketData[]) => {
  return [...assets].sort((a, b) => {
    return b.totalSupplyFiat - a.totalSupplyFiat;
  });
};

export const sortTopLiquidityAssets = (assets: MarketData[]) => {
  return [...assets]
    .filter((asset) => !asset.isBorrowPaused)
    .sort((a, b) => {
      return b.liquidityFiat - a.liquidityFiat;
    });
};

export const sortTopUtilizationAssets = (assets: MarketData[]) => {
  return [...assets].sort((a, b) => {
    return b.utilization - a.utilization;
  });
};

export const sortSupportedAssets = (assets: SupportedAsset[]) => {
  return assets.sort((a, b) => {
    return a.symbol.localeCompare(b.symbol);
  });
};

export const poolSort = (pools: FusePoolData[]) => {
  return pools.sort((a, b) => {
    if (b.totalSuppliedNative > a.totalSuppliedNative) {
      return 1;
    }

    if (b.totalSuppliedNative < a.totalSuppliedNative) {
      return -1;
    }

    // They're equal, let's sort by pool number:
    return b.id > a.id ? 1 : -1;
  });
};

export const poolSortByAddress = (pools: PoolData[]) => {
  return pools.sort((a, b) => {
    return a.comptroller.localeCompare(b.comptroller);
  });
};

export const sortTopUserSuppliedAssets = (assets: MarketData[]) => {
  return [...assets].sort((a, b) => {
    return b.supplyBalanceFiat - a.supplyBalanceFiat;
  });
};

export const sortTopUserBorrowedAssets = (assets: MarketData[]) => {
  return [...assets].sort((a, b) => {
    return b.borrowBalanceFiat - a.borrowBalanceFiat;
  });
};
