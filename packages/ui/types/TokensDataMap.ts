import { NativePricedFuseAsset, FusePoolData as SDKFusePoolData } from '@midas-capital/types';
import { BigNumber } from 'ethers';

export type MidasApiTokenData = {
  symbol: string;
  name: string;
  decimals: number;
  color: string;
  overlayTextColor: string;
  address: string;
  logoURL: string;
};

export type TokensDataMap = { [address: string]: MidasApiTokenData };

export interface MarketData extends NativePricedFuseAsset {
  supplyBalanceFiat: number;
  borrowBalanceFiat: number;
  totalSupplyFiat: number;
  totalBorrowFiat: number;
  liquidityFiat: number;
}

export interface PoolData extends SDKFusePoolData {
  assets: MarketData[];
  totalLiquidityFiat: number;
  totalAvailableLiquidityFiat: number;
  totalSuppliedFiat: number;
  totalBorrowedFiat: number;
  totalSupplyBalanceFiat: number;
  totalBorrowBalanceFiat: number;
}

export interface VaultData {
  asset: string;
  chainId: number;
  estimatedTotalAssets: BigNumber;
  symbol: string;
}
